import { FC, useEffect, useRef, useState } from "react"
import { useAuth } from "../Auth/useAuth"
import { buildApiUrl } from "../constants"
import { TApiResponse } from "../types/Api"
import { TUser, TUserRaw } from "../types/user"
import { EHTTPMethod, useFetchEndpoint } from "../utils/fetch"
import { UserNavItem } from "./UserNavItem"
import { EEvent, TMessageDirect, TMessageInitialOnlineUsers } from "../types/messages"
import { MessageEventSubscriber, useWebSocketContext } from "./websocket"
import { FriendRequestNotification } from "./FriendRequestNotification"
import { ActiveChat } from "../persistence/ActiveChat"

type TFriendNavProps = {
    activeChat: TUser | null,
    onChatChange: (user: TUser) => void
    messages: TMessageDirect[]
}

export const FriendNav: FC<TFriendNavProps> = ({
    activeChat,
    onChatChange,
    messages,
}) => {
    const auth = useAuth()
    const { data: users, refetch } = useFetchEndpoint<object, TApiResponse<TUserRaw[]>, TUser[]>({
        url: buildApiUrl("/friends"),
        fetchOptions: {
            transform: (response) => response?.data?.map(u => ({ ...u, public_key: String.fromCharCode(...u.public_key) })) || [],
            method: EHTTPMethod.GET,
        }
    }, { skip: !auth.isLoggedIn })
    const websocket = useWebSocketContext()
    const [onlineUsers, setOnlineUsers] = useState<string[]>([])

    const subscriber = useRef(new MessageEventSubscriber("FriendNav").setInitialOnlineFriendsReceive(message => {
        setOnlineUsers((message as TMessageInitialOnlineUsers).online_users || [])
    })
        .setFriendStatusChangeMessageReceive(message => {
            const { status, user_id } = message
            if (status === EEvent.ONLINE) {
                setOnlineUsers([...onlineUsers, user_id])
            } else if (status === EEvent.OFFLINE) {
                setOnlineUsers(onlineUsers.filter(u => u !== user_id))
            }
        })
    )

    useEffect(() => {
        websocket.meta?.current.publisher.subscribe(subscriber.current)
    }, [])

    useEffect(() => {
        if (!users) return
        const savedUserName = ActiveChat.getValue()
        if (!savedUserName) return
        const foundUser = users.find(u => u.username === savedUserName)
        if (!foundUser) return

        onChatChange(foundUser)
    }, [users])

    return <nav>
        <FriendRequestNotification refetchFriends={refetch} />
        {users?.filter(u => u.username !== auth.token?.sub).map(u =>
            <UserNavItem
                key={u.username}
                isActiveChat={activeChat?.username === u.username}
                isOnline={onlineUsers.includes(u.username)}
                user={u}
                onClick={(user) => onChatChange(user)}
                hasUnreadItems={messages.filter(m => m.sender === u.username).some(m => !m.read)}
            />)}
    </nav>
}
