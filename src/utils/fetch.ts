import { AuthService } from "../auth/AuthService"
import {useCallback, useEffect, useState} from "react";
import {showErrorNotification} from "../misc/Notifications/Notifications.ts";
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

type TuseFetchEndpointArgs<RequestBody> = {
    url: string
    fetchOptions: TfetchOptions<RequestBody>
}

type TuseFetchEndpointOptions = {
    skip?: boolean
}

export function useFetchEndpoint<RequestBody = object, ResponseBody = object> (fetchArgs: TuseFetchEndpointArgs<RequestBody>, options?: TuseFetchEndpointOptions) {
    const [data, setData] = useState<ResponseBody>()
    const [isLoading, setIsLoading] = useState(false)
    const refetch = useCallback((body?: RequestBody) => {
        if (options?.skip) return
        setIsLoading(true)
        fetchRequest<RequestBody, ResponseBody>(fetchArgs.url, {
            ...fetchArgs.fetchOptions,
            body: body,
        }).then(({ body, response }) => {
            setIsLoading(false)
            if (!response.ok) {
                showErrorNotification({
                    title: "Fetching failed",
                    message: fetchArgs.url
                })
                return
            }

            setData(body)
        })
    }, [])

    useEffect(() => {
        if (options?.skip) return
        refetch(fetchArgs.fetchOptions.body)
    }, [])

    return {
        data,
        refetch,
        isLoading
    }
}
