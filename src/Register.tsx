import {FormEventHandler, useEffect} from "react"
import { Layout } from "./layout"
import { Link } from "react-router-dom"
import { useAuth } from "./auth/useAuth"
import {useNavigate} from "react-router";

export const Register = () => {
    const { register, isLoggedIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit: FormEventHandler = async (e: any) => {
        e.preventDefault()
        const username = e.target.username.value
        const name = e.target.name.value
        const age = parseInt(e.target.age.value)
        const password = e.target.password.value
        const public_key = e.target.public_key.value
        register(username, name, age, password, public_key)
    }



    return <Layout title="Register">
        <form action="http://localhost:3000/register" onSubmit={handleSubmit} method="POST">
            <label htmlFor="username">Username</label>
            <input name="username" /> <br />
            <label htmlFor="name">Name</label>
            <input name="name" /> <br />
            <label htmlFor="age">Age</label>
            <input name="age" type={"number"} /> <br />
            <label htmlFor="password">Password</label>
            <input type="password" name="password" /><br />
            <label htmlFor="public_key">Public RSA key</label>
            <textarea name="public_key" /><br />
            <button type="reset">Reset</button>
            <button type="submit">Register</button>
        </form>
        <Link to="/">To Chat</Link>
    </Layout>
}
