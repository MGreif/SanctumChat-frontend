import { useParams } from "react-router"
import { Layout } from "../layout"

export const Chat = () => {
    const params = useParams<{ chatId: string }>()
    return <Layout title="Chat">
        <span>{params.chatId}</span>
    </Layout>
}
