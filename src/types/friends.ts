import { TUser } from "./user"

export type TFriendRequest = {
    id: string
    sender_id: string
    recipient: string
    accepted: boolean | null,
}

export type TFriend = TUser & {
    unread_message_count: number
}
