import { FC, PropsWithChildren } from "react"
import classes from "./index.module.css"
import { useAuth } from "../auth/useAuth"
import { Link } from "react-router-dom"
type TLayoutProps = PropsWithChildren<{
    title: string,
    className?: string
}>

export const Layout: FC<TLayoutProps> = ({ children, title, className }) => {
    const auth = useAuth()
    return <div className={`${classes.container} ${className}`}>
        <div className={classes.header}>
            <h2>
                {title}
            </h2>
            <span className={classes.links}>
                {auth.isLoggedIn && <Link to={"/friend-requests"}>Friend Requests</Link>}
                {!auth.isLoggedIn && <Link to={"/register"}>Register</Link>}
                {auth.isLoggedIn ? <><span>Logged in as {auth.token?.name}</span><button onClick={auth.logout}>Logout</button></> : <Link to={"/login"}>Login</Link>}
            </span>
        </div>

        <div className={classes.content}>
            {children}
        </div>
    </div>
}
