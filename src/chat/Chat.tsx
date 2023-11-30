import {Layout} from "../layout"
import {useCallback, useEffect, useRef, useState} from "react";
import {AuthService} from "../auth/AuthService";
import classes from "./chat.module.css"
import {TUser, TUserRaw} from "../types/user";
import {EHTTPMethod, fetchRequest, useFetchEndpoint} from "../utils/fetch";
import {useAuth} from "../auth/useAuth";
import {UserNavItem} from "./UserNavItem";
import {Button, Textarea, TextInput} from "@mantine/core";
import {buildApiUrl} from "../constants.ts";
import {fromBase64} from "js-base64";
import {JSEncryptRSAKey} from "jsencrypt/lib/JSEncryptRSAKey";
import {showNotification} from "../misc/Notifications/Notifications.ts";
import {TApiResponse} from "../types/Api.ts";
import {notifications} from "@mantine/notifications";

export type TUIMessageMeta = {
    read: boolean,
}

export type TMessageDirect = TUIMessageMeta & {
    recipient: string,
    message: string,
    sender: string,
    message_self_encrypted: string,
    message_decrypted?: string
}

export type TMessageDTO = Omit<TMessageDirect, "read" | "message" | "message_self_encrypted" | "message_decrypted"> & {
    sender: string,
    content: string
    content_self_encrypted: string,
}

export type TMessageInitialOnlineUsers = {
    online_users: string[]
}

export type TMessage = TMessageDirect | TMessageInitialOnlineUsers | TMessageStatusChange | TMessageFriendRequest

export enum EEvent {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE",
}


export type TMessageStatusChange = {
    status: EEvent,
    user_id: string
}

export type TMessageFriendRequest = {
    sender_username: string,
    friend_request_id: string
}

const decryptMessages = (messages: TMessageDirect[], private_key_base64: string) => {
    const private_key = fromBase64(private_key_base64)
    const selfRSA = new JSEncryptRSAKey(private_key)
    const decryptedMessages = messages.map(m => {
        const self_send = m.sender === AuthService.Instance.decodedToken?.sub

        if (self_send) {
            m.message_decrypted = selfRSA.decrypt(m.message_self_encrypted)
        } else {
            m.message_decrypted = selfRSA.decrypt(m.message)
        }

        return m
    })
    return decryptedMessages
}


export const Chat = () => {
    const connection = useRef<WebSocket | null>(null)
    const [messages, _setMessages] = useState<TMessageDirect[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const chatContainer = useRef<HTMLDivElement>(null)
    const auth = useAuth()

    const { data: users, refetch } = useFetchEndpoint<object, TApiResponse<TUserRaw[]>, TUser[]>({
        url: buildApiUrl("/friends"),
        fetchOptions: {
            transform: (response) => response?.data?.map(u => ({...u, public_key: String.fromCharCode(...u.public_key) })) || [],
            method: EHTTPMethod.GET,
        }
    }, { skip: !auth.isLoggedIn})

    const [onlineUsers, setOnlineUsers] = useState<string[]>([])
    const [activeChat, setActiveChat] = useState<string | null>(null)

    useEffect(() => {
        if (!chatContainer.current) return
        chatContainer.current.scrollTop = chatContainer.current.offsetHeight
    }, [messages])
    const setMessages = (messages: TMessageDirect[]) => {
        const private_key_base64 = textareaRef.current?.value
        if (!private_key_base64) {
            _setMessages(messages)
            return
        }

        const decrypted = decryptMessages(messages, private_key_base64)
        _setMessages(decrypted)
    }
    useEffect(() => {
        if (!activeChat) return
        fetchRequest("http://localhost:3000/messages?origin=" + activeChat, {
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
        fetchRequest<{ accepted: boolean }>(buildApiUrl("/friend-requests/"+id), {
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
        console.log(message)
        if (!message) return

        if ((message as TMessageInitialOnlineUsers).online_users) {
            setOnlineUsers((message as TMessageInitialOnlineUsers).online_users || [])
            return
        }

        if ((message as TMessageStatusChange).status) {
            const { status, user_id } = message as TMessageStatusChange
            if (status === EEvent.ONLINE) {
                console.log("setting online users", onlineUsers)
                setOnlineUsers([...onlineUsers, user_id])
            } else if (status === EEvent.OFFLINE) {
                setOnlineUsers(onlineUsers.filter(u => u !== user_id))
            }
            return
        }

        if ((message as TMessageFriendRequest).friend_request_id) {
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


        _setMessages(messages => {
            const adjusted = [
                ...messages,
                {...(message as TMessageDirect), read: false}
            ]

            const private_key_base64 = textareaRef.current?.value
            if (!private_key_base64) return adjusted
            const decrypted = decryptMessages(adjusted, private_key_base64)
            return decrypted
        })
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

        const socket = new WebSocket(`ws://127.0.0.1:3000/ws?token=${AuthService.Instance.token}`)
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
        console.log(public_key_decoded)
        const message = inputRef.current.value
        const recipientRSA = new JSEncryptRSAKey(public_key_decoded)
        const selfRSA = new JSEncryptRSAKey(fromBase64(AuthService.Instance.decodedToken!.public_key))
        const encrypted_message = recipientRSA.encrypt(message)
        const message_self_encrypted = selfRSA.encrypt(message)
        const preparedText = JSON.stringify({ recipient: activeChat, message: encrypted_message, message_self_encrypted})
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

    const handleTextAreaApply = () => {
        const private_key_base64 = textareaRef.current?.value
        if (!private_key_base64) return
        const decryptedMessages = decryptMessages(messages, private_key_base64)
        setMessages(decryptedMessages)
    }

    console.log(onlineUsers, users)
    if (!auth.isLoggedIn) {
        return <Layout title="You are not logged in, please login"></Layout>
    }

    const messagesForChat = messages.filter(m => m.recipient === activeChat || m.sender === activeChat)
    return <Layout title="Chat">
        <div className={classes.grid}>
            <nav>
                {users?.filter(u => u.username !== auth.token?.sub).map(u =>
                    <UserNavItem
                        isActiveChat={activeChat === u.username}
                        isOnline={onlineUsers.includes(u.username)}
                        user={u}
                        onClick={(user) => handleChatChange(user.username)}
                        hasUnreadItems={messages.filter(m => m.sender === u.username).some(m => !m.read)}
                    />)}
            </nav>
            <section className={classes.chat}>
                <div className={classes["message-container"]} ref={chatContainer}>
                    {messagesForChat.map((message, i) => <div className={classes["message-row"]}><span className={`${classes.message} ${(message.sender === auth.token?.sub) ? classes.sender : classes.receiver}`} key={i}>{message.message_decrypted || "Encrypted"}</span></div>)}
                </div>
                    <TextInput className={classes.input} ref={inputRef} onKeyDown={(e) => e.key === "Enter" && handleClick()} />
            </section>
            <div className={classes.textarea}><Textarea rows={8} placeholder={"Insert base64 encoded private key here"} ref={textareaRef} className={classes.textarea}/><Button onClick={() => handleTextAreaApply()}>Apply</Button></div>
        </div>
    </Layout>
}
