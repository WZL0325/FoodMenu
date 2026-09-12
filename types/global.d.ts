/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
  readonly VITE_WEIXIN_CLOUD_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface WeixinCloudCallFunctionOptions {
  name: string
  data?: Record<string, unknown>
}

interface WeixinCloudApi {
  init(options?: { env?: string, traceUser?: boolean }): void
  callFunction(options: WeixinCloudCallFunctionOptions): Promise<unknown>
}

declare const wx: {
  cloud?: WeixinCloudApi
}
