/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_WEBHOOK_URL: string
  readonly VITE_LINKEDIN_CLIENT_ID: string
  readonly VITE_WP_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'heic2any';
