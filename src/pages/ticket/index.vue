<template>
  <view class="ticket-select-page">
    <!-- 演唱会信息 -->
    <view class="concert-info">
      <image :src="concert.imageUrl" mode="aspectFill" class="concert-image"/>
      <view class="concert-details">
        <text class="concert-name">演唱会：{{ concert.name }}</text>
        <text class="concert-artist">表演者：{{ concert.artist }}</text>
        <text class="concert-price">价格：¥{{ concert.price }}</text>
      </view>
    </view>

    <!-- 场次选择 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">选择场次</text>
      </view>
      <scroll-view class="session-list" scroll-x>
        <view 
          v-for="session in sessions" 
          :key="session.id"
          class="session-item"
          :class="{ 'selected': selectedSession === session.id }"
          @tap="selectSession(session.id)"
        >
          <text class="session-date">{{ formatDate(session.date) }}</text>
          <text class="session-time">{{ session.time }}</text>
          <text class="session-venue">{{ session.venue }}</text>
          <text class="session-status" :class="session.status">
            {{ session.status === 'available' ? '可售' : '售罄' }}
          </text>
        </view>
      </scroll-view>
    </view>

    <!-- 购买数量 -->
    <view class="section" v-if="selectedSession">
      <view class="section-header">
        <text class="section-title">购买数量</text>
        <text class="section-subtitle">每人限购4张</text>
      </view>
      <view class="quantity-selector">
        <view class="quantity-control">
          <text 
            class="quantity-btn minus" 
            :class="{ disabled: quantity <= 1 }"
            @tap="decreaseQuantity"
          >-</text>
          <input 
            class="quantity-input" 
            type="number" 
            v-model="quantity" 
            min="1" 
            max="4"
            @input="validateQuantity"
          />
          <text 
            class="quantity-btn plus" 
            :class="{ disabled: quantity >= 4 }"
            @tap="increaseQuantity"
          >+</text>
        </view>
        <view class="quantity-price">
          <text>单价：¥{{ concert.price }}</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">联系方式</text>
      </view>
      <view class="contact-input">
        <view class="phone-prefix">
          <text>+86</text>
        </view>
        <input 
          class="phone-input" 
          type="tel" 
          placeholder="请输入手机号码" 
          v-model="phoneNumber"
          maxlength="11"
        />
      </view>
    </view>

    <!-- 身份证号 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">身份证号</text>
      </view>
      <view class="idcard-input">
        <input 
          class="idcard-field" 
          type="text" 
          placeholder="请输入身份证号码" 
          v-model="idCard"
          maxlength="18"
        />
      </view>
    </view>

    <!-- 购票须知 -->
    <view class="notice-section">
      <view class="section-header">
        <text class="section-title">购票须知</text>
      </view>
      <view class="notice-content">
        <view class="notice-item" v-for="(item, index) in notices" :key="index">
          <text class="notice-index">{{ index + 1 }}.</text>
          <text class="notice-text">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 底部购买栏 -->
    <view class="purchase-bar">
      <view class="price-info">
        <text class="total-label">应付款：</text>
        <text class="total-price">¥{{ calculateTotalPrice() }}</text>
      </view>
      <button 
        class="purchase-btn" 
        :disabled="!canPurchase"
        @tap="handlePurchase"
      >
        立即购买
      </button>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import config from '../../../config/index'

