export const API_URL = import.meta.env.VITE_API_URL
export const buildApiUrl = (url: string) => {
    return API_URL + url
}