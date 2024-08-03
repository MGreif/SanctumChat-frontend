import { FC, useEffect, useRef, useState } from 'react'
import { useAuth } from '../Auth/useAuth'
import { buildApiUrl } from '../constants'
import { TApiResponse } from '../types/Api'
import { TUser } from '../types/user'
import { EHTTPMethod, useFetchEndpoint } from '../utils/fetch'
import { UserNavItem } from './UserNavItem'
import {
  EEvent,
  TMessageDirect,
  TMessageInitialOnlineUsers,
} from '../types/messages'
import { MessageEventSubscriber, useWebSocketContext } from './websocket'
import { FriendRequestNotification } from './FriendRequestNotification'
import { ActiveChat } from '../persistence/ActiveChat'
import { TFriend } from '../types/friends'
import classes from './FriendNav.module.css'

type TFriendNavProps = {
  activeChat: TUser | null
  onChatChange: (user: TUser) => void
  messages: TMessageDirect[]
}

const getNoResultsText = (filteredUsers: TFriend[], users: TFriend[]) => {
  if (!filteredUsers.length && !users.length) return 'No friends'
  if (!filteredUsers.length && users.length)
    return 'No results. Check your filter'
  return 'No results'
}

export const FriendNav: FC<TFriendNavProps> = ({
  activeChat,
  onChatChange,
  messages,
}) => {
  const auth = useAuth()
  const { data: users, refetch } = useFetchEndpoint<
    object,
    TApiResponse<TFriend[]>,
    TFriend[]
  >(
    {
      url: buildApiUrl('/friends'),
      fetchOptions: {
        transform: (r) => r?.data || [],
        method: EHTTPMethod.GET,
      },
    },
    { skip: !auth.isLoggedIn }
  )

  const [filteredFriends, setFilteredFriends] = useState(users)

  useEffect(() => {
    setFilteredFriends(users)
  }, [users])

  const { data: activeUsers, refetch: refetchOnlineUsers } = useFetchEndpoint<
    object,
    TApiResponse<string[]>
  >(
    {
      url: buildApiUrl('/friends/active'),
      fetchOptions: {
        method: EHTTPMethod.GET,
      },
    },
    { skip: !auth.isLoggedIn }
  )

  const onFriendRequestApply = () => {
    refetch()
    refetchOnlineUsers()
  }

  useEffect(() => {
    if (!activeUsers?.data) return
    setOnlineUsers(activeUsers.data)
  }, [activeUsers])
  const websocket = useWebSocketContext()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  const subscriber = useRef(
    new MessageEventSubscriber('FriendNav')
      .setInitialOnlineFriendsReceive((message) => {
        setOnlineUsers(
          (message as TMessageInitialOnlineUsers).online_users || []
        )
      })
      .setFriendStatusChangeMessageReceive((message) => {
        const { status, user_id } = message
        if (status === EEvent.ONLINE) {
          setOnlineUsers([...onlineUsers, user_id])
        } else if (status === EEvent.OFFLINE) {
          setOnlineUsers(onlineUsers.filter((u) => u !== user_id))
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
    const foundUser = users.find((u) => u.username === savedUserName)
    if (!foundUser) return

    onChatChange(foundUser)
  }, [users])

  const filterFriends = (search: string) => {
    if (search == '') {
      setFilteredFriends(users)
      return
    }
    setFilteredFriends(users?.filter((u) => u.username.match(search)))
  }

  return (
    <div className="flex justify-stretch flex-col p-4 border bg-slate-100 rounded-md box-border border-indigo-300 shadow-lg min-h-0">
      <div className="mx-auto text-xl box-border">
        <input
          placeholder="Search ..."
          className="p-4 box-border border border-slate-300 w-full rounded-xl mb-2 outline-indigo-500"
          onChange={(e) => filterFriends(e.target.value)}
        />
      </div>
      <nav className="flex flex-col gap-2 overflow-y-auto min-h-0 h-full snap-y">
        <FriendRequestNotification refetchFriends={onFriendRequestApply} />

        {!filteredFriends?.length && (
          <div className={classes.no_results}>
            {getNoResultsText(filteredFriends || [], users || [])}
          </div>
        )}
        {filteredFriends
          ?.filter((u) => u.username !== auth.token?.sub)
          .map((u) => (
            <UserNavItem
              key={u.username}
              isActiveChat={activeChat?.username === u.username}
              isOnline={onlineUsers.includes(u.username)}
              user={u}
              onClick={(user) => onChatChange(user)}
              unreadItems={
                messages.filter((m) => m.sender === u.username && !m.is_read)
                  .length ||
                u.unread_message_count ||
                0
              }
            />
          ))}
      </nav>
    </div>
  )
}
