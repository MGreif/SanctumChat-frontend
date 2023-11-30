import {FormEventHandler, useState} from "react"
import { Layout } from "../layout"
import { useAuth } from "../auth/useAuth.tsx"
import classes from "./index.module.css"
import {Button, Checkbox, NumberInput, PasswordInput, Textarea, TextInput} from "@mantine/core";
export const Register = () => {
    const { register } = useAuth()
    const [generateKey, setChecked] = useState(false)
    const handleSubmit: FormEventHandler = async (e: any) => {
        e.preventDefault()
        const username = e.target.username.value
        const name = e.target.name.value
        const age = parseInt(e.target.age.value)
        const password = e.target.password.value
        const public_key = e.target.public_key.value
        register(username, name, age, password, public_key, generateKey)
    }



    return <Layout title="Register">
        <div className={classes.formcontainer}>
            <form action="http://localhost:3000/register" onSubmit={handleSubmit} method="POST">
                <label htmlFor="username">Username</label> <br />
                <TextInput name="username" /> <br />
                <label htmlFor="name">Name</label> <br />
                <TextInput name="name" /> <br />
                <label htmlFor="age">Age</label> <br />
                <NumberInput name="age" /> <br />
                <label htmlFor="password">Password</label> <br />
                <PasswordInput type="password" name="password" /><br />
                <Checkbox onChange={(e) => setChecked(e.target.checked)} mb={"1em"} label={"Let the server generate a RSA key pair"} />

                <label htmlFor="public_key">Or insert own public RSA key (Base64 encoded)</label> <br />
                <Textarea disabled={generateKey} rows={9} name="public_key" /><br />
                <div className={classes.actions}>
                    <Button variant={"light"} type="reset">Reset</Button>
                    <Button type="submit">Register</Button>
                </div>
            </form>
        </div>
    </Layout>
}
