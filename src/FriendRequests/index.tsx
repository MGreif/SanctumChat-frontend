import { FC, FormEventHandler, useRef } from "react";
import { Layout } from "../layout";
import classes from "./index.module.css"
import { Button, TextInput } from "@mantine/core";
import { useAuth } from "../Auth/useAuth.tsx";
import { EHTTPMethod, fetchRequest, useFetchEndpoint } from "../utils/fetch.ts";
import { buildApiUrl } from "../constants.ts";
import { TFriendRequest } from "../types/friends.ts";
import { TApiResponse } from "../types/Api.ts";
import { showSuccessNotification } from "../misc/Notifications/Notifications.ts";

export const FriendRequests: FC = () => {
    const auth = useAuth()
    const inputRef = useRef<HTMLInputElement>(null)
    const { data: friendRequests, refetch } = useFetchEndpoint<void, TApiResponse<TFriendRequest[]>>({
        url: buildApiUrl("/friend-requests"),
        fetchOptions: {
            method: EHTTPMethod.GET
        }
    }, {
        skip: !auth.isLoggedIn
    })

    const handleClick = ({ id, accepted }: { id: string, accepted: boolean }) => {
        fetchRequest<{ accepted: boolean }>(buildApiUrl("/friend-requests/" + id), {
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

    const handleSendClick: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        const value = inputRef.current?.value
        if (!value) return
        fetchRequest<{ recipient: string }, { message: string, data: null }>(buildApiUrl("/friend-requests"), {
            method: EHTTPMethod.POST,
            body: {
                recipient: value
            }
        }).then(r => r.response?.ok && showSuccessNotification({
            message: r.body.message,
            title: "Success"
        }))
    }


    return <Layout className={classes.layout} title={"Friend Requests"}>
        <div className="mx-auto w-3/4">
            <div className="flex gap-8 mb-8">
                <div className="flex-1 border h-fit border-slate-300 p-4 rounded-xl shadow-md">
                    <h2 className="text-xl mb-4">Send a friend request</h2>
                    <div>
                        <form onSubmit={handleSendClick}>
                            <div className="flex justify-between items-end gap-4">
                                <TextInput className="w-full" name="username" label="Username" required ref={inputRef} placeholder={"MaxMuster2000"} />
                                <Button className="bg-indigo-500 w-20" type="submit">Send</Button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="flex-1 border border-slate-300 p-4 rounded-xl shadow-md h-fit">
                    <h2 className="text-xl mb-2">Info</h2>
                    <p>
                        By adding a friend, you are sharing your username and public-key with him. Once the recipient approves your request, you can exchange messages.
                    </p>
                    <p>If he denies your request, you <b>can not</b> send him a request again.</p>

                </div>
            </div>
            <h2 className="mb-20 text-center text-3xl font-bold">Users that want to be your friend</h2>
            <div className="rounded-md min-h-fit">
                {!friendRequests?.data.length && <h4 className='py-4 text-center text-3xl font-bold text-slate-300'>No pending requests</h4>}
                {friendRequests?.data.map(u => <div className={classes.listitem}>
                    <span className={classes.name}>{u.sender_id}</span>
                    <span className={classes.buttons}>
                        <Button color={"red"} onClick={() => handleDenyClick(u.id)}>Deny</Button>
                        <Button color={"green"} onClick={() => handleAcceptClick(u.id)}>Accept</Button>
                    </span>
                </div>)}
            </div>
        </div>
    </Layout>
}
