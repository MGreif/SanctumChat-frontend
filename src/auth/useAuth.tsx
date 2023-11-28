import {FC, PropsWithChildren, SetStateAction, createContext, useContext, useState, useEffect} from "react";
import { AuthService, TToken } from "./AuthService";
import { EHTTPMethod, fetchRequest } from "../utils/fetch";
import {useLocation, useNavigate} from "react-router";
import {buildApiUrl} from "../constants.ts";

export type TAuth = {
    token: TToken | null,
    isLoggedIn: boolean
}


export const AuthContext = createContext<{ auth: TAuth, setAuth: React.Dispatch<SetStateAction<TAuth>> }>({
    auth: {
        isLoggedIn: AuthService.Instance.isLoggedIn,
        token: AuthService.Instance.decodedToken
    },
    setAuth () { },
})


export const AuthContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const [auth, setAuth] = useState<TAuth>({
        isLoggedIn: AuthService.Instance.isLoggedIn,
        token: AuthService.Instance.decodedToken
    })

    return <AuthContext.Provider value={{
        auth,
        setAuth
    }} >
        {children}
    </AuthContext.Provider>
}


export const useAuth = () => {
    const context = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()
    useEffect(() => {
        if (!context.auth.isLoggedIn && (location.pathname !== "/login") && location.pathname !== "/register" ) {
            navigate("/login")
        }
    }, [])
    const setLoggedIn = (value: boolean) => {
        context.setAuth(auth => ({
            ...auth,
            isLoggedIn: value
        }))
    }

    const login = async (username: string, password: string) => {
        const response = await fetchRequest<{ username: string, password: string }, { token: string }>(buildApiUrl("/login"), {
            method: EHTTPMethod.POST,
            body: { username, password },
        })
        const { token } = response.body
        AuthService.Instance.token = token
        context.setAuth(auth => ({ ...auth, token: AuthService.Instance.decodedToken }))
        setLoggedIn(!!token)
        navigate("/")
    }

    const register = async (username: string, name: string, age: number, password: string, public_key: string) => {
        await fetchRequest<{ username: string, password: string, age: number, name: string, public_key: string }>(buildApiUrl("/users"), {
            method: EHTTPMethod.POST,
            body: { username, password, name, age, public_key },
        })
        navigate("/login")
    }

    const logout = async () => {
        const response = await fetchRequest("http://localhost:3000/logout", {
            method: EHTTPMethod.POST,
        })

        if (!response.response.ok) return
        setLoggedIn(false)
        sessionStorage.removeItem("token")
        AuthService.Instance.isLoggedIn = false
        AuthService.Instance.token = null
        navigate("/login")
    }

    return { login, logout, register, ...context.auth }
}
