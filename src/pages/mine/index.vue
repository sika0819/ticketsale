<template>
  <view class="mine-page">
    <!-- 用户信息 -->
    <view class="user-info">
      <image class="avatar" :src="userInfo.avatar || '@/assets/images/avatar.png'" mode="aspectFit" />
      <text class="username">{{ userInfo.username || '未登录' }}</text>
      <text class="phone" v-if="userInfo.phone">手机号：{{ userInfo.phone }}</text>
      <button class="login-btn" open-type="getUserInfo" @tap="handleWxLogin" v-if="!userInfo.username">微信登录</button>
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

      }
    }
    // 微信登录并获取openid、头像、昵称，连接后台创建/更新用户
    const handleWxLogin = async () => {
      try {
        // 一键获取微信用户信息
        const userProfileRes = await Taro.getUserProfile({ desc: '用于完善会员资料' })
        const { nickName, avatarUrl } = userProfileRes.userInfo
        // 获取 code
        const loginRes = await Taro.login()
        const code = loginRes.code
        if (!code) throw new Error('获取code失败')
        // 可选：获取手机号（如需）
        let phone = ''
        // 组装用户信息并同步到后端
        const userPayload = {
          code,
          username: nickName,
          avatar: avatarUrl,
          phone
        }
        userInfo.value = userPayload
        await Taro.request({
          url: `${config.apiBaseUrl}/user/update`,
          method: 'POST',
          data: userPayload
        })
        Taro.showToast({ title: '登录成功', icon: 'success' })
      } catch (err) {
        Taro.showToast(err.message || '微信登录失败', 'none')
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
      try {
        // 获取微信 code
        const loginRes = await Taro.login()
        const code = loginRes.code
        if (!code) throw new Error('获取code失败')
        // 提交实名信息和 code 到后端
        authInfo.value = { name: authName.value, idCard: authIdCard.value }
        showModal.value = false
        await Taro.request({
          url: `${config.apiBaseUrl}/user/auth`,
          method: 'POST',
          data: {
            code,
            name: authName.value,
            idCard: authIdCard.value
          }
        })
        Taro.showToast({ title: '认证信息已提交', icon: 'success' })
      } catch (err) {
        Taro.showToast({ title: '实名认证异常', icon: 'none' })
      }
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