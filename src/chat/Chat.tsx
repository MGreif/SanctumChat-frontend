import { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, Tooltip } from "@mantine/core";
import { JSEncryptRSAKey } from "jsencrypt/lib/JSEncryptRSAKey";
import { fromBase64 } from "js-base64";
import { sha256 } from "js-sha256";

import { Layout } from "../layout"
import { AuthService } from "../Auth/AuthService.ts";
import classes from "./chat.module.css"
import { EHTTPMethod, fetchRequest } from "../utils/fetch";
import { useAuth } from "../Auth/useAuth.tsx";
import { buildApiUrl } from "../constants.ts";
import { showErrorNotification } from "../misc/Notifications/Notifications.ts";
import { TMessageDTO, TMessageDirect } from "../types/messages.ts";
import { decryptMessages, verifyMessagesSignature } from "../utils/message.ts";
import { FriendNav } from "./FriendNav.tsx";
import { TUser } from "../types/user.ts";
import { MessageEventSubscriber, useWebSocketContext } from "./websocket.tsx";
import { KeyInput } from "./KeyInput.tsx";
import { ActiveChat } from "../persistence/ActiveChat.ts";
import { TApiResponse } from "../types/Api.ts";

type TUseChatWebsocketProps = {
    activeChat: TUser | null,
    privateKey: string | null
}

export const useChatWebsocket = ({
    activeChat,
    privateKey
}: TUseChatWebsocketProps) => {
    const websocket = useWebSocketContext()
    const [messages, _setMessages] = useState<TMessageDirect[]>([])
    const [page, setPage] = useState(0)
    const { token } = useAuth()

    const setMessages = useCallback((messages: TMessageDirect[]) => {

        const recipient = activeChat
        if (!recipient) return


        const verifiedMessages = verifyMessagesSignature(messages, recipient.public_key, token?.public_key)
        if (!verifiedMessages) {

            _setMessages(messages)
            return console.error("Could not verify signatures")
        }

        if (!privateKey) {
            _setMessages(verifiedMessages)
            console.error("No private key set, not decrypting");

            return
        }
        const decryptedMessages = decryptMessages(verifiedMessages, privateKey)

        if (!decryptedMessages) {
            _setMessages(verifiedMessages)
            return console.error("Could not decrypt messages")
        }


        _setMessages(messages)
    }, [activeChat, privateKey])

    useEffect(() => {
        if (!privateKey) return
        decryptCurrentMessages(privateKey)
    }, [privateKey])

    const decryptCurrentMessages = async (private_key: string) => {
        const recipient = activeChat
        if (!recipient) return

        const verifiedMessages = verifyMessagesSignature(messages, recipient.public_key, token?.public_key)
        if (!verifiedMessages) return console.error("Could not verify signatures")

        const decryptedMessages = decryptMessages(verifiedMessages, private_key)

        if (!decryptedMessages) return console.error("Could not decrypt messages")
        setMessages(decryptedMessages)
    }

    useEffect(() => {
        loadMessages(0, 15, true)
    }, [activeChat])

    const handleMessageReceive = useCallback((message: TMessageDirect) => {
        setMessages([
            ...messages,
            { ...message, read: false }
        ])
    }, [messages])

    const subscriber = useRef(new MessageEventSubscriber("chat"))

    useEffect(() => {
        subscriber.current.setDirectMessageReceive(handleMessageReceive)
    }, [handleMessageReceive])

    useEffect(() => {
        websocket.meta?.current.publisher.subscribe(subscriber.current)
    }, [])

    const loadMessages = (index = page, size = 15, clearMessages = false) => {
        if (!activeChat) return
        fetchRequest<object, TApiResponse<TMessageDTO[]>>(buildApiUrl(`/messages?origin=${activeChat.username}&index=${index}&size=${size}`), {
            method: EHTTPMethod.GET,
        }).then(({ body }) => {
            if (!body.data?.length) return
            const b: TMessageDirect[] = body.data.map(m => ({
                message: m.content,
                read: true,
                recipient: m.recipient,
                sender: m.sender,
                message_self_encrypted: m.content_self_encrypted,
                message_self_encrypted_signature: m.content_self_encrypted_signature,
                message_signature: m.content_signature,
            }))
            let newMessages = clearMessages ? b : [...b, ...messages]
            setMessages(newMessages)
            setPage(index + 1)
        })
    }

    return { messages, loadMessages }
}