export default {
  setup() {
    const concert = ref({})
    const sessions = ref([])
    const selectedSession = ref(null)
    const quantity = ref(1)
    const phoneNumber = ref('')
    const idCard = ref('') // 新增身份证号输入
    const notices = ref([
      '每人每次限购4张门票',
      '演出前3天不支持退换票',
      '门票不支持过期退换',
      '购票需实名认证，请确保信息准确',
      '演出当天请携带有效证件和电子票入场',
      '电子票将在支付成功后发送至手机',
      '如遇演出取消或改期，将另行通知'
    ])

    // 计算属性
    const canPurchase = computed(() => {
      return selectedSession.value && 
             quantity.value > 0 && 
             phoneNumber.value.length === 11 &&
             /^1[3-9]\d{9}$/.test(phoneNumber.value)
    })

    // 后台获取演唱会和场次数据
    const loadConcertData = async () => {
      try {
        const concertId = Taro.getCurrentInstance().router?.params?.concertId
        console.log('请求演唱会详情接口:', `${config.apiBaseUrl}/concert/detail`, { concertId })
        const concertRes = await Taro.request({
          url: `${config.apiBaseUrl}/concert/detail`,
          method: 'GET',
          data: { id: concertId }
        })
        console.log('演唱会详情接口返回:', concertRes)
        concert.value = concertRes.data || {}
        console.log('请求场次接口:', `${config.apiBaseUrl}/concert/sessions`, { concertId })
        const sessionsRes = await Taro.request({
          url: `${config.apiBaseUrl}/concert/sessions`,
          method: 'GET',
          data: { concertId }
        })
        console.log('场次接口返回:', sessionsRes)
        sessions.value = sessionsRes.data || []
      } catch (err) {
        Taro.showToast({ title: '演唱会数据加载失败', icon: 'none' })
      }
    }

    onMounted(() => {
      loadConcertData()
    })

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`
    }

    const selectSession = (sessionId) => {
      const session = sessions.value.find(s => s.id === sessionId)
      if (session && session.status === 'available') {
        selectedSession.value = sessionId
      }
    }

    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--
      }
    }

    const increaseQuantity = () => {
      if (quantity.value < 4) {
        quantity.value++
      }
    }

    const validateQuantity = () => {
      if (quantity.value < 1) quantity.value = 1
      if (quantity.value > 4) quantity.value = 4
    }

    const calculateTotalPrice = () => {
      return (concert.value.price * quantity.value).toFixed(2)
    }

    const handlePurchase = () => {
      if (!canPurchase.value) return
      const session = sessions.value.find(s => s.id === selectedSession.value)
      Taro.navigateTo({
        url: `/pages/order/create?concertId=${concert.value.id}&sessionId=${selectedSession.value}&quantity=${quantity.value}&phone=${phoneNumber.value}&idCard=${idCard.value}&totalPrice=${calculateTotalPrice()}`
      })
    }

    return {
      concert,
      sessions,
      selectedSession,
      quantity,
      phoneNumber,
      idCard,
      notices,
      canPurchase,
      formatDate,
      selectSession,
      decreaseQuantity,
      increaseQuantity,
      validateQuantity,
      calculateTotalPrice,
      handlePurchase
    }
  }
}
</script>

<style lang="scss">
.ticket-select-page {
  background: #101528;
  min-height: 100vh;
  padding-bottom: 120rpx;
  color: #fff;
  .concert-info {
    background: rgba(255, 255, 255, 0.05);
    padding: 30rpx;
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    border-radius: 8rpx;

    .concert-image {
      width: 120rpx;
      height: 120rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
    }

    .concert-details {
      flex: 1;

      .concert-name {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #fff;
        margin-bottom: 10rpx;
      }

      .concert-artist {
        display: block;
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 10rpx;
      }

      .concert-price {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #4E37FD;
      }
    }
  }

  .section {
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 20rpx;
    padding: 30rpx;
    border-radius: 8rpx;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;

      .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #fff;
      }

      .section-subtitle {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .session-list {
    white-space: nowrap;

    .session-item {
      display: inline-flex;
      flex-direction: column;
      padding: 20rpx;
      margin-right: 20rpx;
      border: 2rpx solid rgba(255, 255, 255, 0.2);
      border-radius: 8rpx;
      min-width: 200rpx;
      background: rgba(255, 255, 255, 0.05);

      &.selected {
        border-color: #4E37FD;
        background: rgba(78, 55, 253, 0.2);
      }

      .session-date {
        font-size: 28rpx;
        font-weight: bold;
        color: #fff;
        margin-bottom: 10rpx;
      }

      .session-time {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8rpx;
      }

      .session-venue {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 8rpx;
      }

      .session-status {
        font-size: 24rpx;
        font-weight: bold;

        &.available {
          color: #52c41a;
        }

        &.sold-out {
          color: rgba(255, 255, 255, 0.4);
        }
      }
    }
  }

  .quantity-selector {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .quantity-control {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 200rpx;

      .quantity-btn {
        width: 60rpx;
        height: 60rpx;
        border: 2rpx solid #4E37FD;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        font-weight: bold;
        color: #4E37FD;

        &.minus {
          background: rgba(255, 255, 255, 0.1);
        }

        &.plus {
          background: #4E37FD;
          color: #fff;
        }

        &.disabled {
          border-color: rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }
      }

      .quantity-input {
        width: 80rpx;
        height: 60rpx;
        margin: 0 20rpx;
        text-align: center;
        font-size: 32rpx;
        border: 2rpx solid rgba(255, 255, 255, 0.2);
        border-radius: 8rpx;
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
      }
    }

    .quantity-price {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .contact-input {
    display: flex;
    align-items: center;
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    border-radius: 8rpx;
    padding: 20rpx;
    background: rgba(255, 255, 255, 0.05);

    .phone-prefix {
      padding: 0 20rpx;
      font-size: 28rpx;
      color: #fff;
      border-right: 2rpx solid rgba(255, 255, 255, 0.2);
    }

    .phone-input {
      flex: 1;
      padding: 0 20rpx;
      font-size: 28rpx;
      height: 40rpx;
      color: #fff;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .idcard-input {
    display: flex;
    align-items: center;
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    border-radius: 8rpx;
    padding: 20rpx;
    background: rgba(255, 255, 255, 0.05);
    margin-top: 20rpx;

    .idcard-field {
      flex: 1;
      padding: 0 20rpx;
      font-size: 28rpx;
      height: 40rpx;
      color: #fff;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .notice-section {
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 20rpx;
    padding: 30rpx;
    border-radius: 8rpx;

    .notice-content {
      .notice-item {
        display: flex;
        margin-bottom: 15rpx;

        .notice-index {
          font-size: 26rpx;
          color: #4E37FD;
          margin-right: 10rpx;
          min-width: 30rpx;
        }

        .notice-text {
          font-size: 26rpx;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
        }
      }
    }
  }

  .purchase-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100rpx;
    background: rgba(26, 31, 54, 0.95);
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);

    .price-info {
      flex: 1;

      .total-label {
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.8);
      }

      .total-price {
        font-size: 36rpx;
        font-weight: bold;
        color: #4E37FD;
      }
    }

    .purchase-btn {
      width: 240rpx;
      height: 80rpx;
      line-height: 80rpx;
      background: #4E37FD;
      color: #fff;
      font-size: 28rpx;
      border-radius: 40rpx;
      text-align: center;
      border: none;

      &[disabled] {
        background: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }
}
</style>