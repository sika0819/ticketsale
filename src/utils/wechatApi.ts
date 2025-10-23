/**
 * 微信API请求工具
 * 专门处理微信小程序API请求和6000100等系统错误
 */
import Taro from '@tarojs/taro'
import { getApiConfig } from './apiConfig'
import { handleNetworkError } from './networkErrorHandler'

// 微信API响应类型
export interface WeChatApiResponse<T = any> {
    success: boolean
    data?: T
    message?: string
    errorCode?: string | number
}

// 微信登录请求参数
export interface WeChatLoginParams {
    code: string
    nickname?: string
    avatar_url?: string
}

// 微信登录响应数据
export interface WeChatLoginData {
    user: {
        id: number
        openid: string
        nickname: string
        avatar: string
        phone?: string
        ticket_count: number
        last_login: string | null
    }
    token: string
}

/**
 * 安全的微信API请求封装
 * 专门处理6000100等微信系统错误
 */
export const wechatApiRequest = async <T = any>(
    endpoint: string,
    options: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
        data?: any
        header?: Record<string, string>
        timeout?: number
    } = {}
): Promise<WeChatApiResponse<T>> => {
    try {
        // 检查网络状态
        try {
            const networkInfo = await Taro.getNetworkType()
            if (networkInfo.networkType === 'none') {
                throw new Error('网络未连接，请检查网络设置')
            }
        } catch (networkError) {
            console.warn('网络状态检查失败，继续请求:', networkError)
        } const config = getApiConfig()
        const url = `${config.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

        console.log(`🌐 微信API请求: ${options.method || 'GET'} ${url}`)
        console.log(`📤 请求数据:`, options.data)

        const requestOptions: Taro.request.Option = {
            url,
            method: (options.method || 'GET') as any,
            data: options.data,
            header: {
                'Content-Type': 'application/json',
                ...options.header
            },
            timeout: options.timeout || config.timeout,
            // 关键：设置dataType为json确保正确解析响应
            dataType: 'json',
            responseType: 'text'
        }

        const response = await Taro.request(requestOptions)

        console.log(`📥 微信API响应:`, {
            statusCode: response.statusCode,
            data: response.data
        })

        // 检查HTTP状态码
        if (response.statusCode !== 200) {
            throw new Error(`HTTP ${response.statusCode}: ${getHttpStatusMessage(response.statusCode)}`)
        }

        // 检查业务响应
        const responseData = response.data as any
        if (responseData && typeof responseData === 'object') {
            if (responseData.success === false) {
                // 业务层面的失败
                return {
                    success: false,
                    message: responseData.message || '请求失败',
                    errorCode: responseData.error_code || responseData.errorCode
                }
            } else {
                // 成功响应
                return {
                    success: true,
                    data: responseData.success !== undefined ? responseData : response.data
                }
            }
        }

        // 直接返回数据
        return {
            success: true,
            data: response.data
        }

    } catch (error: any) {
        console.error('🚫 微信API请求失败:', error)

        // 特殊处理6000100错误
        if (error.errMsg && error.errMsg.includes('6000100')) {
            const errorMessage = '系统错误(6000100)：请检查以下设置：\n1. 域名是否已在小程序管理后台配置\n2. 网络连接是否正常\n3. 开发工具是否开启了域名校验'

            Taro.showModal({
                title: '网络请求失败',
                content: errorMessage,
                showCancel: false,
                confirmText: '我知道了'
            })

            return {
                success: false,
                message: errorMessage,
                errorCode: '6000100'
            }
        }

        // 处理其他网络错误
        handleNetworkError(error, endpoint)

        return {
            success: false,
            message: error.message || '网络请求失败',
            errorCode: error.errno || error.statusCode
        }
    }
}

/**
 * 微信登录API
 */
export const wechatLogin = async (params: WeChatLoginParams): Promise<WeChatApiResponse<WeChatLoginData>> => {
    return wechatApiRequest<WeChatLoginData>('/wechat/login', {
        method: 'POST',
        data: params
    })
}

/**
 * 检查微信登录状态API
 */
export const checkWechatLoginStatus = async (openid: string): Promise<WeChatApiResponse> => {
    return wechatApiRequest('/wechat/check-login', {
        method: 'POST',
        data: { openid }
    })
}

/**
 * 获取HTTP状态码对应的错误信息
 */
const getHttpStatusMessage = (statusCode: number): string => {
    const statusMessages: Record<number, string> = {
        400: '请求参数错误',
        401: '未授权访问',
        403: '禁止访问',
        404: '请求的资源不存在',
        500: '服务器内部错误',
        502: '网关错误',
        503: '服务不可用',
        504: '请求超时'
    }

    return statusMessages[statusCode] || `HTTP错误: ${statusCode}`
}

/**
 * 微信小程序专用的网络状态检查
 */
export const checkWeChatNetworkStatus = async (): Promise<{
    isConnected: boolean
    networkType: string
    signalStrength?: number
}> => {
    try {
        const networkInfo = await Taro.getNetworkType()
        return {
            isConnected: networkInfo.networkType !== 'none',
            networkType: networkInfo.networkType,
            signalStrength: (networkInfo as any).signalStrength
        }
    } catch (error) {
        console.warn('获取网络状态失败:', error)
        return {
            isConnected: true, // 默认认为已连接
            networkType: 'unknown'
        }
    }
}

export default {
    wechatApiRequest,
    wechatLogin,
    checkWechatLoginStatus,
    checkWeChatNetworkStatus
}