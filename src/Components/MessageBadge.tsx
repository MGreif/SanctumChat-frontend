import { Tooltip } from '@mantine/core'
import { FC } from 'react'

type TMessageBadgeProps = {
  className?: string
  content: string
  isEncrypted: boolean
  isVerified: boolean
  sentByUser: boolean
}

export const MessageBadge: FC<TMessageBadgeProps> = (props) => {
  const extraClasses = []

  const color = props.sentByUser ? 'bg-indigo-500' : 'bg-sky-500'

  extraClasses.push(props.isVerified ? color : 'bg-red-700')

  if (props.sentByUser) {
    extraClasses.push('justify-self-end')
  } else {
    extraClasses.push('justify-self-start')
  }

  const Content = (
    <span
      className={`${props.className || ''} ${extraClasses.join(' ')} p-1 px-3 text-white rounded-2xl w-fit`}
    >
      {props.isEncrypted ? 'Encrypted' : props.content}
    </span>
  )

  if (!props.isVerified)
    return (
      <Tooltip
        style={{ width: '300px' }}
        multiline
        withArrow
        label={
          <span>
            Message signature could not be verified! This message might have
            been altered or intercepted!
          </span>
        }
      >
        {Content}
      </Tooltip>
    )

  return Content
}
