import { FormEventHandler } from "react"
import { Layout } from "./layout"
import { AuthService } from "./auth/AuthService"
import { Link } from "react-router-dom"

export const Login = () => {
    const handleSubmit: FormEventHandler = async (e: any) => {
        e.preventDefault()
        const username = e.target.username.value
        const password = e.target.password.value
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
            headers: [
                ["Content-Type", "application/json"]
            ]
        })
        const { token } = await response.json()
        console.log(token)
        AuthService.Instance.token = token
    }
    return <Layout title="Login">
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
