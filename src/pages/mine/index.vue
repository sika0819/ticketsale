<template>
  <view class="mine-page">
    <!-- 用户信息 -->
    <view class="user-info">
      <image class="avatar" :src="userInfo.avatar || '@/assets/images/avatar.png'" mode="aspectFit" />
      <text class="username">{{ userInfo.username || '未登录' }}</text>
      <text class="phone" v-if="userInfo.phone">手机号：{{ userInfo.phone }}</text>
      <button class="login-btn" open-type="getUserInfo" @tap="handleWxLogin" v-if="!userInfo.username">微信登录</button>
    </view>

    <!-- 实名认证 -->
    <view class="auth-section">
      <button class="auth-btn" @tap="showAuthModal">实名认证</button>
      <view v-if="authInfo.name">
        <text>已认证：{{ authInfo.name }} {{ authInfo.idCard }}</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-list">
      <view class="menu-item" @tap="navigateTo('/pages/settings/index')">
        <text class="menu-text">设置</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="navigateTo('/pages/about/index')">
        <text class="menu-text">关于我们</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- 实名认证弹窗 -->
    <view v-if="showModal" class="modal-mask">
      <view class="modal-content">
        <text class="modal-title">实名认证</text>
        <input class="modal-input" v-model="authName" placeholder="请输入姓名" />
        <input class="modal-input" v-model="authIdCard" placeholder="请输入身份证号" />
        <button class="modal-btn" @tap="submitAuth">提交认证</button>
        <button class="modal-btn cancel" @tap="closeAuthModal">取消</button>
      </view>
    </view>
  </view>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import config from '../../../config/index'

export default defineComponent({
  name: 'MinePage',
  setup() {
    const userInfo = ref({ username: '', avatar: '', phone: '' })
    const authInfo = ref({ name: '', idCard: '' })
    const showModal = ref(false)
    const authName = ref('')
    const authIdCard = ref('')

    const navigateTo = (url) => {
      Taro.navigateTo({ url })
    }
    const loadUserInfo = async () => {
      try {
        console.log('请求用户信息接口:', `${config.apiBaseUrl}/user/info`)
        const res = await Taro.request({
          url: `${config.apiBaseUrl}/user/info`,
          method: 'GET'
        })
        console.log('用户信息接口返回:', res)
        userInfo.value = res.data || { username: '', avatar: '', phone: '' }
      } catch (err) {
        Taro.showToast({ title: '用户信息加载失败', icon: 'none' })
      }
    }
    // 微信登录并获取openid、头像、昵称，连接后台创建/更新用户
    const handleWxLogin = async () => {
      try {
        // 1. 微信登录获取 code
        const loginRes = await Taro.login()
        const code = loginRes.code
        if (!code) throw new Error('获取code失败')

        // 2. 获取微信用户信息
        const userRes = await Taro.getUserInfo()
        const { nickName, avatarUrl } = userRes.userInfo

        // 3. 请求后端换取 openid（假设有 /user/wxlogin 接口，返回 { openid }）
        const openidRes = await Taro.request({
          url: `${config.apiBaseUrl}/user/wxlogin`,
          method: 'POST',
          data: { code }
        })
        const openid = openidRes.data?.openid
        if (!openid) throw new Error('获取openid失败')

        // 4. 可选：获取手机号（如需）
        let phone = ''
        try {
          const phoneRes = await Taro.getPhoneNumber()
          phone = phoneRes?.phoneNumber || ''
        } catch {}

        // 5. 组装用户信息并同步到后端
        const userPayload = {
          openid,
          username: nickName,
          avatar: avatarUrl,
          phone
        }
        userInfo.value = userPayload
        console.log('请求用户更新接口:', `${config.apiBaseUrl}/user/update`, userPayload)
        await Taro.request({
          url: `${config.apiBaseUrl}/user/update`,
          method: 'POST',
          data: userPayload
        })
        console.log('用户更新接口已请求')
      } catch (err) {
        Taro.showToast({ title: '微信登录失败', icon: 'none' })
      }
    }
    // 实名认证弹窗
    const showAuthModal = () => {
      showModal.value = true
    }
    const closeAuthModal = () => {
      showModal.value = false
      authName.value = ''
      authIdCard.value = ''
    }
    const submitAuth = async () => {
      if (!authName.value || !authIdCard.value) {
        Taro.showToast({ title: '请填写完整信息', icon: 'none' })
        return
      }
      // 可选：校验身份证号格式
      authInfo.value = { name: authName.value, idCard: authIdCard.value }
      showModal.value = false
      // 可选：同步到后端
      console.log('请求实名认证接口:', `${config.apiBaseUrl}/user/auth`, authInfo.value)
      await Taro.request({
        url: `${config.apiBaseUrl}/user/auth`,
        method: 'POST',
        data: authInfo.value
      })
      console.log('实名认证接口已请求')
      Taro.showToast({ title: '认证成功', icon: 'success' })
    }
    onMounted(() => {
      loadUserInfo()
    })
    return {
      userInfo,
      authInfo,
      showModal,
      authName,
      authIdCard,
      navigateTo,
      handleWxLogin,
      showAuthModal,
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
    .login-btn {
      margin-top: 10px;
      background: #4e37fd;
      color: #fff;
      border-radius: 8px;
      padding: 10px 30px;
      font-size: 28px;
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