/**
 * API配置管理
 * 统一管理所有API请求的配置和域名
 */
import getConfig from '../../config/index'

// API配置类型定义
export interface ApiConfig {
  baseUrl: string
  timeout: number
  retryCount: number
  environment: 'development' | 'production'
}

// 环境配置
const ENV_CONFIG = {
  development: {
    baseUrl: 'http://127.0.0.1:5000/api',
    timeout: 15000, // 开发环境超时时间长一些，便于调试
    retryCount: 1,  // 开发环境重试次数少一些
    environment: 'development' as const
  },
  production: {
    baseUrl: 'https://test.3fenban.com/api',
    timeout: 10000,
    retryCount: 3,  // 生产环境多重试几次
    environment: 'production' as const
  }
}

// 获取当前环境
export const getCurrentEnvironment = (): 'development' | 'production' => {
  return process.env.NODE_ENV === 'development' ? 'development' : 'production'
}

// 获取API配置
export const getApiConfig = (): ApiConfig => {
  const env = getCurrentEnvironment()
  const config = getConfig()

  // 优先使用配置文件中的设置，fallback到环境默认配置
  return {
    baseUrl: config.apiBaseUrl || ENV_CONFIG[env].baseUrl,
    timeout: ENV_CONFIG[env].timeout,
    retryCount: ENV_CONFIG[env].retryCount,
    environment: env
  }
}

// 打印当前API配置（用于调试）
export const logApiConfig = () => {
  const config = getApiConfig()
  console.log('🌐 API配置信息:', {
    环境: config.environment,
    接口地址: config.baseUrl,
    超时时间: `${config.timeout}ms`,
    重试次数: config.retryCount
  })
}

// API端点配置
export const API_ENDPOINTS = {
  // 首页相关
  BANNERS: '/banners',
  CONCERTS: '/concerts',

  // 演唱会相关
  CONCERT_DETAIL: '/concert/detail',
  CONCERT_INDEX: '/concert/index',
  CONCERT_SESSIONS: '/concert/sessions',

  // 订单相关
  ORDER_CREATE: '/order/create',
  ORDER_STATUS: '/order/status',

  // 用户相关
  USER_INFO: '/user/info',
  USER_UPDATE: '/user/update',
  USER_AUTH: '/user/auth',

  // 支付相关
  WECHAT_PAY_UNIFIEDORDER: '/wechatpay/unifiedorder',

  // 票务相关
  TICKETS: '/tickets',
  TICKET_VERIFY: '/verify'
}

// 构建完整的API URL
export const buildApiUrl = (endpoint: string): string => {
  const config = getApiConfig()
  return `${config.baseUrl}${endpoint}`
}

// 验证域名是否在白名单中
export const isDomainWhitelisted = (url: string): boolean => {
  const env = getCurrentEnvironment()

  // 不同环境的域名白名单
  const whitelistedDomains = {
    development: [
      '127.0.0.1',
      'localhost',
      '192.168.',  // 局域网地址
      'test.3fenban.com',  // 开发环境也允许访问线上测试
    ],
    production: [
      'test.3fenban.com',
      'api.3fenban.com',
      'www.3fenban.com'
    ]
  }

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    return whitelistedDomains[env].some(domain =>
      hostname.includes(domain) || hostname === domain
    )
  } catch (error) {
    console.error('URL格式错误:', url, error)
    return false
  }
}