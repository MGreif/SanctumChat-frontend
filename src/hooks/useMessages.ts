import { useCallback, useEffect, useMemo, useState } from "react"
import { TUser } from "../types/user"
import { MessageCrypto } from "../cryptography/MessageCrypto"
import { TMessageDirect } from "../types/messages"
import { useFetchMessages } from "../api/useFetchMessages"
import { useSetMessagesRead } from "../api/useSetMessagesRead"
import { AuthService } from "../auth/AuthService"

type TuseMessagesProps = {
    activeChat: TUser | null
    privateKey: string | null
	refetchFriends?: () => void
}

export const useMessages = ({ activeChat, privateKey, refetchFriends }: TuseMessagesProps) => {
    const [messagesDecrypted, setMessagesDecrypted] = useState<TMessageDirect[] | null>(null) // Null -> Not initialized ; [] no messages ; [...] messages
    const { fetch, isLoading } = useFetchMessages(activeChat)
    const [currentPage, setCurrentPage] = useState(0) // The messages use a infinity scroll kind of data pagination
    const { setMessagesRead } = useSetMessagesRead()
	const messageCrypto = useMemo(
		() =>
			(activeChat && privateKey) && new MessageCrypto(privateKey, activeChat.public_key),
		[privateKey, activeChat]
	)


    const decryptAndStoreEncryptedMessages = (encryptedMessages: TMessageDirect[], mode: "append" | "prepend" = "append") => {        
        
        if (!messageCrypto) return
        
        
        const messagesLeftToDecrypt = encryptedMessages.filter(m => !messagesDecrypted?.map(mD => mD.id).includes(m.id))

        const decryptedMessages = messageCrypto.verifyAndDecryptMessages(messagesLeftToDecrypt)
        
        if (mode === "append") {
            setMessagesDecrypted(prev => [...(prev || []), ...decryptedMessages]) // Concat decrypted messages with freshly decrypted
        } else {
            setMessagesDecrypted(prev => [...decryptedMessages, ...(prev || [])]) // Concat decrypted messages with freshly decrypted
        }

    }

    // This effect simply resets the infinity scroll page to 0
    useEffect(() => {
        setCurrentPage(0)
    }, [currentPage])

    const loadMessages = async (size = 15, index = 0) => {
        const isFirstLoad = index === 0
        const fetchedMessages = await fetch(currentPage, size, isFirstLoad)
        setCurrentPage(currentPage + 1)
        
        if (!fetchedMessages || fetchedMessages?.length === 0) return
        decryptAndStoreEncryptedMessages(fetchedMessages, "prepend")
    }

    const handleMessageReceive = useCallback(
		(message: TMessageDirect) => {
            
			decryptAndStoreEncryptedMessages([{ ...message, is_read: false }])
		},
		[decryptAndStoreEncryptedMessages, messageCrypto]
	)


    // This useEffect sets messages to read whenever the messages update
	useEffect(() => {
		if (!privateKey || !activeChat || !messagesDecrypted) return
		const unread =
			messagesDecrypted.filter(
				(m) =>
					!m.is_read &&
					m.recipient == AuthService.Instance.decodedToken?.sub &&
					m.sender === activeChat?.username
			) || []
		const unreadIds = unread.map((m) => m.id)
		const unreadIdsFiltered = unreadIds.filter((x) => x) as string[]
		if (!unreadIdsFiltered.length) return

		setMessagesRead(unreadIdsFiltered).then(() => {
            setMessagesDecrypted(m => {
                if (!m) return m
                const newMessages = m.map(m => {
                    if (
                        !m.is_read &&
                        m.recipient == AuthService.Instance.decodedToken?.sub &&
                        m.sender === activeChat?.username
                    ) {
                        return { ...m, is_read: true }
                    }
                    return m
                })

                return newMessages
            })
            refetchFriends?.()
        })
	}, [messagesDecrypted])



    return { messages: messagesDecrypted, loadMessages, handleMessageReceive, isLoading }
}