interface ImportMetaEnv {
  readonly VITE_SERVER_API_URL?: string
  readonly VITE_STREAM_IDLE_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
