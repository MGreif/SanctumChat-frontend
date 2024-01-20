import { FC } from "react"
import { TUser } from "../types/user"
import classes from "./chat.module.css"

type TUserNavItemProps = {
    onClick: (user: TUser) => void,
    user: TUser
    isOnline: boolean
    isActiveChat: boolean
    unreadItems: number
}

export const UserNavItem: FC<TUserNavItemProps> = ({ onClick, user, isOnline, isActiveChat, unreadItems }) => {
    return <span
        onClick={() => onClick(user)}
        className={`${classes["user-nav-item"]} ${isActiveChat ? classes.active : ""}`}
    >
        <span className={`${isOnline ? classes.online : ""} ${classes.dot}`}></span>
        <span className={`${unreadItems ? classes.unread : ""} ${classes.dot}`}>
            {unreadItems ? <span className={classes.unread_count}>{unreadItems}</span> : ""}
        </span>
        {user.username}
    </span>
}
