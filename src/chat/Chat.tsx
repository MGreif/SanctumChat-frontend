import { Layout } from "../layout"
import { useEffect, useRef, useState } from "react";
import { AuthService } from "../auth/AuthService";
import classes from "./chat.module.css"
import { TUser } from "../types/user";
import { EHTTPMethod, fetchRequest } from "../utils/fetch";
import { useAuth } from "../auth/useAuth";
import { UserNavItem } from "./UserNavItem";

export type TUIMessageMeta = {
    read: boolean
}

export type TMessageDirect = TUIMessageMeta & {
    recipient: string,
    message: string,
    sender: string,
}

export type TMessageDTO = Omit<TMessageDirect, "read" | "message"> & {
    sender: string,
    content: string
}

export type TMessageInitialOnlineUsers = {
    online_users: string[]
}

export type TMessage = TMessageDirect | TMessageInitialOnlineUsers | TMessageStatusChange

export enum EEvent {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE",
}


export type TMessageStatusChange = {
    status: EEvent,
    user_id: string
}

export type TChat = () => {
    recipient: string,
    messages: TMessageDirect[]
}


export const Chat = () => {
    const connection = useRef<WebSocket | null>(null)
    const [messages, setMessages] = useState<TMessageDirect[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const [users, setUsers] = useState<TUser[]>([])
    const [onlineUsers, setOnlineUsers] = useState<string[]>([])
    const [activeChat, setActiveChat] = useState<string | null>(null)
    const auth = useAuth()

    useEffect(() => {
        if (!activeChat) return
        fetchRequest("http://localhost:3000/messages?origin=" + activeChat, {
            method: EHTTPMethod.GET,
        }).then(({ body }) => {
            const b: TMessageDirect[] = (body as TMessageDTO[]).map(m => ({
                message: m.content,
                read: true,
                recipient: m.recipient,
                sender: m.sender
            }))
            setMessages(b)
        })
    }, [activeChat])

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
            console.log("Setting nitial online users")
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

        setMessages(v => [
            ...v,
            { ...(message as TMessageDirect), read: false }
        ])
    }

    useEffect(() => {
        connection.current?.addEventListener("message", handleMessage)

        return () => connection.current?.removeEventListener("message", handleMessage)

    }, [connection.current, onlineUsers])


    useEffect(() => {

        if (!auth.isLoggedIn) {
            return
        }

        fetchRequest("http://127.0.0.1:3000/users", { method: EHTTPMethod.GET }).then(res => {
            const users = res.body as TUser[]
            if (!users || !Array.isArray(users)) return
            setUsers(users)
        }).catch(err => console.error("could not fetch users", err))

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
        const preparedText = JSON.stringify({ recipient: activeChat, message: inputRef.current.value })
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

    console.log(onlineUsers, users)
    if (!auth.isLoggedIn) {
        return <Layout title="You are not logged in, please login"></Layout>
    }

    const messagesForChat = messages.filter(m => m.recipient === activeChat || m.sender === activeChat)
    return <Layout title="Chat">
        <div className={classes.grid}>
            <nav>
                {users.filter(u => u.id !== auth.token?.sub).map(u =>
                    <UserNavItem
                        isActiveChat={activeChat === u.id}
                        isOnline={onlineUsers.includes(u.id)}
                        user={u}
                        onClick={(user) => handleChatChange(user.id)}
                        hasUnreadItems={messages.filter(m => m.sender === u.id).some(m => !m.read)}
                    />)}
            </nav>
            <section>
                <div className={classes["message-container"]}>
                    {messagesForChat.map((message, i) => <span className={`${classes.message} ${(message.sender === auth.token?.sub) ? classes.sender : classes.receiver}`} key={i}>{message.message}</span>)}
                </div>
                <div className={classes.input}>
                    <input ref={inputRef} onKeyDown={(e) => e.key === "Enter" && handleClick()} />
                    <button onClick={handleClick}>Send</button>
                </div>
            </section>

        </div>
    </Layout>
}
