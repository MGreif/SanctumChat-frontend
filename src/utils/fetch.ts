import { AuthService } from "../auth/AuthService"
import { useCallback, useEffect, useState } from "react";
import { showErrorNotification } from "../misc/Notifications/Notifications.ts";
export enum EHTTPMethod {
    GET = "GET",
    POST = "POST",
    DELETE = "DELETE",
    PATCH = "PATCH",
    PUT = "PUT"
}


export type TfetchOptions<RequestBody, ResponseBody, ResponseBodyAfterTransform> = {
    method: EHTTPMethod,
    transform?: (response: ResponseBody | undefined) => ResponseBodyAfterTransform
    body?: RequestBody
    fetchOptions?: RequestInit

}

export type TfetchReturn<Body = object> = {
    response?: Response,
    body: Body,
    error?: { message?: string }
}

export async function fetchRequest<RequestBody = object, ResponseBody = object, ResponseBodyAfterTransform = object> (url: string, {
    method,
    body,
}: TfetchOptions<RequestBody, ResponseBody, ResponseBodyAfterTransform>): Promise<TfetchReturn<ResponseBody>> {
    const authHeader: [string, string] | null = AuthService.Instance.token ? ["authorization", `Bearer ${AuthService.Instance.token}`] : null

    let response: Response | null = null;
    try {
        response = await fetch(url, {
            method: method as string,
            body: body ? JSON.stringify(body) : undefined,
            headers: [
                ["Content-Type", "application/json"],
                ...(authHeader ? [authHeader] : [])

            ]
        })
    } catch (err) {
        showErrorNotification({
            message: err?.toString(),
            title: "Failed fetching"
        })
        return {
            body: {} as ResponseBody,
            error: {
                message: err?.toString()
            },
        }
    }


    if (!response?.ok && response?.status !== 400) {
        showErrorNotification({
            message: `Could not fetch ${url}: ${response?.statusText}`,
            title: "Failed fetching"
        })

        return {
            body: {} as ResponseBody,
            error: {
                message: "Failed fetching"
            },
        }
    }

    let json: ResponseBody = {} as ResponseBody

    try {
        json = await response?.json() as ResponseBody
    } catch (err) { }

    return {
        body: json,
        response: response as Response,
    }
}

type TuseFetchEndpointArgs<RequestBody, ResponseBody, ResponseBodyAfterTransform> = {
    url: string
    fetchOptions: TfetchOptions<RequestBody, ResponseBody, ResponseBodyAfterTransform>
}

type TuseFetchEndpointOptions = {
    skip?: boolean
}

export function useFetchEndpoint<RequestBody = object, ResponseBody = object, ResponseBodyAfterTransform = ResponseBody> (fetchArgs: TuseFetchEndpointArgs<RequestBody, ResponseBody, ResponseBodyAfterTransform>, options?: TuseFetchEndpointOptions) {
    const [data, setData] = useState<ResponseBodyAfterTransform>()
    const [error, setError] = useState<{ message?: string } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const refetch = useCallback((body?: RequestBody) => {
        if (options?.skip) return
        setIsLoading(true)
        fetchRequest<RequestBody, ResponseBody, ResponseBodyAfterTransform>(fetchArgs.url, {
            ...fetchArgs.fetchOptions,
            body: body,
        }).then(({ body, error }) => {
            setIsLoading(false)
            if (error) {
                setError(error)
                return
            }
            const data = fetchArgs.fetchOptions.transform ? fetchArgs.fetchOptions.transform(body) : body
            setData(data as ResponseBodyAfterTransform)
        })
    }, [])

    useEffect(() => {
        if (options?.skip) return
        refetch(fetchArgs.fetchOptions.body)
    }, [])

    return {
        data,
        refetch,
        isLoading,
        error
    }
}
