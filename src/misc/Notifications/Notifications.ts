import { showNotification as sN } from "@mantine/notifications";

type TShowNotificationArgs = {
    type: "success" | "error"
    title: string,
    message: string
}

const colorMap = {
    "success": "green",
    "error": "red"
}
export const showNotification = ({ message, title, type }: TShowNotificationArgs) => {
    sN({
        message,
        title,
        color: colorMap[type]
    })
}

export const showSuccessNotification = (args: Omit<TShowNotificationArgs, "type">) => {
    showNotification({
        ...args,
        type: "success"
    })
}

export const showErrorNotification = (args: Omit<TShowNotificationArgs, "type">) => {
    showNotification({
        ...args,
        type: "error"
    })
}