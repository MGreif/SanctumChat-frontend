import { FC, useCallback, useEffect, useRef } from 'react'
import { buildApiUrl } from '../constants'
import { EHTTPMethod, fetchRequest } from '../utils/fetch'
import { notifications } from '@mantine/notifications'
import { MessageEventSubscriber, useWebSocketContext } from './websocket'
import {
  TMessageError,
  TMessageFriendRequest,
  TMessageNotification,
} from '../types/messages'
import { Button } from '@mantine/core'
import { showNotification } from '../misc/Notifications/Notifications'
type TFriendRequestNotificationProps = {
  refetchFriends: () => void
}

export const FriendRequestNotification: FC<TFriendRequestNotificationProps> = ({
  refetchFriends,
}) => {
  const { context: websocket } = useWebSocketContext()

  const subscriber = useRef(
    new MessageEventSubscriber('FriendRequestNotification')
  )

  const handleFriendRequestMessageReceive = useCallback(
    (message: TMessageFriendRequest) => {
      const { sender_username, friend_request_id } = message
      showNotification({
        type: 'info',
        id: friend_request_id,
        message: (
          <div className="flex gap-2 items-center">
            <span>{sender_username} sent you a friend request </span>
            <Button
              className="bg-green-500"
              onClick={() =>
                handleFriendRequestClick({
                  id: friend_request_id,
                  accepted: true,
                })
              }
            >
              Accept
            </Button>
            <Button
              className="bg-red-500"
              onClick={() =>
                handleFriendRequestClick({
                  id: friend_request_id,
                  accepted: false,
                })
              }
            >
              Deny
            </Button>
          </div>
        ),
        title: 'New Friend Request',
      })
    },
    []
  )

  const handleErrorMessageReceive = useCallback((message: TMessageError) => {
    showNotification({
      type: 'error',
      message: message.message,
      title: 'Error',
    })
  }, [])

  const handleNotificationReceive = (message: TMessageNotification) => {
    const { title, status, message: m } = message
    showNotification({
      type: status,
      message: m,
      title: title,
    })
  }

  useEffect(() => {
    subscriber.current
      .setFriendRequestMessageReceive(handleFriendRequestMessageReceive)
      .setNotficationMessageReceive(handleNotificationReceive)
      .setErrorMessageReceive(handleErrorMessageReceive)

    websocket.meta?.current.publisher.subscribe(subscriber.current)
  }, [])

  const handleFriendRequestClick = useCallback(
    ({ id, accepted }: { id: string; accepted: boolean }) => {
      fetchRequest<{ accepted: boolean }>(
        buildApiUrl('/friend-requests/' + id),
        {
          method: EHTTPMethod.PATCH,
          body: {
            accepted,
          },
        }
      ).then(() => {
        refetchFriends()
        notifications.hide(id)
      })
    },
    []
  )

  return null
}
