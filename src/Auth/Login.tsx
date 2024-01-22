import { FormEventHandler, useEffect } from "react"
import { Layout } from "../layout"
import { useAuth } from "./useAuth.tsx"
import { useNavigate } from "react-router";
import classes from "./index.module.css"
import { Button, PasswordInput, TextInput } from "@mantine/core";
import { useWebSocketContext } from "../chat/websocket.tsx";
export const Login = () => {
    const { login, isLoggedIn } = useAuth()
    const { establishConnection } = useWebSocketContext()
    const navigate = useNavigate()

    useEffect(() => {
        if (isLoggedIn) {
            navigate("/")
        }
    }, [isLoggedIn])
    const handleSubmit: FormEventHandler = async (e: any) => {
        e.preventDefault()
        const username = e.target.username.value
        const password = e.target.password.value
        if (!username || !password) return
        login(username, password).then(establishConnection)
    }



    return <Layout title="Login" className={classes.layout}>
        <div className={classes.formcontainer}>
            <form action="/login" onSubmit={handleSubmit} method="POST">
                <h2>Login</h2>
                <label htmlFor="username">Username</label> <br />
                <TextInput name="username" required /> <br />
                <label htmlFor="password">Password</label> <br />
                <PasswordInput type="password" name="password" required /><br />
                <div className={classes.actions}>
                    <Button variant={"light"} type="reset">Reset</Button>
                    <Button type="submit">Login</Button>
                </div>
            </form>
        </div>
    </Layout>
}
