import { useParams } from "react-router"
import { Layout } from "../layout"
import { useEffect, useRef, useState } from "react";
import { AuthService } from "../auth/AuthService";

export const Chat = () => {
    const params = useParams<{ chatId: string }>()
    const connection = useRef<WebSocket | null>(null)
    const [messages, setMessages] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const socket = new WebSocket("ws://127.0.0.1:3000/ws?token=" + AuthService.Instance.token)
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
    }, [])

    const handleClick = () => {
        if (!inputRef.current?.value) return

        inputRef.current?.value && connection.current?.send(inputRef.current.value)
        inputRef.current.value = ""
    }


    return <Layout title="Chat">
        <span>{params.chatId}</span> <br />
        <input ref={inputRef}></input>
        <button onClick={handleClick}>Send socket</button>
        <ul>
            {messages.map((message, i) => <li key={message + i}>{message}</li>)}
        </ul>
    </Layout>
}
