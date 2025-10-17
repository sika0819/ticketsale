<template>
  <view class="mine-page">
    <!-- 用户信息 -->
    <view class="user-info">
      <image class="avatar" src="@/assets/images/avatar.png" mode="aspectFit" />
      <text class="username">用户名</text>
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
  </view>
</template>

<script>
import { defineComponent } from 'vue'
import Taro from '@tarojs/taro'

export default defineComponent({
  name: 'MinePage',
  setup() {
    const navigateTo = (url) => {
      Taro.navigateTo({ url })
    }

    return {
      navigateTo
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

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-right: 20px;
    }

    .username {
      font-size: 32px;
      color: #fff;
      font-weight: bold;
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
}
</style>