export const Chat = () => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [privateKey, setPrivateKey] = useState<string | null>(null)
    const chatContainer = useRef<HTMLDivElement>(null)
    const auth = useAuth()
    const [activeChat, setActiveChat] = useState<TUser | null>(null)
    const websocket = useWebSocketContext()
    const { messages, loadMessages } = useChatWebsocket({
        activeChat,
        privateKey
    })

    useEffect(() => {
        if (!chatContainer.current) return
        chatContainer.current.scrollTop = chatContainer.current.scrollHeight
    }, [messages])

    const handleMessageSend = () => {
        if (!inputRef.current?.value) return
        const recipient = activeChat
        if (!recipient) return
        if (!privateKey) return showErrorNotification({
            title: "Insert private RSA Key",
            message: "Please insert your RSA Private key to send messages"
        })


        const public_key_encoded = recipient.public_key
        const public_key_decoded = fromBase64(public_key_encoded)
        const message = inputRef.current.value
        const recipientRSA = new JSEncryptRSAKey(public_key_decoded)
        const selfRSA = new JSEncryptRSAKey(fromBase64(AuthService.Instance.decodedToken!.public_key))
        const selfRSAPrivate = new JSEncryptRSAKey(privateKey)
        const encrypted_message = recipientRSA.encrypt(message)
        const message_self_encrypted = selfRSA.encrypt(message)

        const encrypted_message_signature = selfRSAPrivate.sign(encrypted_message, sha256, "sha256")
        const self_encrypted_message_signature = selfRSAPrivate.sign(message_self_encrypted, sha256, "sha256")

        const preparedText = JSON.stringify({
            recipient: recipient.username,
            message: encrypted_message,
            message_self_encrypted: message_self_encrypted,
            message_signature: encrypted_message_signature,
            message_self_encrypted_signature: self_encrypted_message_signature
        })

        inputRef.current?.value && websocket.connection.current?.send(preparedText)
        inputRef.current.value = ""
    }


    const handleChatChange = (user: TUser) => {
        ActiveChat.setValue(user.username)
        setActiveChat(user)
    }


    if (!auth.isLoggedIn) {
        return <Layout title="You are not logged in, please login"></Layout>
    }

    const messagesForChat = messages.filter(m => m.recipient === activeChat?.username || m.sender === activeChat?.username)
    return <Layout title="Chat">
        <div className={classes.grid}>
            <FriendNav activeChat={activeChat} messages={messages} onChatChange={handleChatChange} />
            <section className={classes.chat}>
                <div className={classes["message-container"]} ref={chatContainer}>
                    <span onClick={() => loadMessages()}>Load more</span>
                    {messagesForChat.map((message, i) =>
                        <div key={i} className={classes["message-row"]}>
                            <Tooltip style={{ width: "300px" }} multiline label={message.message_verified ? "" : "Message signature could not be verified! This message might have been altered or intercepted!"} disabled={message.message_verified}>
                                <span
                                    className={`${classes.message} ${(message.sender === auth.token?.sub) ? classes.sender : classes.receiver} ${message.message_verified ? classes.verified : classes["verification-failed"]}`}
                                    key={i}>
                                    {message.message_decrypted || "Encrypted"}
                                </span>
                            </Tooltip>
                        </div>
                    )}
                </div>
                <TextInput placeholder="Hola" className={classes.input} ref={inputRef} onKeyDown={(e) => e.key === "Enter" && handleMessageSend()} />
                <div className={classes.textarea}>
                    <KeyInput onChange={setPrivateKey} />
                </div>
            </section>

        </div>
    </Layout>
}
