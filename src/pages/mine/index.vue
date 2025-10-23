<template>
  <view class="mine-page">
    <!-- 用户信息 -->
    <view class="user-info">
      <view class="avatar" v-if="!userInfo.avatar">👤</view>
      <image v-else class="avatar" :src="userInfo.avatar" mode="aspectFit" />
      <text class="username">{{ userInfo.nickname || '未登录' }}</text>
      <text class="phone" v-if="userInfo.phone">手机号：{{ userInfo.phone }}</text>
      <text class="ticket-count" v-if="userInfo.nickname">已购票数：{{ userInfo.ticket_count || 0 }}</text>
      
      <!-- 开发环境显示API配置信息 -->
      <view class="env-info" v-if="showEnvInfo">
        <text class="env-tag">{{ envInfo.environment === 'development' ? '开发环境' : '生产环境' }}</text>
        <text class="api-url">{{ envInfo.baseUrl }}</text>
      </view>
      
      <!-- 未登录状态 -->
      <button 
        class="login-btn" 
        @tap="handleWxLogin" 
        v-if="!userInfo.nickname"
      >
        微信一键登录
      </button>
      
      <!-- 已登录但未绑定手机号 -->
      <button 
        class="phone-btn" 
        open-type="getPhoneNumber"
        @getphonenumber="handleGetPhoneNumber"
        v-if="userInfo.nickname && !userInfo.phone"
      >
        获取手机号
      </button>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-list" v-if="userInfo.nickname">
      <view class="menu-item" @tap="navigateTo('/pages/orders/index')">
        <text class="menu-text">我的订单</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="navigateTo('/pages/ticket/index')">
        <text class="menu-text">我的门票</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="showAuthModal">
        <text class="menu-text">实名认证</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="handleLogout">
        <text class="menu-text">退出登录</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- 实名认证弹窗 -->
    <view class="modal-mask" v-if="showModal" @tap="closeAuthModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">实名认证</text>
        <input 
          class="modal-input" 
          v-model="authName" 
          placeholder="请输入真实姓名"
          placeholder-class="input-placeholder"
        />
        <input 
          class="modal-input" 
          v-model="authIdCard" 
          placeholder="请输入身份证号"
          placeholder-class="input-placeholder"
        />
        <button class="modal-btn" @tap="submitAuth">提交认证</button>
        <button class="modal-btn cancel" @tap="closeAuthModal">取消</button>
      </view>
    </view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'
import { defineComponent, onMounted, ref } from 'vue'
import { getApiConfig, getCurrentEnvironment } from '../../utils/apiConfig'
import wxAuthService from '../../utils/wxAuth'

