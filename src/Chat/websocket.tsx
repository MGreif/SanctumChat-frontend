import { FC, MutableRefObject, PropsWithChildren, createContext, createRef, useContext, useEffect, useRef, useState } from "react";
import { TMessage, TMessageDirect, TMessageError, TMessageFriendRequest, TMessageInitialOnlineUsers, TMessageNotification, TMessageStatusChange } from "../types/messages";
import { AuthService } from "../auth/AuthService";
import { USE_SSL, buildApiUrl } from "../constants";

export class MessageEventSubscriber<TState extends Record<string, unknown> = Record<string, unknown>> {
    public id: string
    private state: TState
    public onMessageReceive: (message: TMessage, state: TState) => void = () => { }
    public onFriendRequestMessageReceive: (message: TMessageFriendRequest, state: TState) => void = () => { }
    public onNotficationMessageReceive: (message: TMessageNotification, state: TState) => void = () => { }
    public onFriendStatusChangeMessageReceive: (message: TMessageStatusChange, state: TState) => void = () => { }
    public onErrorMessageReceive: (message: TMessageError, state: TState) => void = () => { }
    public onInitialOnlineFriendsReceive: (message: TMessageInitialOnlineUsers, state: TState) => void = () => { }
    public onDirectMessageReceive: (message: TMessageDirect, state: TState) => void = () => { }

    public setMessageReceive (handler: (message: TMessage, state: TState) => void) {
        this.onMessageReceive = handler
        return this
    }

    public setFriendRequestMessageReceive (handler: (message: TMessageFriendRequest, state: TState) => void) {
        this.onFriendRequestMessageReceive = handler
        return this
    }


    public setNotficationMessageReceive (handler: (message: TMessageNotification, state: TState) => void) {
        this.onNotficationMessageReceive = handler
        return this
    }

    public setFriendStatusChangeMessageReceive (handler: (message: TMessageStatusChange, state: TState) => void) {
        this.onFriendStatusChangeMessageReceive = handler
        return this
    }

    public setErrorMessageReceive (handler: (message: TMessageError, state: TState) => void) {
        this.onErrorMessageReceive = handler
        return this
    }

    public setInitialOnlineFriendsReceive (handler: (message: TMessageInitialOnlineUsers, state: TState) => void) {
        this.onInitialOnlineFriendsReceive = handler
        return this
    }

    public setDirectMessageReceive (handler: (message: TMessageDirect, state: TState) => void) {
        this.onDirectMessageReceive = handler
        return this
    }

    constructor(id: string, state: TState = {} as TState) {
        this.id = id
        this.state = state
    }

    public updateState (state: TState) {
        this.state = state
    }

    public dispatch (message: TMessage) {
        this.onMessageReceive(message, this.state)
        switch (message.TYPE) {
            case "SOCKET_MESSAGE_DIRECT":
                this.onDirectMessageReceive(message as TMessageDirect, this.state)
                break;

            case "SOCKET_MESSAGE_FRIEND_REQUEST":
                this.onFriendRequestMessageReceive(message as TMessageFriendRequest, this.state)
                break;

            case "SOCKET_MESSAGE_NOTIFICATION":
                this.onNotficationMessageReceive(message as TMessageNotification, this.state)
                break;

            case "SOCKET_MESSAGE_ONLINE_USERS":
                this.onInitialOnlineFriendsReceive(message as TMessageInitialOnlineUsers, this.state)
                break;

            case "SOCKET_MESSAGE_STATUS_CHANGE":
                this.onFriendStatusChangeMessageReceive(message as TMessageStatusChange, this.state)
                break;
            case "SOCKET_MESSAGE_ERROR":
                this.onErrorMessageReceive(message as TMessageError, this.state)
                break;

        }
    }
}

export class MessageEventPublisher {
    private subscribers: MessageEventSubscriber<Record<string, unknown>>[] = []
    constructor() {

    }

    public subscribe<TState extends Record<string, unknown>> (subscriber: MessageEventSubscriber<TState>) {
        if (this.subscribers.find(s => s.id === subscriber.id)) {
            console.warn("You cannot subscribe more than once. Check React render to find unnecessary rerenders", subscriber.id)
            this.subscribers = this.subscribers.filter(s => s.id !== subscriber.id)
        };


        this.subscribers.push(subscriber as MessageEventSubscriber<Record<string, unknown>>)
    }

    public publish (message: TMessage) {
        for (let sub of this.subscribers) {
            sub.dispatch(message)
        }
    }
}

type TWebsocketContext = {
    messages: TMessage[]
    establishConnection: () => void
    connection: MutableRefObject<WebSocket | null>
    meta: MutableRefObject<{
        publisher: MessageEventPublisher;
    }> | null
}

const WebsocketContext = createContext<TWebsocketContext>({
    messages: [],
    connection: createRef(),
    establishConnection: () => { },
    meta: null
})

export const useWebSocketContext = () => {
    const context = useContext(WebsocketContext)
    const sendMessage = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        try {
            context.connection.current?.send(data)
        } catch (ex) {
            console.error(ex)
            context.establishConnection()
        }
    }
    return { context, sendMessage }
}

export const WebSocketContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const [messages, setMessages] = useState<TMessage[]>([])
    const connection = useRef<WebSocket | null>(null)
    const meta = useRef({
        publisher: new MessageEventPublisher()
    })

    function establishConnection () {
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
    }

    useEffect(() => {
        establishConnection()
    }, [])

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
        establishConnection,
        meta
    }}>
        {children}
    </WebsocketContext.Provider>
}
