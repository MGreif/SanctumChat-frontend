import { FC } from "react"
import { TUser } from "../types/user"
import classes from "./chat.module.css"

type TUserNavItemProps = {
    onClick: (user: TUser) => void,
    user: TUser
    isOnline: boolean
    isActiveChat: boolean
    hasUnreadItems: boolean
}

export const UserNavItem: FC<TUserNavItemProps> = ({ onClick, user, isOnline, isActiveChat, hasUnreadItems }) => {
    return <span
        onClick={() => onClick(user)}
        className={`${classes["user-nav-item"]} ${isActiveChat ? classes.active : ""}`}
    >
        <span className={`${isOnline ? classes.online : ""} ${classes.dot}`}></span>
        <span className={`${hasUnreadItems ? classes.unread : ""} ${classes.dot}`}></span>
        {user.name}
    </span>
}
