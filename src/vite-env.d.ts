/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_API_ORIGIN: string
    readonly VITE_USE_RELATIVE_PATH: string
    readonly VITE_BASE_PATH: string
    // more env variables...
}

declare const APP_VERSION: string;
