import {
  showNotification as sN,
  NotificationData,
} from '@mantine/notifications'
import { ReactNode } from 'react'

type TShowNotificationArgs = NotificationData & {
  type: 'success' | 'error' | 'info'
  title: string
  message: ReactNode
}

const colorMap = {
  success: 'green',
  error: 'red',
  info: 'blue',
}
export const showNotification = ({
  message,
  title,
  type,
  ...nD
}: TShowNotificationArgs) => {
  sN({
    message,
    title,
    color: colorMap[type],
    ...nD,
  })
}

export const showSuccessNotification = (
  args: Omit<TShowNotificationArgs, 'type'>
) => {
  showNotification({
    ...args,
    type: 'success',
  })
}

export const showErrorNotification = (
  args: Omit<TShowNotificationArgs, 'type'>
) => {
  showNotification({
    ...args,
    type: 'error',
  })
}
