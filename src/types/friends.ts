export type TFriendRequest = {
    id: string
    sender_id: string
    sender_name: string
    recipient: string
    accepted: boolean | null,
}