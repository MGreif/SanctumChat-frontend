// This is used to debounce the update of friend status. This will prevent the friend status from updating whenever a friend reloads his page

import { useEffect, useRef } from "react"
import { EEvent } from "../types/messages"

type TFriendStatusUpdateEvent = {
    triggeredAt: number // Timestamp of trigger
    event: EEvent
    timeout?: NodeJS.Timeout
}


// When last event occured
// What last event was
// Starting timout with specified callback
// If new online event occures, the timeout should be deleted


export type TUseFriendStatusDebounceState = Record<string, TFriendStatusUpdateEvent>

export const useFriendStatusDebounce = () => {
    const friendStatusDebounceState = useRef<TUseFriendStatusDebounceState>({})


    useEffect(() => {
        console.log("STATE", friendStatusDebounceState.current)

    }, [friendStatusDebounceState.current])

    const dispatch = (state: TUseFriendStatusDebounceState, username: string, event: EEvent, callback: () => void, timeoutDuration = 200) => {

        const newEvent: TFriendStatusUpdateEvent = { event, timeout: setTimeout(callback, timeoutDuration), triggeredAt: Date.now() }

        let savedEvent = state[username]

        if (!savedEvent) {
            friendStatusDebounceState.current = { ...state, [username]: newEvent }
        } else {
            const timeDelta = newEvent.triggeredAt - savedEvent.triggeredAt

            if (timeDelta < timeoutDuration && newEvent.event === EEvent.ONLINE && savedEvent.event === EEvent.OFFLINE) {
                // Prevent UI status change from happening

                clearTimeout(savedEvent.timeout)
            }
            friendStatusDebounceState.current = { ...state, [username]: newEvent }
        }
    }


    return { dispatch, friendStatusDebounceState }


}
