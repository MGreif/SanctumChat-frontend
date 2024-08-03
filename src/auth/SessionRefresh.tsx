import { FC, useEffect, useRef } from "react"
import { AuthService } from "./AuthService"


type TSessionRefreshProps = {
    refreshDebounceTime?: number
}

const canRefresh = (lastRefreshTimestamp: number, currentTimestamp: number, refreshDebounceTime: number): boolean => {
    const deltaMs = currentTimestamp - lastRefreshTimestamp
    return deltaMs > refreshDebounceTime
}

export const SessionRefresh: FC<TSessionRefreshProps> = ({
    refreshDebounceTime = 60000 // 60 Seconds
}) => {
    const lastRefreshTimestamp = useRef(new Date().getTime());



    useEffect(() => {
        document.body.addEventListener("mousedown", () => {
            const now = new Date().getTime()
            if (canRefresh(lastRefreshTimestamp.current, now, refreshDebounceTime)) {
                lastRefreshTimestamp.current = now
                console.log("refreshed session")
                AuthService.Instance.refreshToken()
            }
        })

    }, [])

    return null
}
