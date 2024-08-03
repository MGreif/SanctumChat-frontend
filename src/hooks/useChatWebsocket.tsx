import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MessageEventSubscriber, useWebSocketContext } from "../Chat/websocket"
import { TUser } from "../types/user"
import { TMessageDTO, TMessageDirect } from "../types/messages"
import { tryVerifyAndDecryptMessages } from "../utils/message"
import { Cipher } from "../utils/cipher"
import { useAuth } from "../auth/useAuth"
import { EHTTPMethod, fetchRequest } from "../utils/fetch"
import { TApiResponse } from "../types/Api"
import { buildApiUrl } from "../constants"

const buildMessageCiphers = ({
    senderPrivateKey,
    recipientPublicKey,
    senderPublicKey,
}: {
    senderPrivateKey?: string
    recipientPublicKey?: string
    senderPublicKey?: string
}) => {
    let senderCipher = new Cipher({
        privateKey: senderPrivateKey,
        publicKey: senderPublicKey,
    })
    let recipientCipher = new Cipher({ publicKey: recipientPublicKey })

    console.log('uodate private', senderPrivateKey)
    senderCipher = new Cipher({
        privateKey: senderPrivateKey,
        publicKey: senderPublicKey,
    })

    console.log('uodate public', recipientPublicKey)

    recipientCipher = new Cipher({ publicKey: recipientPublicKey })

    return { senderCipher, recipientCipher }
}


type TUseChatWebsocketProps = {
    activeChat: TUser | null
    privateKey: string | null
}

export const useChatWebsocket = ({
    activeChat,
    privateKey,
}: TUseChatWebsocketProps) => {
    const websocket = useWebSocketContext()
    const [messages, _setMessages] = useState<TMessageDirect[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(0)
    const { token } = useAuth()
    const { senderCipher, recipientCipher } = useMemo(
        () =>
            buildMessageCiphers({
                recipientPublicKey: activeChat?.public_key,
                senderPrivateKey: privateKey || undefined,
                senderPublicKey: token?.public_key,
            }),
        [privateKey, activeChat, token]
    )

    const setMessages = (messages: TMessageDirect[]) => {
        setLoading(true)
        console.log(recipientCipher, activeChat)
        const verifiedAndDecryptedMessages = tryVerifyAndDecryptMessages(
            senderCipher,
            recipientCipher,
            messages
        )
        _setMessages(verifiedAndDecryptedMessages)
        setLoading(false)
    }

    // This effect reverifies and decrypts the messages whenever the recipientCipher (e.g. ActiveChat) or the senderCipher (e.g. private Key) changes
    useEffect(() => {
        setMessages(messages || [])
    }, [senderCipher, recipientCipher])

    // This effect fetches the latest messages whenever the active chat changes
    useEffect(() => {
        setLoading(true)
        _setMessages(null)
        fetchNewMessages(0, 15, true).then((newMessages) => {
            setMessages(newMessages || [])
            setLoading(false)
        })
    }, [activeChat])

    useEffect(() => {
        if (!privateKey) return
        const unread =
            messages?.filter(
                (m) =>
                    !m.is_read &&
                    m.recipient == token?.sub &&
                    m.sender === activeChat?.username
            ) || []
        const unreadIds = unread.map((m) => m.id)
        const unreadIdsFiltered = unreadIds.filter((x) => x) as string[]
        if (!unreadIdsFiltered.length) return

        fetchRequest<{ ids: string[] }, TApiResponse<TMessageDTO[]>>(
            buildApiUrl('/messages/read?'),
            {
                method: EHTTPMethod.PATCH,
                body: {
                    ids: unreadIdsFiltered,
                },
            }
        )
    }, [messages])

    const handleMessageReceive = useCallback(
        (message: TMessageDirect) => {
            setMessages([...(messages || []), { ...message, is_read: false }])
        },
        [messages, setMessages]
    )

    const subscriber = useRef(new MessageEventSubscriber('chat'))

    useEffect(() => {
        subscriber.current.setDirectMessageReceive(handleMessageReceive)
    }, [handleMessageReceive])

    useEffect(() => {
        websocket.meta?.current.publisher.subscribe(subscriber.current)
    }, [])

    const fetchNewMessages = async (
        index = page,
        size = 15,
        clearMessages = false
    ) => {
        setLoading(true)
        if (!activeChat) return setLoading(false)
        const loadedMessages: TMessageDirect[] | undefined = await fetchRequest<
            object,
            TApiResponse<TMessageDTO[]>
        >(
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
            console.log('load messages', newMessages, messages)
            setPage(index + 1)
            return newMessages
        })
        setLoading(false)
        return loadedMessages || []
    }

    return { messages, loadMessages: fetchNewMessages, loading }
}
