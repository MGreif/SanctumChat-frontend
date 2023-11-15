export class AuthService {
    private static _instance: AuthService

    private static _token: string

    public static get Instance (): AuthService {
        if (!AuthService._instance) {
            AuthService._instance = new AuthService()
        }

        return AuthService._instance
    }

    public get token () {
        return AuthService._token
    }

    public set token (token: string) {
        AuthService._token = token
    }

}
