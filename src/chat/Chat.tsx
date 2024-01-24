import { FC, FormEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { ActionIcon, Modal, TextInput, Tooltip } from "@mantine/core";
import { fromBase64 } from "js-base64";

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
import { KeyRound, SendHorizonal } from "lucide-react";
import { Cipher } from "../utils/cipher.ts";

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

    useEffect(() => {
        if (!privateKey) return
        const unread = messages.filter(m => !m.is_read && m.recipient == token?.sub && m.sender === activeChat?.username)
        const unreadIds = unread.map(m => m.id)
        const unreadIdsFiltered = unreadIds.filter(x => x) as string[]
        if (!unreadIdsFiltered.length) return

        fetchRequest<{ ids: string[] }, TApiResponse<TMessageDTO[]>>(buildApiUrl("/messages/read?"), {
            method: EHTTPMethod.PATCH,
            body: {
                ids: unreadIdsFiltered
            }
        })

    }, [messages])

    const handleMessageReceive = useCallback((message: TMessageDirect) => {
        setMessages([
            ...messages,
            { ...message, is_read: false }
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
                is_read: m.is_read,
                id: m.id,
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

    const userPublicKey = fromBase64(auth.token?.public_key || "")

    useEffect(() => {
        if (!chatContainer.current) return
        chatContainer.current.scrollTop = chatContainer.current.scrollHeight
    }, [messages])

    const handleMessageSend: FormEventHandler = (e) => {
        e.preventDefault()
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
        const recipientRSA = new Cipher({ publicKey: public_key_decoded})
        const selfRSA = new Cipher({ publicKey: fromBase64(AuthService.Instance.decodedToken!.public_key) })
        const selfRSAPrivate = new Cipher({ privateKey })
        const encrypted_message = recipientRSA.encryptMessage(message)
        const message_self_encrypted = selfRSA.encryptMessage(message)

        const encrypted_message_signature = selfRSAPrivate.signMessage(encrypted_message)
        const self_encrypted_message_signature = selfRSAPrivate.signMessage(message_self_encrypted)

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
        <div className="grid-cols-chat grid gap-4 mx-4 min-h-0">
            <FriendNav activeChat={activeChat} messages={messages} onChatChange={handleChatChange} />
            <section className='grid relative grid-rows-chat-message grid-cols-1 gap-2 min-h-0 bg-indigo-100 shadow-lg'>
                <div className="relative min-h-0">
                <div className='border rounded-md p-4 pb-16 shadow-sm relative scroll-auto h-full overflow-y-auto border-indigo-300' ref={chatContainer}>
                    <span onClick={() => loadMessages()}>Load more</span>
                    {messagesForChat.map((message, i) =>
                        <div key={i} className={classes["message-row"]}>
                                <MessageBadge
                                    sentByUser={message.sender === auth.token?.sub}
                                    key={i} 
                                    content={message.message_decrypted || ""}
                                    isEncrypted={!message.message_decrypted}
                                    isVerified={message.message_verified || false}
                                    />
                        </div>
                    )}
                    </div>
                    <form onSubmit={handleMessageSend}>
                        <div className="absolute bottom-4 w-3/4 left-1/2 transform -translate-x-1/2">
                            <TextInput placeholder="Hola" className="w-full shadow-md" ref={inputRef} />
                            <ActionIcon type="submit" size={"lg"} className="absolute shadow-lg -right-12 top-0 border rounded-full p-1.5 bg-indigo-500 hover:bg-indigo-700 cursor-pointer "><SendHorizonal color="white" size={20} /></ActionIcon>
                        </div>
                        <div>
                            <KeyModal publicKey={userPublicKey} setPrivateKey={setPrivateKey} privateKey={privateKey} />
                        </div>
                    </form>
                    
                </div>
            </section>
        </div>
    </Layout>
}

type TMessageBadgeProps = {
    className?: string
    content: string
    isEncrypted: boolean
    isVerified: boolean
    sentByUser: boolean
}


const MessageBadge: FC<TMessageBadgeProps> = (props) => {

    const extraClasses = []

    const color = props.sentByUser ? "bg-indigo-500" : "bg-sky-500"

    extraClasses.push(props.isVerified ? color : "bg-red-700")


    if (props.sentByUser) {
        extraClasses.push("justify-self-end")
    } else {
        extraClasses.push("justify-self-start")
    }


    const Content = <span className={`${props.className || ""} ${extraClasses.join(" ")} p-1 px-3 text-white rounded-2xl w-fit`}>
        {props.isEncrypted ? "Encrypted" : props.content}
    </span>

    if (!props.isVerified) return (
        <Tooltip style={{ width: "300px" }} multiline label={
            <span>Message signature could not be verified! This message might have been altered or intercepted!
                <br />
                <br />
                In the best case, the sender just used the wrong private key.
            </span>}>
            {Content}
        </Tooltip>
    )
    

    return Content
}

const KeyModal = (props: {setPrivateKey: (key: string | null) => void, privateKey: string | null, publicKey?: string }) => {
    const [open, setOpen] = useState(false)
    const [privateKey, setPrivateKey] = useState<string | null>(localStorage.getItem("privateKey") || null)

    useEffect(() => {
        props.setPrivateKey(privateKey)
    }, [privateKey])


    return <>
        <div role="button" onClick={() => setOpen(true)}>
            <KeyRound className={`absolute ${props.privateKey ? "bg-indigo-500" : "bg-red-500"} ${props.privateKey ? "hover:bg-indigo-700" : "hover:bg-red-700"} p-4 box-border w-fit h-fit rounded-lg bg-indigo-500 bottom-4 left-16 transform -translate-x-1/2`} color="white" />
        </div>
        <Modal size={"md"} opened={open} onClose={() => setOpen(false)}>
            <KeyInput publicKey={props.publicKey} privateKey={props.privateKey} onChange={(key) => setPrivateKey(key)} />
        </Modal>
    </>

}
