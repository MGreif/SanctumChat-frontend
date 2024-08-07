import { jwtDecode } from 'jwt-decode'
import { EHTTPMethod, fetchRequest } from '../utils/fetch.ts'
import { buildApiUrl } from '../constants.ts'
import { TApiResponse } from '../types/Api.ts'

export type TToken = {
  sub: string
  public_key: string
}

export class AuthService {
  private static _instance: AuthService

  private _token: string | null = null
  private _decodedToken: TToken | null = null
  public isLoggedIn: boolean = false

  public static get Instance(): AuthService {
    if (!AuthService._instance) {
      AuthService._instance = new AuthService()
    }

    return AuthService._instance
  }

  public get token() {
    return this._token
  }

  public set token(token: string | null) {
    this._token = token
    this.isLoggedIn = !!token

    if (!token) return
    if (typeof token !== 'string') return
    sessionStorage.setItem('token', token)
    this._decodedToken = jwtDecode(token) as TToken
  }

  public get decodedToken() {
    return this._decodedToken
  }

  public async refreshToken(): Promise<void> {
    const savedToken = sessionStorage.getItem('token')
    this.token = savedToken

    if (!savedToken) return
    const { body, response } = await fetchRequest<string, TApiResponse<string>>(
      buildApiUrl('/token'),
      {
        method: EHTTPMethod.POST,
      }
    )
    const token = body.data
    this.token = token

    if (token && response?.ok) {
      this.token = token
    }

    if (!response?.ok && response?.status === 401) {
      return Promise.reject()
    }
  }
}
