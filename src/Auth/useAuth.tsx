import { FC, PropsWithChildren, SetStateAction, createContext, useContext, useState, useEffect } from "react";
import { AuthService, TToken } from "./AuthService";
import { EHTTPMethod, fetchRequest } from "../utils/fetch.ts";
import { useLocation, useNavigate } from "react-router";
import { buildApiUrl } from "../constants.ts";
import { TApiResponse } from "../types/Api.ts";

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
        if (!context.auth.isLoggedIn && (location.pathname !== "/login") && location.pathname !== "/register") {
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

    const register = async (username: string, password: string, public_key: string, generateKey: boolean) => {
        const result = await fetchRequest<{ username: string, password: string, public_key: string, generate_key: boolean }, TApiResponse<number[]>>(buildApiUrl("/users"), {
            method: EHTTPMethod.POST,
            body: { username, password, public_key, generate_key: generateKey },
        })

        if (result.error) {
            return
        }

        if (generateKey) {
            const link = document.createElement('a');
            const decoded = String.fromCharCode(...result.body.data)
            link.href = URL.createObjectURL(new Blob([decoded]));
            link.download = `${username}.private.pem`; // specify the desired filename

            // Append the link to the document and trigger the download
            document.body.appendChild(link);
            link.click();

            // Remove the link from the document
            document.body.removeChild(link);
        }
        navigate("/login")
    }

    const logout = async () => {
        const response = await fetchRequest(buildApiUrl("/logout"), {
            method: EHTTPMethod.POST,
        })

        if (!response?.response?.ok) return
        setLoggedIn(false)
        sessionStorage.removeItem("token")
        AuthService.Instance.isLoggedIn = false
        AuthService.Instance.token = null
        navigate("/login")
    }

    return { login, logout, register, ...context.auth }
}
