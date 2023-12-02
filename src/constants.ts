export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN
export const buildApiUrl = (url: string, schema = "https://") => {
    return schema + API_ORIGIN + url
}