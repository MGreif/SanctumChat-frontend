import { Layout } from "../layout"
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthService } from "../auth/AuthService";
import classes from "./chat.module.css"
import { TUser, TUserRaw } from "../types/user";
import { EHTTPMethod, fetchRequest, useFetchEndpoint } from "../utils/fetch";
import { useAuth } from "../auth/useAuth";
import { UserNavItem } from "./UserNavItem";
import { Button, FileInput, TextInput } from "@mantine/core";
import { USE_SSL, buildApiUrl } from "../constants.ts";
import { fromBase64 } from "js-base64";
import { JSEncryptRSAKey } from "jsencrypt/lib/JSEncryptRSAKey";
import { showErrorNotification, showNotification } from "../misc/Notifications/Notifications.ts";
import { TApiResponse } from "../types/Api.ts";
import { notifications } from "@mantine/notifications";

export type TUIMessageMeta = {
    read: boolean,
}

type TYPE = "SOCKET_MESSAGE_DIRECT" | "SOCKET_MESSAGE_NOTIFICATION" | "SOCKET_MESSAGE_EVENT" | "SOCKET_MESSAGE_ONLINE_USERS" | "SOCKET_MESSAGE_STATUS_CHANGE" | "SOCKET_MESSAGE_FRIEND_REQUEST"

export type TMessageDirect = TUIMessageMeta & {
    recipient: string,
    message: string,
    sender: string,
    message_self_encrypted: string,
    message_decrypted?: string
    message_verified?: boolean
}

export type TMessageDTO = Omit<TMessageDirect, "read" | "message" | "message_self_encrypted" | "message_decrypted"> & {
    sender: string,
    content: string
    content_self_encrypted: string,
    TYPE: TYPE
}

export type TMessageInitialOnlineUsers = {
    online_users: string[]
    TYPE: TYPE
}

export type TMessage = TMessageDirect | TMessageInitialOnlineUsers | TMessageStatusChange | TMessageFriendRequest | TMessageNotification

export enum EEvent {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE",
}


export type TMessageStatusChange = {
    status: EEvent,
    user_id: string
    TYPE: TYPE
}

export type TMessageFriendRequest = {
    sender_username: string,
    friend_request_id: string
    TYPE: TYPE

}

export type TMessageNotification = {
    title: string,
    message: string,
    status: "error" | "success" | "info"
    TYPE: TYPE

}

const decryptMessages = (messages: TMessageDirect[], private_key: string, recipient_public_key: string): TMessageDirect[] | null => {
    try {
        const selfRSA = new JSEncryptRSAKey(private_key)
        return messages.map(m => {
            const self_send = m.sender === AuthService.Instance.decodedToken?.sub

            if (self_send) {
                m.message_decrypted = selfRSA.decrypt(m.message_self_encrypted)
            } else {
                m.message_decrypted = selfRSA.decrypt(m.message)
            }

            return m
        })
    } catch (err) {
        showErrorNotification({
            message: "Could not decrypt messages. Check RSA Private key file",
            title: "Decryption error"
        })
        return null
    }
}


