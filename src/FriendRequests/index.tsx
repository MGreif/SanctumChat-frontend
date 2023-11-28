import {FC, useRef} from "react";
import {Layout} from "../layout";
import classes from "./index.module.css"
import {Button, TextInput} from "@mantine/core";
import {useAuth} from "../auth/useAuth.tsx";
import {EHTTPMethod, fetchRequest, useFetchEndpoint} from "../utils/fetch.ts";
import {buildApiUrl} from "../constants.ts";
import {TFriendRequest} from "../types/friends.ts";
import {showErrorNotification, showSuccessNotification} from "../misc/Notifications/Notifications.ts";


export const FriendRequests: FC = () => {
    const auth = useAuth()
    const inputRef = useRef<HTMLInputElement>(null)
    const { data: friendRequests, refetch } = useFetchEndpoint<void, TFriendRequest[]>({
        url: buildApiUrl("/friend-requests"),
        fetchOptions: {
            method: EHTTPMethod.GET
        }
    }, {
        skip: !auth.isLoggedIn
    })

    const handleClick = ({ id, accepted }: { id: string, accepted: boolean }) => {
        fetchRequest<{ accepted: boolean }>(buildApiUrl("/friend-requests/"+id), {
            method: EHTTPMethod.PATCH,
            body: {
                accepted
            }
        }).then(() => {
            refetch()
        })
    }

    const handleDenyClick = (id: string) => {
        handleClick({
            id,
            accepted: false
        })
    }

    const handleAcceptClick = (id: string) => {
        handleClick({
            id,
            accepted: true
        })
    }

    const handleSendClick = () => {
        const value = inputRef.current?.value
        if (!value) return

        fetchRequest<{ recipient: string }, {message: string, data: null}>(buildApiUrl("/friend-requests"), {
            method: EHTTPMethod.POST,
            body: {
                recipient: value
            }
        }).then(({ response, body }) => {
            if (!response.ok) {
                showErrorNotification({
                    title: "Error",
                    message: body.message
                })
                return
            }
            showSuccessNotification({
                title: "Success",
                message: "Successfully added user"
            })
        })

        inputRef.current.value = ""
    }


    return <Layout title={"Friend Requests"}>
        <div className={classes.container}>
            <div>
                <h2>Send a friend request</h2>
                <TextInput ref={inputRef} placeholder={"Max Musterman"} />
                <Button onClick={() => handleSendClick()}>Send</Button>
            </div>
            <div className={classes.list}>
                {friendRequests?.map(u => <div className={classes.listitem}>
                    <span className={classes.name}>{u.sender_name}</span>
                    <span className={classes.buttons}>
                        <Button color={"red"} onClick={() => handleDenyClick(u.id)}>Deny</Button>
                        <Button color={"green"} onClick={() => handleAcceptClick(u.id)}>Accept</Button>
                    </span>
                </div>)}
            </div>
        </div>
    </Layout>
}