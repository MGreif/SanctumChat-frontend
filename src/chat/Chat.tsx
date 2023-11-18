import { json, useParams } from "react-router"
import { Layout } from "../layout"
import { useEffect, useRef, useState } from "react";
import { AuthService } from "../auth/AuthService";
import classes from "./chat.module.css"
import { TUser } from "../types/user";
import { EHTTPMethod, fetchRequest } from "../utils/fetch";
import { useAuth } from "../auth/useAuth";

export type TMessageDirect = {
    recipient: string,
    message: string,
    sender: string

}

export enum EEvent {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE"
}

export type TMessageEvent = {
    event: EEvent
}

export type TChat = () => {
    recipient: string,
    messages: TMessageDirect[]
}


export const Chat = () => {
    const params = useParams<{ chatId: string }>()
    const connection = useRef<WebSocket | null>(null)
    const [messages, setMessages] = useState<TMessageDirect[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const [users, setUsers] = useState<TUser[]>([])
    const [activeChat, setActiveChat] = useState<string | null>(null)
    const auth = useAuth()

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
        socket.addEventListener("message", (event) => {
            let message: TMessageDirect
            try {
                message = JSON.parse(event.data)
            } catch (err) {
                message = {
                    message: event.data,
                    sender: "",
                    recipient: ""
                }
            }
            console.log(message)

            setMessages(v => [
                ...v,
                message
            ])

            console.log("Message from server,", event.data)
        })

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
    }


    if (!auth.isLoggedIn) {
        return <Layout title="You are not logged in, please login"></Layout>
    }

    const messagesForChat = messages.filter(m => m.recipient === activeChat || m.sender === activeChat)
    console.log(messagesForChat, activeChat, auth.token)
    return <Layout title="Chat">
        <div className={classes.grid}>
            <nav>
                {users.filter(u => u.id !== auth.token?.sub).map(u => <span key={u.id} onClick={() => handleChatChange(u.id)} className={`${classes["user-nav-item"]} ${activeChat === u.id ? classes.active : ""}`}>{u.name}</span>)}
            </nav>
            <section>
                <span>{params.chatId}</span> <br />
                <div className={classes["message-container"]}>
                    {messagesForChat.map((message, i) => <span className={`${classes.message} ${(message.sender === auth.token?.sub) ? classes.sender : classes.receiver}`} key={i}>{message.message}</span>)}
                </div>
                <div className={classes.input}>
                    <input ref={inputRef} onKeyDown={(e) => e.key === "Enter" && handleClick()} />
                    <button onClick={handleClick}>Send socket</button>
                </div>
            </section>

        </div>
    </Layout>
}
