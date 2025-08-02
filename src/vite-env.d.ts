/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // más variables de entorno que puedas necesitar
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}