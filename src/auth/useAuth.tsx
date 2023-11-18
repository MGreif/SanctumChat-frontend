import { FC, PropsWithChildren, SetStateAction, createContext, useContext, useEffect, useState } from "react";
import { AuthService, TToken } from "./AuthService";
import { EHTTPMethod, fetchRequest } from "../utils/fetch";

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

    const setLoggedIn = (value: boolean) => {
        context.setAuth(auth => ({
            ...auth,
            isLoggedIn: value
        }))
    }

    const login = async (username: string, password: string) => {
        const response = await fetchRequest<{ username: string, password: string }, { token: string }>("http://localhost:3000/login", {
            method: EHTTPMethod.POST,
            body: { username, password },
        })
        const { token } = response.body
        AuthService.Instance.token = token
        context.setAuth(auth => ({ ...auth, token: AuthService.Instance.decodedToken }))
        setLoggedIn(!!token)
    }

    const logout = async () => {
        // TODO remove session from BE
        console.log(AuthService.Instance.token);

        const response = await fetchRequest("http://localhost:3000/logout", {
            method: EHTTPMethod.POST,
        })

        if (!response.response.ok) return
        setLoggedIn(!!false)
        sessionStorage.removeItem("token")
        AuthService.Instance.isLoggedIn = false
        AuthService.Instance.token = null
    }

    return { login, logout, ...context.auth }
}
