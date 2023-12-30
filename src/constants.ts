export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || ""
export const USE_SSL = import.meta.env.VITE_USE_SSL === "true"
export const USE_RELATIVE_PATH = import.meta.env.VITE_USE_RELATIVE_PATH === "true"
export const BASE_PATH = import.meta.env.VITE_BASE_PATH || ""

const defaultSchema = USE_RELATIVE_PATH ? "" : (USE_SSL ? "https://" : "http://")

export const buildApiUrl = (url: string, schema = defaultSchema) => {
    const apiLocation = USE_RELATIVE_PATH ? window.location.origin : API_ORIGIN
    return schema + apiLocation + BASE_PATH + url
}
