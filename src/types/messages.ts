export type TUIMessageMeta = {
    read: boolean,
}

type TYPE = "SOCKET_MESSAGE_DIRECT" | "SOCKET_MESSAGE_NOTIFICATION" | "SOCKET_MESSAGE_EVENT" | "SOCKET_MESSAGE_ONLINE_USERS" | "SOCKET_MESSAGE_STATUS_CHANGE" | "SOCKET_MESSAGE_FRIEND_REQUEST" | "SOCKET_MESSAGE_ERROR"

export type TMessageDirect = TUIMessageMeta & {
    recipient: string,
    message: string,
    message_signature: string,
    sender: string,
    message_self_encrypted: string,
    message_self_encrypted_signature: string,
    message_decrypted?: string
    message_verified?: boolean
}

export type TMessageDTO = Omit<TMessageDirect, "read" | "message" | "message_self_encrypted" | "message_decrypted" | "message_signature" | "message_self_encrypted_signature"> & {
    sender: string,
    content: string
    content_self_encrypted: string,
    content_signature: string
    content_self_encrypted_signature: string,
}

export type TMessageInitialOnlineUsers = {
    online_users: string[]
}

export type TMessage = { TYPE: TYPE } & (TMessageDirect | TMessageInitialOnlineUsers | TMessageStatusChange | TMessageFriendRequest | TMessageNotification | TMessageError)

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

export type TMessageError = {
    message: string,
}

export type TMessageNotification = {
    title: string,
    message: string,
    status: "error" | "success" | "info"
}
