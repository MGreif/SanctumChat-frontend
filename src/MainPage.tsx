import { Link } from "react-router-dom"
import { Layout } from "./layout"

export const MainPage = () => {

    return <Layout title="Main">
        <p>Please select a chat</p>
        <ul>
            <li><Link to={"/login"}>Login</Link></li>
            <li><Link to={"/chat/abc"}>Chat</Link></li>
        </ul>
    </Layout>
}
