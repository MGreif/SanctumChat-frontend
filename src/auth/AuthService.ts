import { EHTTPMethod, fetchRequest } from "../utils/fetch"

export class AuthService {
    private static _instance: AuthService

    private _token: string | null = null

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
        token && sessionStorage.setItem("token", token)
    }

    public async refreshToken () {
        const savedToken = sessionStorage.getItem("token")
        if (!savedToken) return
        const { body, response } = await fetchRequest<{ token: string }, { token: string }>("http://localhost:3000/token", {
            method: EHTTPMethod.POST, body: {
                token: savedToken
            }
        })
        const token = body.token
        console.log(body);

        if (token && response.ok) {
            console.log("token")
            this.token = token
        }
    }
}


