import { AuthService } from '../auth/AuthService.ts'
import { useCallback, useEffect, useState } from 'react'
import { showErrorNotification } from '../misc/Notifications/Notifications.ts'
import { TApiResponse } from '../types/Api.ts'
export enum EHTTPMethod {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  PUT = 'PUT',
}

export type TfetchOptions<
  RequestBody,
  ResponseBody,
  ResponseBodyAfterTransform,
> = {
  method: EHTTPMethod
  transform?: (response: ResponseBody | undefined) => ResponseBodyAfterTransform
  body?: RequestBody
  fetchOptions?: RequestInit
}

export type TError = {
  message?: string
}

export type TfetchReturn<Body = object> = {
  response?: Response
  body: Body
  error?: TError
}

function handleParsingFailed<R> (): TfetchReturn<R> {
  showErrorNotification({
    title: 'Fetching failed',
    message: 'Could not parse response body',
  })

  return {
    body: {} as R,
    error: {
      message: 'Could not parse response body',
    },
  }
}

function handleFetchingFailed<R> (err: string): TfetchReturn<R> {
  showErrorNotification({
    title: 'Fetching failed',
    message: err,
  })

  return {
    body: {} as R,
    error: {
      message: err,
    },
  }
}

export async function fetchRequest<
  RequestBody = object,
  ResponseBody = object,
  ResponseBodyAfterTransform = object,
> (
  url: string,
  {
    method,
    body,
  }: TfetchOptions<RequestBody, ResponseBody, ResponseBodyAfterTransform>
): Promise<TfetchReturn<ResponseBody>> {
  const authHeader: [string, string] | null = AuthService.Instance.token
    ? ['authorization', `Bearer ${AuthService.Instance.token}`]
    : null

  let response: Response | null = null
  try {
    response = await fetch(url, {
      method: method as string,
      body: body ? JSON.stringify(body) : undefined,
      headers: [
        ['Content-Type', 'application/json'],
        ...(authHeader ? [authHeader] : []),
      ],
    })
  } catch (err) {
    return handleFetchingFailed(err?.toString?.() || 'Fetching failed')
  }

  if (!response?.ok && response?.status !== 400) {
    let json: TApiResponse<string> = await response.json()
    showErrorNotification({
      message:
        json.message || `Could not fetch ${url}: ${response?.statusText}`,
      title: response?.statusText || 'Failed',
    })

    return {
      body: {} as ResponseBody,
      response: response,
      error: {
        message: 'Failed fetching',
      },
    }
  } else if (!response.ok) {
    let json: TError = {} as TError

    try {
      json = (await response?.json()) as TError
    } catch (err) {
      return handleParsingFailed()
    }

    showErrorNotification({
      message: json.message,
      title: 'Failed fetching',
    })

    return {
      body: {} as ResponseBody,
      response: response,
      error: json,
    }
  }

  let json: ResponseBody = {} as ResponseBody

  try {
    json = (await response?.json()) as ResponseBody
  } catch (err) {
    return handleParsingFailed()
  }

  return {
    body: json,
    response: response as Response,
  }
}

type TuseFetchEndpointArgs<
  RequestBody,
  ResponseBody,
  ResponseBodyAfterTransform,
> = {
  url: string
  fetchOptions: TfetchOptions<
    RequestBody,
    ResponseBody,
    ResponseBodyAfterTransform
  >
}

type TuseFetchEndpointOptions = {
  skip?: boolean
}

export function useFetchEndpoint<
  RequestBody = object,
  ResponseBody = object,
  ResponseBodyAfterTransform = ResponseBody,
> (
  fetchArgs: TuseFetchEndpointArgs<
    RequestBody,
    ResponseBody,
    ResponseBodyAfterTransform
  >,
  options?: TuseFetchEndpointOptions
) {
  const [data, setData] = useState<ResponseBodyAfterTransform>()
  const [error, setError] = useState<{ message?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const refetch = useCallback((body?: RequestBody) => {
    if (options?.skip) return
    setIsLoading(true)
    fetchRequest<RequestBody, ResponseBody, ResponseBodyAfterTransform>(
      fetchArgs.url,
      {
        ...fetchArgs.fetchOptions,
        body: body,
      }
    ).then(({ body, error }) => {
      setIsLoading(false)
      if (error) {
        setError(error)
        return
      }
      const data = fetchArgs.fetchOptions.transform
        ? fetchArgs.fetchOptions.transform(body)
        : body
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
    error,
  }
}
