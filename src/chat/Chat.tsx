import { useParams } from "react-router"
import { Layout } from "../layout"
import { useEffect, useRef, useState } from "react";
import { AuthService } from "../auth/AuthService";
import classes from "./chat.module.css"
import { TUser } from "../types/user";
import { EHTTPMethod, fetchRequest } from "../utils/fetch";




export const Chat = () => {
    const params = useParams<{ chatId: string }>()
    const connection = useRef<WebSocket | null>(null)
    const [messages, setMessages] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const [users, setUsers] = useState<TUser[]>([])
    const [activeChat, setActiveChat] = useState<string | null>(null)

    useEffect(() => {
        fetchRequest("http://127.0.0.1:3000/users", { method: EHTTPMethod.GET }).then(res => {
            const users = res.body as TUser[]
            if (!users || !Array.isArray(users)) return
            setUsers(users)
        }).catch(err => console.error("could not fetch users", err))


        if (!activeChat) return

        // close active connection
        connection.current?.close()

        const socket = new WebSocket(`ws://127.0.0.1:3000/ws?token=${AuthService.Instance.token}&recipient=${activeChat}`)
        // Connection opened
        socket.addEventListener("open", (event) => {
            console.log("Connection established ...", event)
        })

        socket.addEventListener("error", (err) => {
            console.log("Connection failed ...", err)
        })

        // Listen for messages
        socket.addEventListener("message", (event) => {
            setMessages(v => [...v, event.data.toString()])
            console.log("Message from server,", event.data)
        })

        connection.current = socket

        return () => connection.current?.close()
    }, [activeChat])

    const handleClick = () => {
        if (!inputRef.current?.value) return

        inputRef.current?.value && connection.current?.send(inputRef.current.value)
        inputRef.current.value = ""
    }

    const handleChatChange = (userId: string) => {
        setActiveChat(userId)
        setMessages([])
    }


    return <Layout title="Chat">
        <div className={classes.grid}>
            <nav>
                {users.map(u => <span key={u.id} onClick={() => handleChatChange(u.id)} className={classes["user-nav-item"]}>{u.name}</span>)}
            </nav>
            <section>
                <span>{params.chatId}</span> <br />
                <input ref={inputRef}></input>
                <button onClick={handleClick}>Send socket</button>
                <ul>
                    {messages.map((message, i) => <li key={message + i}>{message}</li>)}
                </ul>
            </section>

        </div>
    </Layout>
}
