import { FC } from "react"
import { TUser } from "../types/user"

type TUserNavItemProps = {
    onClick: (user: TUser) => void,
    user: TUser
    isOnline: boolean
    isActiveChat: boolean
    unreadItems: number
}

export const UserNavItem: FC<TUserNavItemProps> = ({ onClick, user, isOnline, isActiveChat, unreadItems }) => {
    console.log(user, isActiveChat);
    
    return <span
        onClick={() => onClick(user)}
        className={`${isActiveChat ? "bg-indigo-500" : "bg-indigo-300"} cursor-pointer p-4 flex justify-between items-center hover:bg-indigo-500 text-white rounded-lg w-11/12 m-2`}
    >
        {user.username}
        <span className='flex justify-start gap-2 h-min-0'>
            <span className={`h-6 bg-green-700 p-1 rounded-full relative w-6 ${isOnline ? "" : "invisible"}`}></span>
            {!!unreadItems && <span className='h-6 bg-indigo-800 p-1 rounded-full relative w-6 flex items-center justify-center'>
                <span className='text-sm top-0'>{unreadItems}</span>
            </span>}
        </span>
    </span>
}
