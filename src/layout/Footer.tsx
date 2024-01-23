import { buildApiUrl } from "../constants"
import { TApiResponse } from "../types/Api"
import { EHTTPMethod, useFetchEndpoint } from "../utils/fetch"

export const Footer = () => {
    const { data, isLoading } = useFetchEndpoint<object, TApiResponse<string>>({
        url: buildApiUrl("/version"),
        fetchOptions: {
            method: EHTTPMethod.GET
        },
    })
    return <footer className="flex justify-around items-center h-full w-full mx-auto">
            <span>Frontend Version: {APP_VERSION}</span>
            <span>Backend Version: {isLoading ? "loading ..." : data?.data}</span>
        </footer>
}
