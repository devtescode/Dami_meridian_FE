/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the DAMI MERIDIAN backend (Express + MongoDB). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
