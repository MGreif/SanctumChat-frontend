import { FC, PropsWithChildren, useState } from "react"
import classes from "./index.module.css"
import { useAuth } from "../Auth/useAuth"
import { Link } from "react-router-dom"
import { Button, Switch } from "@mantine/core";
type TLayoutProps = PropsWithChildren<{
    title: string,
    className?: string
}>

export const Layout: FC<TLayoutProps> = ({ children, title, className }) => {
    const auth = useAuth()
    const [mode, setMode] = useState<"dark" | "light">("light")
    return <div className={`${classes.container} ${mode === "light" ? classes.lightmode : classes.darkmode} ${className}`}>
        <div className={classes.header}>
            <h2>
                {title}
            </h2>
            <span className={classes.links}>
                {auth.isLoggedIn ? <>
                    <Link to={"/"}>Chat</Link>
                    <Link to={"/friend-requests"}>Friend Requests</Link>
                    <><span>Logged in as {auth.token?.name}</span><Button color={"red"} onClick={auth.logout}>Logout</Button></>
                </>
                    :
                    <>
                        <Link to={"/register"}>Register</Link>
                        <Link to={"/login"}>Login</Link>
                    </>
                }
            </span>
        </div>

        <div className={classes.content}>
            {children}
        </div>
    </div>
}