export default defineComponent({
  name: 'MinePage',
  setup() {
    const userInfo = ref({
      id: 0,
      openid: '',
      nickname: '',
      avatar: '',
      phone: '',
      ticket_count: 0
    })
    
    const showModal = ref(false)
    const authName = ref('')
    const authIdCard = ref('')
    const loading = ref(false)
    
    // 环境信息
    const showEnvInfo = ref(false)
    const envInfo = ref({
      environment: 'production',
      baseUrl: ''
    })

    const navigateTo = (url) => {
      Taro.navigateTo({ url })
    }

    /**
     * 检查并加载用户登录状态
     */
    const loadUserInfo = async () => {
      try {
        loading.value = true
        
        // 初始化环境信息
        const apiConfig = getApiConfig()
        const currentEnv = getCurrentEnvironment()
        
        envInfo.value = {
          environment: currentEnv,
          baseUrl: apiConfig.baseUrl
        }
        
        // 开发环境显示环境信息，生产环境隐藏
        showEnvInfo.value = currentEnv === 'development'
        
        console.log('🌐 当前环境配置:', {
          环境: currentEnv,
          API地址: apiConfig.baseUrl,
          超时时间: apiConfig.timeout + 'ms'
        })
        
        // 首先检查本地缓存的登录状态
        const cachedUser = await wxAuthService.checkLocalLogin()
        
        if (cachedUser) {
          userInfo.value = cachedUser
          console.log('从缓存加载用户信息:', cachedUser)
        } else {
          console.log('未找到有效的登录缓存')
          // 清空用户信息
          userInfo.value = {
            id: 0,
            openid: '',
            nickname: '',
            avatar: '',
            phone: '',
            ticket_count: 0
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
      } finally {
        loading.value = false
      }
    }

    /**
     * 微信一键登录
     */
    const handleWxLogin = async () => {
      try {
        loading.value = true
        
        Taro.showLoading({
          title: '登录中...'
        })

        const result = await wxAuthService.wxLogin()
        
        if (result.success && result.user) {
          userInfo.value = result.user
          Taro.showToast({
            title: '登录成功',
            icon: 'success'
          })
        } else {
          Taro.showToast({
            title: result.message || '登录失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('微信登录失败:', error)
        Taro.showToast({
          title: error.message || '登录失败，请重试',
          icon: 'none'
        })
      } finally {
        loading.value = false
        Taro.hideLoading()
      }
    }

    /**
     * 获取微信手机号
     */
    const handleGetPhoneNumber = async (e) => {
      try {
        console.log('获取手机号回调:', e)
        
        if (e.detail.errMsg !== 'getPhoneNumber:ok') {
          Taro.showToast({
            title: '获取手机号失败',
            icon: 'none'
          })
          return
        }

        Taro.showLoading({
          title: '获取手机号中...'
        })

        const result = await wxAuthService.getWxPhoneNumber(e)
        
        if (result.success && result.phone) {
          // 更新用户信息
          userInfo.value.phone = result.phone
          
          Taro.showToast({
            title: '手机号获取成功',
            icon: 'success'
          })
        } else {
          Taro.showToast({
            title: result.message || '获取手机号失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取手机号失败:', error)
        Taro.showToast({
          title: error.message || '获取手机号失败，请重试',
          icon: 'none'
        })
      } finally {
        Taro.hideLoading()
      }
    }

    /**
     * 退出登录
     */
    const handleLogout = async () => {
      try {
        await Taro.showModal({
          title: '提示',
          content: '确定要退出登录吗？'
        })

        await wxAuthService.logout()
        
        // 清空用户信息
        userInfo.value = {
          id: 0,
          openid: '',
          nickname: '',
          avatar: '',
          phone: '',
          ticket_count: 0
        }

        Taro.showToast({
          title: '已退出登录',
          icon: 'success'
        })
      } catch (error) {
        // 用户取消了退出操作
        console.log('用户取消退出登录')
      }
    }

    /**
     * 显示实名认证弹窗
     */
    const showAuthModalFunc = () => {
      showModal.value = true
    }

    /**
     * 关闭实名认证弹窗
     */
    const closeAuthModal = () => {
      showModal.value = false
      authName.value = ''
      authIdCard.value = ''
    }

    /**
     * 提交实名认证
     */
    const submitAuth = async () => {
      if (!authName.value.trim() || !authIdCard.value.trim()) {
        Taro.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }

      try {
        Taro.showLoading({
          title: '提交中...'
        })

        // 这里可以调用实名认证API
        // 暂时只是保存到本地或显示成功
        
        closeAuthModal()
        
        Taro.showToast({
          title: '认证信息已提交',
          icon: 'success'
        })
      } catch (error) {
        console.error('实名认证失败:', error)
        Taro.showToast({
          title: '实名认证失败，请重试',
          icon: 'none'
        })
      } finally {
        Taro.hideLoading()
      }
    }

    // 页面加载时检查登录状态
    onMounted(() => {
      loadUserInfo()
    })

    return {
      userInfo,
      showModal,
      authName,
      authIdCard,
      loading,
      showEnvInfo,
      envInfo,
      navigateTo,
      handleWxLogin,
      handleGetPhoneNumber,
      handleLogout,
      showAuthModal: showAuthModalFunc,
      closeAuthModal,
      submitAuth
    }
  }
})
</script>

<style lang="scss">
.mine-page {
  background: #101528;
  min-height: 100vh;
  padding-bottom: 120px;
  .user-info {
    padding: 40px 30px;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    flex-direction: column;
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      font-size: 40px;
    }
    .username {
      font-size: 32px;
      color: #fff;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .phone {
      font-size: 24px;
      color: #fff;
      margin-bottom: 10px;
    }
    .ticket-count {
      font-size: 24px;
      color: #fff;
      margin-bottom: 10px;
    }
    .login-btn, .phone-btn {
      margin-top: 10px;
      background: #4e37fd;
      color: #fff;
      border-radius: 8px;
      padding: 10px 30px;
      font-size: 28px;
      border: none;
    }
    .phone-btn {
      background: #07c160;
      margin-left: 10px;
    }
    
    .env-info {
      margin-top: 15px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      
      .env-tag {
        display: block;
        font-size: 20px;
        color: #4ade80;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .api-url {
        display: block;
        font-size: 18px;
        color: #94a3b8;
        word-break: break-all;
      }
    }
  }
  .auth-section {
    margin: 30px 30px 0 30px;
    .auth-btn {
      background: #4e37fd;
      color: #fff;
      border-radius: 8px;
      padding: 10px 30px;
      font-size: 28px;
      margin-bottom: 10px;
    }
  }
  .menu-list {
    padding: 0 30px;
    margin-top: 30px;
    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      .menu-text {
        font-size: 28px;
        color: #fff;
      }
      .menu-arrow {
        font-size: 28px;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
  .modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    .modal-content {
      background: #fff;
      border-radius: 12px;
      padding: 40px 30px;
      width: 80vw;
      .modal-title {
        font-size: 32px;
        color: #333;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .modal-input {
        width: 100%;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        font-size: 28px;
        margin-bottom: 20px;
      }
      .modal-btn {
        width: 100%;
        background: #4e37fd;
        color: #fff;
        border-radius: 8px;
        padding: 10px 0;
        font-size: 28px;
        margin-bottom: 10px;
        &.cancel {
          background: #eee;
          color: #333;
        }
      }
    }
  }
}
</style>