import { FC, PropsWithChildren } from "react"
import classes from "./index.module.css"
import { useAuth } from "../auth/useAuth"
import { Link } from "react-router-dom"
type TLayoutProps = PropsWithChildren<{
    title: string
}>

export const Layout: FC<TLayoutProps> = ({ children, title }) => {
    const auth = useAuth()
    return <div className={classes.container}>
        <div className={classes.header}>
            <h2>
                {title}
            </h2>
            <span>

                {auth.isLoggedIn ? <><span>Logged in as {auth.token?.name}</span><button onClick={auth.logout}>Logout</button></> : <Link to={"/login"}>Login</Link>}
            </span>
        </div>

        <div>
            {children}
        </div>
    </div>
}
