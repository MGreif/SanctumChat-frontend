export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN
export const USE_SSL = import.meta.env.VITE_USE_SSL === "true"
export const buildApiUrl = (url: string, schema = USE_SSL ? "https://" : "http://") => {
    return schema + API_ORIGIN + url
}
