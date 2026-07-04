/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOUNDCLOUD_CLIENT_ID: string
  readonly VITE_ENABLE_REACT_DEVTOOLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
