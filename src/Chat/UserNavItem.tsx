import { FC, useEffect, useRef, useState } from 'react'
import { TUser } from '../types/user'
import { Text, Tooltip } from '@mantine/core'

type TUserNavItemProps = {
  onClick: (user: TUser) => void
  user: TUser
  isOnline: boolean
  isActiveChat: boolean
  unreadItems: number
}

export const Username: FC<{ username: string }> = ({ username }) => {
  const [oversized, setOversized] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!ref.current) return
    console.log(ref.current.scrollWidth, ref.current.offsetWidth)

    if (ref.current.scrollWidth > ref.current.offsetWidth) {
      setOversized(true)
    }
  }, [ref.current])

  return (
    <Tooltip disabled={!oversized} label={username}>
      <Text
        truncate={oversized}
        ref={ref}
        className="max-w-40 transition min-w-0 relative"
      >
        {username}
      </Text>
    </Tooltip>
  )
}

export const UserNavItem: FC<TUserNavItemProps> = ({
  onClick,
  user,
  isOnline,
  isActiveChat,
  unreadItems,
}) => {
  return (
    <span
      onClick={() => onClick(user)}
      className={`${isActiveChat ? 'bg-indigo-500' : 'bg-indigo-300'} active:bg-indigo-600 text-nowrap min-w-0 relative cursor-pointer p-4 flex snap-start justify-between items-center hover:bg-indigo-500 text-white rounded-lg w-full`}
    >
      <Username username={user.username} />
      <span className="flex justify-start gap-2 h-min-0">
        <span
          className={`h-6 bg-green-700 p-1 rounded-full relative w-6 ${isOnline ? '' : 'invisible'}`}
        ></span>
        {!!unreadItems && (
          <span className="h-6 bg-indigo-800 p-1 rounded-full relative w-6 flex items-center justify-center">
            <span className="text-sm top-0">{unreadItems > 99 ? "99+" : unreadItems}</span>
          </span>
        )}
      </span>
    </span>
  )
}