export const Chat = () => {
    const connection = useRef<WebSocket | null>(null)
    const [messages, _setMessages] = useState<TMessageDirect[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const [privateKey, setPrivateKey] = useState<string | null>(null)
    const privateKeyRef = useRef(privateKey)
    const chatContainer = useRef<HTMLDivElement>(null)
    const handleMessageReceive = useCallback((message: TMessageDirect) => {
        _setMessages(messages => {
            const adjusted = [
                ...messages,
                { ...message, read: false }
            ]

            const recipient = users?.find(u => u.username === activeChat)
            if (!recipient) return adjusted

            if (!privateKeyRef.current) return adjusted

            const decrypted = decryptMessages(adjusted, privateKeyRef.current, recipient.public_key)
            return decrypted || adjusted
        })
    }, [messages])

    useEffect(() => {
        localRef.current.onDirectMessageReceive = handleMessageReceive
    }, [handleMessageReceive])

    const localRef = useRef({
        onDirectMessageReceive: handleMessageReceive,

    })
    const auth = useAuth()

    const { data: users, refetch } = useFetchEndpoint<object, TApiResponse<TUserRaw[]>, TUser[]>({
        url: buildApiUrl("/friends"),
        fetchOptions: {
            transform: (response) => response?.data?.map(u => ({ ...u, public_key: String.fromCharCode(...u.public_key) })) || [],
            method: EHTTPMethod.GET,
        }
    }, { skip: !auth.isLoggedIn })

    const [onlineUsers, setOnlineUsers] = useState<string[]>([])
    const [activeChat, setActiveChat] = useState<string | null>(null)

    useEffect(() => {
        if (!chatContainer.current) return
        chatContainer.current.scrollTop = chatContainer.current.offsetHeight
    }, [messages])

    const setMessages = (messages: TMessageDirect[]) => {
        if (!privateKey) {
            _setMessages(messages)
            return
        }
        const recipient = users?.find(u => u.username === activeChat)
        if (!recipient) return

        const decrypted = decryptMessages(messages, privateKey, recipient.public_key)
        if (!decrypted) return
        _setMessages(decrypted)
    }
    useEffect(() => {
        if (!activeChat) return
        fetchRequest(buildApiUrl("/messages?origin=" + activeChat), {
            method: EHTTPMethod.GET,
        }).then(({ body }) => {
            const b: TMessageDirect[] = (body as TMessageDTO[]).map(m => ({
                message: m.content,
                read: true,
                recipient: m.recipient,
                sender: m.sender,
                message_self_encrypted: m.content_self_encrypted
            }))
            setMessages(b)
        })
    }, [activeChat])



    const handleFriendRequestClick = useCallback(({ id, accepted }: { id: string, accepted: boolean }) => {
        fetchRequest<{ accepted: boolean }>(buildApiUrl("/friend-requests/" + id), {
            method: EHTTPMethod.PATCH,
            body: {
                accepted
            }
        }).then(() => {
            refetch()
            notifications.hide(id)
        })
    }, [])
    const handleMessage = (event: MessageEvent<any>) => {
        let message: TMessage | null
        try {
            message = JSON.parse(event.data)
        } catch (err) {
            message = null
        }
        if (!message) return

        if ((message as TMessageInitialOnlineUsers).TYPE === "SOCKET_MESSAGE_ONLINE_USERS") {
            setOnlineUsers((message as TMessageInitialOnlineUsers).online_users || [])
            return
        }

        if ((message as TMessageStatusChange).TYPE === "SOCKET_MESSAGE_STATUS_CHANGE") {
            const { status, user_id } = message as TMessageStatusChange
            if (status === EEvent.ONLINE) {
                setOnlineUsers([...onlineUsers, user_id])
            } else if (status === EEvent.OFFLINE) {
                setOnlineUsers(onlineUsers.filter(u => u !== user_id))
            }
            return
        }

        if ((message as TMessageFriendRequest).TYPE === "SOCKET_MESSAGE_FRIEND_REQUEST") {
            const { sender_username, friend_request_id } = message as TMessageFriendRequest
            showNotification({
                type: "info",
                id: friend_request_id,
                message: <>{sender_username} sent you a friend request <div className={classes.friendrequest}>
                    <Button color={"green"} onClick={() => handleFriendRequestClick({ id: friend_request_id, accepted: true })}>Accept</Button>
                    <Button color={"red"} onClick={() => handleFriendRequestClick({ id: friend_request_id, accepted: false })}>Deny</Button>
                </div></>,
                title: "New Friend Request",
            })
        }

        if ((message as TMessageNotification).TYPE === "SOCKET_MESSAGE_NOTIFICATION") {
            const { title, status, message: m } = message as TMessageNotification
            showNotification({
                type: status,
                message: m,
                title: title
            })
        }


        localRef.current.onDirectMessageReceive(message as TMessageDirect)
    }

    useEffect(() => {
        connection.current?.addEventListener("message", handleMessage)

        return () => connection.current?.removeEventListener("message", handleMessage)

    }, [connection.current, onlineUsers])


    useEffect(() => {

        if (!auth.isLoggedIn) {
            return
        }

        // close active connection
        connection.current?.close()

        const socket = new WebSocket(buildApiUrl(`/ws?token=${AuthService.Instance.token}`, USE_SSL ? "wss://" : "ws://"))
        // Connection opened
        socket.addEventListener("open", (event) => {
            console.log("Connection established ...", event)
        })

        socket.addEventListener("error", (err) => {
            console.log("Connection failed ...", err)
        })

        // Listen for messages



        connection.current = socket

        return () => connection.current?.close()
    }, [auth.isLoggedIn])

    const handleClick = () => {
        if (!inputRef.current?.value) return
        const recipient = users?.find(u => u.username === activeChat)
        if (!recipient) return
        const public_key_encoded = recipient.public_key
        const public_key_decoded = fromBase64(public_key_encoded)
        const message = inputRef.current.value
        const recipientRSA = new JSEncryptRSAKey(public_key_decoded)
        const selfRSA = new JSEncryptRSAKey(fromBase64(AuthService.Instance.decodedToken!.public_key))
        const encrypted_message = recipientRSA.encrypt(message)
        const message_self_encrypted = selfRSA.encrypt(message)
        const preparedText = JSON.stringify({ recipient: activeChat, message: encrypted_message, message_self_encrypted })
        inputRef.current?.value && connection.current?.send(preparedText)
        inputRef.current.value = ""
    }

    const handleChatChange = (userId: string) => {
        setActiveChat(userId)

        const readMessages = messages.reduce<TMessageDirect[]>((acc, curr) => {
            if (curr.sender !== activeChat) return [...acc, curr]

            return [...acc, { ...curr, read: true }]
        }, [])

        setMessages(readMessages)
    }


    const handleFileInput = async (file: File | null) => {
        const fileContent = await file?.text()
        if (!fileContent) return
        setPrivateKey(fileContent)
        privateKeyRef.current = fileContent
    }

    useEffect(() => {
        if (!privateKey) return
        decryptCurrentMessages(privateKey)
    }, [privateKey])

    const decryptCurrentMessages = async (private_key: string) => {
        const recipient = users?.find(u => u.username === activeChat)
        if (!recipient) return

        const decryptedMessages = decryptMessages(messages, private_key, recipient.public_key)
        if (!decryptedMessages) return
        setMessages(decryptedMessages)
    }

    if (!auth.isLoggedIn) {
        return <Layout title="You are not logged in, please login"></Layout>
    }

    const messagesForChat = messages.filter(m => m.recipient === activeChat || m.sender === activeChat)
    return <Layout title="Chat">
        <div className={classes.grid}>
            <nav>
                {users?.filter(u => u.username !== auth.token?.sub).map(u =>
                    <UserNavItem
                        key={u.username}
                        isActiveChat={activeChat === u.username}
                        isOnline={onlineUsers.includes(u.username)}
                        user={u}
                        onClick={(user) => handleChatChange(user.username)}
                        hasUnreadItems={messages.filter(m => m.sender === u.username).some(m => !m.read)}
                    />)}
            </nav>
            <section className={classes.chat}>
                <div className={classes["message-container"]} ref={chatContainer}>
                    {messagesForChat.map((message, i) =>
                        <div className={classes["message-row"]}>
                            <span
                                className={`${classes.message} ${(message.sender === auth.token?.sub) ? classes.sender : classes.receiver}`}
                                key={i}>
                                {message.message_decrypted || "Encrypted"}
                            </span>
                        </div>
                    )}
                </div>
                <TextInput className={classes.input} ref={inputRef} onKeyDown={(e) => e.key === "Enter" && handleClick()} />
            </section>
            <div className={classes.textarea}>
                <FileInput accept={".pem"} label={"Select RSA private key (.pem)"} onChange={handleFileInput} />
            </div>
        </div>
    </Layout>
}
