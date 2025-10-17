// types/taro.d.ts
import '@tarojs/cli'

declare module '@tarojs/cli' {
  interface IMiniAppConfig {
    /**
     * 分包配置
     */
    subPackages?: Array<{
      root: string
      pages: string[]
      independent?: boolean
    }>
    
    /**
     * 预加载规则
     */
    preloadRule?: Record<string, {
      network?: 'all' | 'wifi'
      packages?: string[]
    }>
  }
}