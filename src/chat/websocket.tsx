import { FC, MutableRefObject, PropsWithChildren, createContext, createRef, useContext, useEffect, useRef, useState } from "react";
import { TMessage, TMessageDirect, TMessageFriendRequest, TMessageInitialOnlineUsers, TMessageNotification, TMessageStatusChange } from "../types/messages";
import { AuthService } from "../Auth/AuthService";
import { USE_SSL, buildApiUrl } from "../constants";

export class MessageEventSubscriber {
    public id: string
    public onMessageReceive: (message: TMessage) => void = () => { }
    public onFriendRequestMessageReceive: (message: TMessageFriendRequest) => void = () => { }
    public onNotficationMessageReceive: (message: TMessageNotification) => void = () => { }
    public onFriendStatusChangeMessageReceive: (message: TMessageStatusChange) => void = () => { }
    public onInitialOnlineFriendsReceive: (message: TMessageInitialOnlineUsers) => void = () => { }
    public onDirectMessageReceive: (message: TMessageDirect) => void = () => { }

    public setMessageReceive (handler: (message: TMessage) => void) {
        this.onMessageReceive = handler
        return this
    }

    public setFriendRequestMessageReceive (handler: (message: TMessageFriendRequest) => void) {
        this.onFriendRequestMessageReceive = handler
        return this
    }


    public setNotficationMessageReceive (handler: (message: TMessageNotification) => void) {
        this.onNotficationMessageReceive = handler
        return this
    }

    public setFriendStatusChangeMessageReceive (handler: (message: TMessageStatusChange) => void) {
        this.onFriendStatusChangeMessageReceive = handler
        return this
    }

    public setInitialOnlineFriendsReceive (handler: (message: TMessageInitialOnlineUsers) => void) {
        this.onInitialOnlineFriendsReceive = handler
        return this
    }

    public setDirectMessageReceive (handler: (message: TMessageDirect) => void) {
        this.onDirectMessageReceive = handler
        return this
    }

    constructor(id: string) {
        this.id = id
    }

    public dispatch (message: TMessage) {
        this.onMessageReceive(message)
        switch (message.TYPE) {
            case "SOCKET_MESSAGE_DIRECT":
                this.onDirectMessageReceive(message as TMessageDirect)
                break;

            case "SOCKET_MESSAGE_FRIEND_REQUEST":
                this.onFriendRequestMessageReceive(message as TMessageFriendRequest)
                break;

            case "SOCKET_MESSAGE_NOTIFICATION":
                this.onNotficationMessageReceive(message as TMessageNotification)
                break;

            case "SOCKET_MESSAGE_ONLINE_USERS":
                this.onInitialOnlineFriendsReceive(message as TMessageInitialOnlineUsers)
                break;

            case "SOCKET_MESSAGE_STATUS_CHANGE":
                this.onFriendStatusChangeMessageReceive(message as TMessageStatusChange)
                break;

        }
    }
}

export class MessageEventPublisher {
    private subscribers: MessageEventSubscriber[] = []
    constructor() {

    }

    public subscribe (subscriber: MessageEventSubscriber) {
        if (this.subscribers.find(s => s.id === subscriber.id)) {
            console.warn("You cannot subscribe more than once. Check React render to find unnecessary rerenders", subscriber.id)
            this.subscribers = this.subscribers.filter(s => s.id !== subscriber.id)
        };


        this.subscribers.push(subscriber)
    }

    public publish (message: TMessage) {
        for (let sub of this.subscribers) {
            sub.dispatch(message)
        }
    }
}

type TWebsocketContext = {
    messages: TMessage[]
    connection: MutableRefObject<WebSocket | null>
    meta: MutableRefObject<{
        publisher: MessageEventPublisher;
    }> | null
}

const WebsocketContext = createContext<TWebsocketContext>({
    messages: [],
    connection: createRef(),
    meta: null
})

export const useWebSocketContext = () => {
    const context = useContext(WebsocketContext)

    return context
}

export const WebSocketContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const [messages, setMessages] = useState<TMessage[]>([])
    const connection = useRef<WebSocket | null>(null)
    const meta = useRef({
        publisher: new MessageEventPublisher()
    })


    useEffect(() => {

        if (!AuthService.Instance.isLoggedIn) {
            return
        }

        // close active connection
        connection.current?.close()

        const socket = new WebSocket(buildApiUrl(`/ws?token=${AuthService.Instance.token}`, USE_SSL ? "wss://" : "ws://"))
        // Connection opened
        socket.addEventListener("open", (event) => {
            console.info("Connection established ...", event)
        })

        socket.addEventListener("error", (err) => {
            console.error("Connection failed ...", err)
        })

        // Listen for messages

        socket.addEventListener("message", handleMessage)

        connection.current = socket
        return () => connection.current?.close()
    }, [AuthService.Instance])



    const handleMessage = (event: MessageEvent<any>) => {
        setMessages(messages => [...messages, event.data])

        try {
            let data = JSON.parse(event.data)
            meta.current.publisher.publish(data)
        } catch (err) {
            console.error("Could not handle WebSocket message", err);

        }

    }


    return <WebsocketContext.Provider value={{
        messages,
        connection,
        meta
    }}>
        {children}
    </WebsocketContext.Provider>
}
