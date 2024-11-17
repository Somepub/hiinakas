/// <reference types="vite/client" />

interface ImportMetaEnv {
    // @ts-expect-error
    readonly DEV: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}