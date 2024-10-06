import { useState } from "react"
import { EHTTPMethod, fetchRequest } from "./fetch"
import { TMessageDirect, TMessageDTO } from "../types/messages"
import { TApiResponse } from "../types/Api"
import { buildApiUrl } from "../constants"
import { TUser } from "../types/user"

export const useFetchMessages = (activeChat: TUser | null) => {
    const [isLoading, setLoading] = useState(false)
    const [messages, setMessages] = useState<TMessageDirect[] | null>(null)

    const fetch = async (
        index = 0,
        size = 15,
        clearMessages = false
    ) => {
        if (!activeChat) return
        setLoading(true)
        const loadedMessages: TMessageDirect[] | null =
            (await fetchRequest<object, TApiResponse<TMessageDTO[]>>(
                buildApiUrl(
                    `/messages?origin=${activeChat.username}&index=${index}&size=${size}`
                ),
                {
                    method: EHTTPMethod.GET,
                }
            ).then(({ body }) => {
                if (!body.data?.length) return
                const b: TMessageDirect[] = body.data.map((m) => ({
                    message: m.content,
                    is_read: m.is_read,
                    id: m.id,
                    recipient: m.recipient,
                    sender: m.sender,
                    message_self_encrypted: m.content_self_encrypted,
                    message_self_encrypted_signature: m.content_self_encrypted_signature,
                    message_signature: m.content_signature,
                }))
                const newMessages = clearMessages ? b : [...b, ...(messages || [])]
                return newMessages
            })) || null
        setLoading(false)

        loadedMessages && loadedMessages.length > 0 && setMessages(loadedMessages)
        return loadedMessages
    }

    return { fetch, isLoading }

}