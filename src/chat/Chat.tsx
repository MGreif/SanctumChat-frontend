import { useParams } from "react-router"
import { Layout } from "../layout"
import { useEffect, useRef, useState } from "react";

export const Chat = () => {
    const params = useParams<{ chatId: string }>()
    const connection = useRef<WebSocket | null>(null)
    const [messages, setMessages] = useState<string[]>([])

    useEffect(() => {
        const socket = new WebSocket("ws://127.0.0.1:3000/ws")
        // Connection opened
        socket.addEventListener("open", (event) => {
            socket.send("Connection established")
        })

        // Listen for messages
        socket.addEventListener("message", (event) => {
            setMessages(v => [v, event.data.toString()])
            console.log("Message from server ", event.data)
        })

        connection.current = socket

        return () => connection.current?.close()
    }, [])

    const handleClick = () => {
        connection.current?.send("abc")
    }

    return <Layout title="Chat">
        <span>{params.chatId}</span>
        <button onClick={handleClick}>Send socket</button>
        {messages.map((message, i) => <span key={message + i}>{message}</span>)}
    </Layout>
}
