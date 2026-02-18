/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): Promise<void>
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>
  export default component
}

