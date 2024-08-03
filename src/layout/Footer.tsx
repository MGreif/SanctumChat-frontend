import { useEffect } from 'react'
import { buildApiUrl } from '../constants'
import { TApiResponse } from '../types/Api'
import { EHTTPMethod, useFetchEndpoint } from '../utils/fetch'

export const Footer = () => {
  const { data, isLoading, error } = useFetchEndpoint<
    object,
    TApiResponse<string>
  >({
    url: buildApiUrl('/version'),
    fetchOptions: {
      method: EHTTPMethod.GET,
    },
  })

  useEffect(() => {
    console.log(1)
  }, [])

  return (
    <footer className="flex justify-around items-center h-fit w-full m-auto">
      <span>Frontend Version: {APP_VERSION}</span>
      <span>
        Backend Version:{' '}
        {isLoading ? 'loading ...' : data?.data || error?.message}
      </span>
    </footer>
  )
}
