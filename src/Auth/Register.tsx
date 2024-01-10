import { FormEventHandler, useState } from "react"
import { Layout } from "../layout"
import { useAuth } from "./useAuth.tsx"
import classes from "./index.module.css"
import { Button, Checkbox, FileInput, NumberInput, PasswordInput, TextInput } from "@mantine/core";
import { toBase64 } from "js-base64";
import { InfoInline } from "../Components/InfoInline.tsx";


const tooltipText = "As of the current version of SanctumChat, generating an RSA keypair will happen on the server side. Thus eavesdropping on the communication channel could result in potential decryption and disclosure of the private key."

export const Register = () => {
    const { register } = useAuth()
    const [generateKey, setChecked] = useState(false)
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const handleSubmit: FormEventHandler = async (e: any) => {
        e.preventDefault()
        console.log(publicKey)
        if (!generateKey && !publicKey) return
        const username = e.target.username.value
        const name = e.target.name.value
        const age = parseInt(e.target.age.value)
        const password = e.target.password.value
        const public_key = toBase64(publicKey || "")
        register(username, name, age, password, public_key, generateKey)
    }



    return <Layout title="Register">
        <div className={classes.formcontainer}>
            <form action="/register" onSubmit={handleSubmit} method="POST">
                <label className={classes.required} htmlFor="username">Username</label> <br />
                <TextInput required name="username" /> <br />
                <label className={classes.required} htmlFor="name">Name</label> <br />
                <TextInput required name="name" /> <br />
                <label className={classes.required} htmlFor="age">Age</label> <br />
                <NumberInput required name="age" /> <br />
                <label className={classes.required} htmlFor="password">Password</label> <br />
                <PasswordInput required type="password" name="password" /><br />
                <label className={generateKey ? "" : classes.required} htmlFor="public_key">Insert own public RSA key (PKCS#8 .pem file)</label> <br />
                <FileInput onChange={file => file?.text().then(setPublicKey)} disabled={generateKey} required={!generateKey} />
                <Checkbox required={false} className={classes.marginTop} onChange={(e) => setChecked(e.target.checked)} mb={"1em"} label={<InfoInline tooltip={tooltipText} text={"Or let the server generate a RSA key pair"} />} />
                <div className={classes.actions}>
                    <Button variant={"light"} type="reset">Reset</Button>
                    <Button type="submit">Register</Button>
                </div>
            </form>
        </div>
    </Layout >
}
