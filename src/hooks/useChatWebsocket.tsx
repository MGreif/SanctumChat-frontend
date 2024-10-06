import { useEffect, useRef } from 'react'
import { MessageEventSubscriber, useWebSocketContext } from '../Chat/websocket'
import { TUser } from '../types/user'
import { useMessages } from './useMessages'

type TUseChatWebsocketProps = {
	activeChat: TUser | null
	privateKey: string | null
	refetchFriends?: () => void
}

export const useChatWebsocket = ({
	activeChat,
	privateKey,
	refetchFriends,
}: TUseChatWebsocketProps) => {
	const { context: websocket } = useWebSocketContext()
	const { loadMessages, handleMessageReceive, messages, isLoading } = useMessages({ activeChat, privateKey, refetchFriends })

	// This effect fetches the latest messages whenever the active chat changes
	useEffect(() => {
		if (!activeChat) return
			loadMessages(15, 0)
	}, [activeChat])


	const subscriber = useRef(new MessageEventSubscriber('chat'))

	useEffect(() => {
		subscriber.current.setDirectMessageReceive(handleMessageReceive)
	}, [handleMessageReceive])

	useEffect(() => {
		websocket.meta?.current.publisher.subscribe(subscriber.current)
	}, [])

	return { messages, loadMessages, isLoading  }
}
