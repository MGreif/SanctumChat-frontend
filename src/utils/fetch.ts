import { AuthService } from "../auth/AuthService"

fetch

export enum EHTTPMethod {
    GET = "GET",
    POST = "POST",
    DELETE = "DELETE",
    PATCH = "PATCH",
    PUT = "PUT"
}


export type TfetchOptions<RequestBody> = {
    method: EHTTPMethod,
    body?: RequestBody
    fetchOptions?: RequestInit
}

export type TfetchReturn<Body = object> = {
    response: Response,
    body: Body,
}

export async function fetchRequest<RequestBody = object, ResponseBody = object> (url: string, {
    method,
    body,
}: TfetchOptions<RequestBody>): Promise<TfetchReturn<ResponseBody>> {
    const authHeader: [string, string] | null = AuthService.Instance.token ? ["authorization", `Bearer ${AuthService.Instance.token}`] : null
    const response = await fetch(url, {
        method: method as string,
        body: body ? JSON.stringify(body) : undefined,
        headers: [
            ["Content-Type", "application/json"],
            ...(authHeader ? [authHeader] : [])

        ]
    })
    return {
        body: await response.json() as ResponseBody,
        response,
    }
}
