/**
 * 网络请求错误处理工具
 * 专门处理微信小程序网络请求错误，包括6000100等系统错误
 */
import Taro from '@tarojs/taro'
import { getApiConfig, isDomainWhitelisted } from './apiConfig'

// 错误码映射
const ERROR_CODE_MAP = {
  6000100: '系统错误：网络请求失败，请检查网络连接',
  6000101: '系统错误：请求超时，请重试',
  6000102: '系统错误：网络中断，请检查网络设置',
  6000103: '系统错误：SSL证书验证失败',
  6000104: '系统错误：域名解析失败',
  6000105: '系统错误：请求被拦截',
  // HTTP状态码错误
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '禁止访问',
  404: '请求的资源不存在',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时'
}

// 网络请求错误处理函数
export const handleNetworkError = (error: any, context?: string): void => {
  console.error(`网络请求错误 [${context || '未知'}]:`, error)
  
  let errorMessage = '网络请求失败，请重试'
  
  // 处理微信小程序系统错误码
  if (error.errno && ERROR_CODE_MAP[error.errno as keyof typeof ERROR_CODE_MAP]) {
    errorMessage = ERROR_CODE_MAP[error.errno as keyof typeof ERROR_CODE_MAP]
  }
  // 处理HTTP状态码
  else if (error.statusCode && ERROR_CODE_MAP[error.statusCode as keyof typeof ERROR_CODE_MAP]) {
    errorMessage = ERROR_CODE_MAP[error.statusCode as keyof typeof ERROR_CODE_MAP]
  }
  // 处理Taro.request的错误格式
  else if (error.errMsg) {
    if (error.errMsg.includes('6000100')) {
      errorMessage = '系统错误：网络请求失败，请检查域名配置和网络连接'
    } else if (error.errMsg.includes('url not in domain list')) {
      errorMessage = '域名未在小程序管理后台配置，请联系管理员'
    } else if (error.errMsg.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接后重试'
    }
  }
  
  // 显示错误提示
  Taro.showToast({
    title: errorMessage,
    icon: 'none',
    duration: 3000
  })
}

// 安全的网络请求封装（带重试机制）
export const safeRequest = async (options: Taro.request.Option, customRetryCount?: number): Promise<any> => {
  let lastError: any
  const config = getApiConfig()
  const retryCount = customRetryCount ?? config.retryCount
  
  // 验证域名是否在白名单中
  if (options.url && !isDomainWhitelisted(options.url)) {
    const error = new Error(`域名未在白名单中: ${options.url}`)
    handleNetworkError(error, options.url)
    throw error
  }
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // 记录请求日志
      logNetworkActivity('REQUEST', {
        url: options.url,
        method: options.method,
        data: options.data,
        attempt: attempt + 1
      })
      
      const response = await Taro.request({
        ...options,
        timeout: config.timeout
      })
      
      // 记录成功响应日志
      logNetworkActivity('RESPONSE', {
        url: options.url,
        statusCode: response.statusCode,
        dataSize: JSON.stringify(response.data).length
      })
      
      return response
      
    } catch (error) {
      lastError = error
      
      // 记录错误日志
      logNetworkActivity('ERROR', {
        url: options.url,
        attempt: attempt + 1,
        error: {
          errMsg: error.errMsg,
          statusCode: error.statusCode,
          errno: error.errno
        }
      })
      
      // 如果是最后一次尝试，或者是不可重试的错误，直接抛出
      if (attempt === retryCount || isNonRetryableError(error)) {
        handleNetworkError(error, options.url)
        throw error
      }
      
      // 等待一段时间后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  handleNetworkError(lastError, options.url)
  throw lastError
}

// 判断是否为不可重试的错误
const isNonRetryableError = (error: any): boolean => {
  // 401/403 等认证相关错误不重试
  if (error.statusCode === 401 || error.statusCode === 403) {
    return true
  }
  
  // 400 参数错误不重试
  if (error.statusCode === 400) {
    return true
  }
  
  // 域名配置错误不重试
  if (error.errMsg && error.errMsg.includes('url not in domain list')) {
    return true
  }
  
  return false
}

// 检查网络状态
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const networkInfo = await Taro.getNetworkType()
    
    if (networkInfo.networkType === 'none') {
      Taro.showToast({
        title: '网络连接不可用，请检查网络设置',
        icon: 'none',
        duration: 3000
      })
      return false
    }
    
    console.log('网络状态:', networkInfo.networkType)
    return true
    
  } catch (error) {
    console.error('检查网络状态失败:', error)
    return false
  }
}

// 增强的日志记录功能
export const logNetworkActivity = (type: 'REQUEST' | 'RESPONSE' | 'ERROR', data: any): void => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    type,
    data
  }
  
  // 在开发环境下详细记录
  if (process.env.NODE_ENV === 'development') {
    console.log(`[NETWORK ${type}] ${timestamp}:`, data)
  }
  
  // 可以在这里添加将日志发送到服务器的逻辑
  // 或存储到本地缓存用于调试
  try {
    const existingLogs = Taro.getStorageSync('networkLogs') || []
    const updatedLogs = [...existingLogs.slice(-99), logEntry] // 保留最近100条日志
    Taro.setStorageSync('networkLogs', updatedLogs)
  } catch (error) {
    console.warn('保存网络日志失败:', error)
  }
}

// 获取网络日志（用于调试）
export const getNetworkLogs = (): any[] => {
  try {
    return Taro.getStorageSync('networkLogs') || []
  } catch (error) {
    console.warn('获取网络日志失败:', error)
    return []
  }
}

// 清除网络日志
export const clearNetworkLogs = (): void => {
  try {
    Taro.removeStorageSync('networkLogs')
  } catch (error) {
    console.warn('清除网络日志失败:', error)
  }
}