/**
 * 微信登录认证工具类
 */
import Taro from '@tarojs/taro'
import { getApiConfig, logApiConfig } from './apiConfig'
import { wechatLogin } from './wechatApi'

export interface WxUserInfo {
  id: number
  openid: string
  nickname: string
  avatar: string
  phone?: string
  ticket_count: number
  last_login?: string | null
}

export interface WxLoginResult {
  success: boolean
  user?: WxUserInfo
  token?: string
  message?: string
}

class WxAuthService {
  private readonly TOKEN_KEY = 'wx_token'
  private readonly USER_KEY = 'wx_user'
  private readonly LOGIN_EXPIRE_DAYS = 7

  /**
   * 检查本地登录状态
   */
  async checkLocalLogin(): Promise<WxUserInfo | null> {
    try {
      const token = Taro.getStorageSync(this.TOKEN_KEY)
      const userInfo = Taro.getStorageSync(this.USER_KEY)

      if (!token || !userInfo) {
        return null
      }

      // 检查是否过期
      if (userInfo.last_login) {
        const lastLogin = new Date(userInfo.last_login)
        const now = new Date()
        const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)

        if (daysDiff > this.LOGIN_EXPIRE_DAYS) {
          await this.clearLoginInfo()
          return null
        }
      }

      // 验证服务器端登录状态
      const isValid = await this.checkServerLogin(token)
      if (!isValid) {
        await this.clearLoginInfo()
        return null
      }

      return userInfo
    } catch (error) {
      console.error('检查本地登录状态失败:', error)
      return null
    }
  }

  /**
   * 检查服务器端登录状态
   */
  private async checkServerLogin(token: string): Promise<boolean> {
    try {
      const apiConfig = getApiConfig()
      const res = await Taro.request({
        url: `${apiConfig.baseUrl}/wechat/check`,
        method: 'POST',
        data: { token },
        header: {
          'Content-Type': 'application/json'
        }
      })

      return res.data?.success === true
    } catch (error) {
      console.error('验证服务器登录状态失败:', error)
      return false
    }
  }

  /**
   * 微信一键登录
   * 使用新的网络错误处理机制，专门解决6000100等系统错误
   */
  async wxLogin(): Promise<WxLoginResult> {
    try {
      console.log('🔐 开始微信登录流程...')
      logApiConfig() // 打印当前API配置用于调试

      // 1. 获取用户授权
      console.log('👤 获取用户授权信息...')
      const userProfileRes = await Taro.getUserProfile({
        desc: '用于完善会员资料'
      })

      const { nickName, avatarUrl } = userProfileRes.userInfo
      console.log('✅ 用户信息获取成功:', { nickName, avatarUrl: avatarUrl ? '已获取' : '未获取' })

      // 2. 获取登录凭证
      console.log('🔑 获取微信登录凭证...')
      const loginRes = await Taro.login()
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }
      console.log('✅ 登录凭证获取成功, code长度:', loginRes.code.length)

      // 3. 调用后端登录接口 (使用新的微信API工具)
      console.log('🌐 调用后端登录接口...')
      const loginResult = await wechatLogin({
        code: loginRes.code,
        nickname: nickName,
        avatar_url: avatarUrl
      })

      if (loginResult.success && loginResult.data) {
        const { user, token } = loginResult.data
        console.log('✅ 后端登录成功, 用户ID:', user.id)

        // 保存登录信息到本地存储
        await this.saveLoginInfo(user, token)

        return {
          success: true,
          user,
          token
        }
      } else {
        console.error('❌ 后端登录失败:', loginResult.message)

        // 特殊处理6000100错误
        if (loginResult.errorCode === '6000100') {
          return {
            success: false,
            message: '网络请求失败(6000100)：\n请检查域名配置或网络连接，\n或联系技术支持'
          }
        }

        return {
          success: false,
          message: loginResult.message || '登录失败，请重试'
        }
      }
    } catch (error: any) {
      console.error('❌ 微信登录异常:', error)

      // 特殊处理常见错误
      if (error.errMsg) {
        if (error.errMsg.includes('getUserProfile:fail')) {
          return {
            success: false,
            message: '用户取消授权，请重新尝试登录'
          }
        } else if (error.errMsg.includes('6000100')) {
          return {
            success: false,
            message: '系统错误(6000100)：请检查网络连接或重新启动小程序'
          }
        } else if (error.errMsg.includes('url not in domain list')) {
          return {
            success: false,
            message: '网络配置错误，请联系技术支持'
          }
        }
      }

      return {
        success: false,
        message: error.message || '登录失败，请重试'
      }
    }
  }

  /**
   * 获取微信手机号
   */
  async getWxPhoneNumber(e: any): Promise<{ success: boolean; phone?: string; message?: string }> {
    try {
      const { code } = e.detail
      if (!code) {
        return { success: false, message: '获取手机号授权失败' }
      }

      const token = Taro.getStorageSync(this.TOKEN_KEY)
      const userInfo = Taro.getStorageSync(this.USER_KEY)

      if (!token || !userInfo) {
        return { success: false, message: '请先登录' }
      }

      const apiConfig = getApiConfig()

      const res = await Taro.request({
        url: `${apiConfig.baseUrl}/wechat/phone`,
        method: 'POST',
        data: {
          code,
          openid: userInfo.openid
        },
        header: {
          'Content-Type': 'application/json'
        }
      })

      if (res.data?.success) {
        const { phone, user } = res.data

        // 更新本地用户信息
        await this.saveLoginInfo(user, token)

        return {
          success: true,
          phone
        }
      } else {
        return {
          success: false,
          message: res.data?.message || '获取手机号失败'
        }
      }
    } catch (error: any) {
      console.error('获取手机号失败:', error)
      return {
        success: false,
        message: error.message || '获取手机号失败，请重试'
      }
    }
  }

  /**
   * 保存登录信息
   */
  private async saveLoginInfo(user: WxUserInfo, token: string): Promise<void> {
    try {
      await Taro.setStorage({
        key: this.TOKEN_KEY,
        data: token
      })

      await Taro.setStorage({
        key: this.USER_KEY,
        data: user
      })
    } catch (error) {
      console.error('保存登录信息失败:', error)
    }
  }

  /**
   * 清除登录信息
   */
  async clearLoginInfo(): Promise<void> {
    try {
      await Taro.removeStorage({ key: this.TOKEN_KEY })
      await Taro.removeStorage({ key: this.USER_KEY })
    } catch (error) {
      console.error('清除登录信息失败:', error)
    }
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): WxUserInfo | null {
    try {
      return Taro.getStorageSync(this.USER_KEY) || null
    } catch (error) {
      console.error('获取当前用户信息失败:', error)
      return null
    }
  }

  /**
   * 获取当前token
   */
  getCurrentToken(): string | null {
    try {
      return Taro.getStorageSync(this.TOKEN_KEY) || null
    } catch (error) {
      console.error('获取当前token失败:', error)
      return null
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await this.clearLoginInfo()
  }
}

// 导出单例
export const wxAuthService = new WxAuthService()
export default wxAuthService