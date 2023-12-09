import { FC, useCallback, useEffect, useRef } from "react"
import { buildApiUrl } from "../constants"
import { EHTTPMethod, fetchRequest } from "../utils/fetch"
import { notifications } from "@mantine/notifications"
import { MessageEventSubscriber, useWebSocketContext } from "./websocket"
import { TMessageFriendRequest, TMessageNotification } from "../types/messages"
import classes from "./FriendNav.module.css"
import { Button } from "@mantine/core"
import { showNotification } from "../misc/Notifications/Notifications"
type TFriendRequestNotificationProps = {
    refetchFriends: () => void
}

export const FriendRequestNotification: FC<TFriendRequestNotificationProps> = ({ refetchFriends }) => {
    const websocket = useWebSocketContext()

    const subscriber = useRef(new MessageEventSubscriber("FriendRequestNotification"))

    const handleFriendRequestMessageReceive = useCallback((message: TMessageFriendRequest) => {
        const { sender_username, friend_request_id } = message
        showNotification({
            type: "info",
            id: friend_request_id,
            message: <>{sender_username} sent you a friend request <div className={classes.friendrequest}>
                <Button color={"green"} onClick={() => handleFriendRequestClick({ id: friend_request_id, accepted: true })}>Accept</Button>
                <Button color={"red"} onClick={() => handleFriendRequestClick({ id: friend_request_id, accepted: false })}>Deny</Button>
            </div></>,
            title: "New Friend Request",
        })
    }, [])

    const handleNotificationReceive = (message: TMessageNotification) => {
        const { title, status, message: m } = message
        showNotification({
            type: status,
            message: m,
            title: title
        })
    }


    useEffect(() => {
        subscriber.current
            .setFriendRequestMessageReceive(handleFriendRequestMessageReceive)
            .setNotficationMessageReceive(handleNotificationReceive)

        websocket.meta?.current.publisher.subscribe(subscriber.current)
    }, [])


    const handleFriendRequestClick = useCallback(({ id, accepted }: { id: string, accepted: boolean }) => {
        fetchRequest<{ accepted: boolean }>(buildApiUrl("/friend-requests/" + id), {
            method: EHTTPMethod.PATCH,
            body: {
                accepted
            }
        }).then(() => {
            refetchFriends()
            notifications.hide(id)
        })
    }, [])

    return null
}
