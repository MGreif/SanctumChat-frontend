import { FormEventHandler } from "react"
import { Layout } from "./layout"
import { AuthService } from "./auth/AuthService"
import { Link } from "react-router-dom"
import { useAuth } from "./auth/useAuth"



export const Login = () => {
    const { login, isLoggedIn } = useAuth()
    const handleSubmit: FormEventHandler = async (e: any) => {
        e.preventDefault()
        const username = e.target.username.value
        const password = e.target.password.value
        login(username, password)
    }



    return <Layout title="Login">
        <h3>{isLoggedIn ? "Logged in as " + AuthService.Instance.decodedToken?.sub : "Not logged in"}</h3>
        <form action="http://localhost:3000/login" onSubmit={handleSubmit} method="POST">
            <label htmlFor="username">Username</label>
            <input name="username" /> <br />
            <label htmlFor="password">Password</label>
            <input type="password" name="password" /><br />
            <button type="reset">Reset</button>
            <button type="submit">Login</button>
        </form>
        <Link to="/chat/asd">To Chat</Link>
    </Layout>
}
