/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_URL: string;
  readonly VITE_NODE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
