import { jwtDecode } from "jwt-decode"
import { EHTTPMethod, fetchRequest } from "../utils/fetch"

export type TToken = {
    sub: string
    name: string
    public_key: string
}

export class AuthService {
    private static _instance: AuthService

    private _token: string | null = null
    private _decodedToken: TToken | null = null
    public isLoggedIn: boolean = false

    public static get Instance (): AuthService {
        if (!AuthService._instance) {
            AuthService._instance = new AuthService()
        }

        return AuthService._instance
    }

    public get token () {
        return this._token
    }

    public set token (token: string | null) {
        this._token = token
        this.isLoggedIn = !!token

        if (!token) return
        sessionStorage.setItem("token", token)
        this._decodedToken = jwtDecode(token) as TToken
    }

    public get decodedToken () {
        return this._decodedToken
    }

    public async refreshToken () {
        const savedToken = sessionStorage.getItem("token")
        if (!savedToken) return
        this.token = savedToken
        const { body, response } = await fetchRequest<{ token: string }, { token: string }>("http://localhost:3000/token", {
            method: EHTTPMethod.POST
        })
        const token = body.token

        if (token && response.ok) {
            console.log("token")
            this.token = token
        }
    }
}

