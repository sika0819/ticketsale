<template>
  <view class="concert-detail-page">
    <!-- 演唱会海报 -->
    <image :src="concert.poster" mode="widthFix" class="concert-poster" />

    <!-- 标题栏 -->
    <view class="title-section">
      <view class="title-main">
        <text class="location">{{ concert.location }}</text>
        <text class="separator">|</text>
        <text class="concert-name">{{ concert.name }}</text>
      </view>
      <view class="price">¥{{ concert.price }}</view>
    </view>

    <!-- 分割线 -->
    <view class="divider"></view>

    <!-- 日期信息 -->
    <view class="date-section">
      <view class="date-info">
        <text class="date-time">{{ concert.date }} {{ concert.time }}</text>
      </view>
    </view>
 <!-- 分割线 -->
    <view class="divider"></view>
    <!-- 场馆信息 -->
    <view class="venue-section">
      <view class="venue-info">
        <text class="venue-title">{{ concert.location }}|{{ concert.venue }}</text>
        <text class="venue-address">{{ concert.address }}</text>
      </view>
      <view class="navigation">
        <view class="navigation-content">
          <text class="arrow-icon">{{ arrowIcon }}</text>
          <!-- <text class="distance">{{ concert.distance }}</text> -->
        </view>
      </view>
    </view>

    <!-- 分割线 -->
    <view class="divider"></view>

    <!-- 服务标签 -->
    <view class="service-tags">
        服务
      <view class="tag-item" v-for="tag in concert.tags" :key="tag">
        {{ tag }}
      </view>
    </view>

    <!-- 分割线 -->
    <view class="divider"></view>

    <!-- 专辑介绍（异步组件加载） -->
    <view class="intro-section">
      <view class="section-title">专辑内容介绍</view>
      <ConcertIntro :text="concert.introduction" />
    </view>

    <!-- 底部购买栏 -->
    <view class="purchase-bar">
      <view class="ticket-info">
        <view class="ticket-count">
          <text class="count-text">剩余票数</text>
          <text class="count-number">{{ concert.remainingTickets }}/{{ concert.totalTickets }}</text>
        </view>
        <view class="progress-bar">
          <view class="progress" :style="{ width: ticketPercentage + '%' }"></view>
        </view>
      </view>
      <button class="buy-btn" @tap="goToTicketSelection">立即购买</button>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue'
import Taro from '@tarojs/taro'
import getConfig from '../../../config/index'

// 异步加载介绍组件
const ConcertIntro = defineAsyncComponent({
  loader: () => import('../../components/ConcertIntro.vue'),
  delay: 200,
  timeout: 10000,
  suspensible: false
})

export default {
  components: { ConcertIntro },
  setup() {
    const concert = ref({})
    // 使用emoji代替图片资源
    const arrowIcon = '➤' // 箭头图标
    const config = getConfig()
    // 计算剩余票数百分比
    const ticketPercentage = computed(() => {
      const remaining = concert.value.remainingTickets || 0
      const total = concert.value.totalTickets || 1
      return (remaining / total) * 100
    })

    // 后台获取演唱会详情
    const loadConcertData = async () => {
      try {
        // 首先检查网络状态
        const { checkNetworkStatus, safeRequest } = await import('../../utils/networkErrorHandler')
        
        const isNetworkAvailable = await checkNetworkStatus()
        if (!isNetworkAvailable) return

        // 假设通过id参数获取详情
        const id = Taro.getCurrentInstance().router?.params?.id
        const config = getConfig()
        console.log('请求演唱会详情接口:', `${config.apiBaseUrl}/concert/index`, { id })
        
        const res = await safeRequest({
          url: `${config.apiBaseUrl}/concert/index`, // 实际接口路径
          method: 'GET',
          data: { id }
        })
        console.log('演唱会详情接口返回:', res)
        concert.value = res.data || {}
      } catch (err) {
        console.error('演唱会数据加载失败:', err)
        // 错误已在 safeRequest 中处理
      }
    }

    onMounted(() => {
      loadConcertData()
    })

    // 直接购买支付流程
    const goToTicketSelection = async () => {
      try {
        // 显示支付确认弹窗
        const confirmResult = await new Promise((resolve) => {
          Taro.showModal({
            title: '确认购买',
            content: `确定要购买「${concert.value.name || '演唱会'}」门票吗？\n价格：¥${concert.value.price || 0}`,
            confirmText: '立即支付',
            cancelText: '取消',
            success: (res) => resolve(res.confirm)
          })
        })

        if (!confirmResult) return

        // 显示支付加载提示
        Taro.showLoading({
          title: '正在发起支付...',
          mask: true
        })

        // 获取或模拟用户openid（实际项目中应该从登录状态获取）
        let openid = Taro.getStorageSync('openid')
        if (!openid) {
          // 如果没有openid，可以先尝试获取微信登录信息
          try {
            const loginRes = await Taro.login()
            openid = loginRes.code // 临时使用code，实际应该通过后端换取openid
            console.log('获取到微信登录code:', openid)
          } catch (loginErr) {
            console.error('微信登录失败:', loginErr)
            Taro.hideLoading()
            Taro.showToast({ 
              title: '获取登录信息失败，请重试', 
              icon: 'none' 
            })
            return
          }
        }
        // 已登录，直接调用微信支付统一下单和支付
        const { checkNetworkStatus, safeRequest } = await import('../../utils/networkErrorHandler')
        
        const isNetworkAvailable = await checkNetworkStatus()
        if (!isNetworkAvailable) {
          Taro.hideLoading()
          return
        }

        // 调用微信支付统一下单
        const payRes = await safeRequest({
          url: `${config.apiBaseUrl}/wechatpay/unifiedorder`,
          method: 'POST',
          data: {
            description: concert.value.name || '演唱会门票',
            out_trade_no: `ORDER_${Date.now()}`, // 生成唯一订单号
            amount: concert.value.price || 100,
            openid,
            trade_type: 'JSAPI'
          }
        })
        
        Taro.hideLoading()
        
        const payData = payRes.data
        
        // 验证支付数据完整性
        if (!payData.timeStamp || !payData.nonceStr || !payData.package || !payData.paySign) {
          throw new Error('支付数据不完整')
        }

        // 调用微信支付
        await Taro.requestPayment({
          timeStamp: payData.timeStamp,
          nonceStr: payData.nonceStr,
          package: payData.package,
          signType: payData.signType || 'MD5',
          paySign: payData.paySign
        })

        // 支付成功
        Taro.showToast({ 
          title: '支付成功！', 
          icon: 'success',
          duration: 2000
        })

        // 可选：支付成功后跳转到订单页面或刷新票夹
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/orders/index' })
        }, 2000)

      } catch (err) {
        Taro.hideLoading()
        console.error('支付流程失败:', err)
        
        // 处理不同类型的支付错误
        let errorMsg = '支付失败，请重试'
        if (err.errMsg) {
          if (err.errMsg.includes('cancel')) {
            errorMsg = '支付已取消'
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '支付失败，请检查网络连接'
          } else if (err.errMsg.includes('timeout')) {
            errorMsg = '支付超时，请重试'
          }
        }
        
        Taro.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 2000
        })
      }
    }

    // 监听 concert 变化并打印具体参数
    watch(concert, (val) => {
      console.log('concert 详情参数:', val)
    }, { immediate: true, deep: true })

    return {
      concert,
      ticketPercentage,
      goToTicketSelection
    }
  }
}
</script>

<style lang="scss">
.concert-detail-page {
  background: #101528;
  min-height: 100vh;
  padding-bottom: 120rpx;
  color: #fff;

  .concert-poster {
    width: 100%;
    height: auto;
  }

  .title-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    background: rgba(255, 255, 255, 0.05);

    .title-main {
      display: flex;
      align-items: center;
      flex: 1;

      .location {
        font-size: 28rpx;
        color: #fff;
        font-weight: bold;
        margin-right: 10rpx;
      }

      .separator {
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.5);
        margin-right: 10rpx;
      }

      .concert-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #fff;
      }
    }

    .price {
      font-size: 36rpx;
      font-weight: bold;
      color: #4E37FD;
    }
  }

  .divider {
    height: 1rpx;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 30rpx;
  }

  .date-section {
    display: flex;
    align-items: center;
    padding: 30rpx;
    background: rgba(255, 255, 255, 0.05);

    .date-icon {
      font-size: 36rpx;
      margin-right: 20rpx;
    }

    .date-info {
      flex: 1;

      .date-label {
        display: block;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 8rpx;
      }

      .date-time {
        display: block;
        font-size: 28rpx;
        color: #fff;
        font-weight: bold;
      }
    }
  }

  .venue-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    background: rgba(255, 255, 255, 0.05);

    .venue-info {
      flex: 1;

      .venue-title {
        display: block;
        font-size: 28rpx;
        font-weight: bold;
        color: #fff;
        margin-bottom: 8rpx;
      }

      .venue-address {
        display: block;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .navigation {
       margin-left: 20rpx;
      .navigation-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 80rpx;
        .arrow-icon {
          font-size: 32rpx;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8rpx;
        }
      .distance {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.6);
        margin-right: 10rpx;
      }
      }
      
    }
  }

  .service-tags {
    display: flex;
    padding: 30rpx;
    background: rgba(255, 255, 255, 0.05);
    gap: 20rpx;

    .tag-item {
      padding: 12rpx 24rpx;
      background: rgba(78, 55, 253, 0.2);
      border: 1rpx solid #4E37FD;
      border-radius: 20rpx;
      font-size: 24rpx;
      color: #4E37FD;
    }
  }

  .intro-section {
    padding: 30rpx;
    background: rgba(255, 255, 255, 0.05);

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #fff;
      margin-bottom: 20rpx;
    }

    .intro-content {
      .intro-text {
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.6;
      }
    }
  }

  .purchase-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 120rpx;
    background: rgba(26, 31, 54, 0.95);
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);

    .ticket-info {
      flex: 1;
      margin-right: 20rpx;

      .ticket-count {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;

        .count-text {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.6);
        }

        .count-number {
          font-size: 24rpx;
          color: #4E37FD;
          font-weight: bold;
        }
      }

      .progress-bar {
        width: 100%;
        height: 6rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3rpx;
        overflow: hidden;

        .progress {
          height: 100%;
          background: #4E37FD;
          border-radius: 3rpx;
          transition: width 0.3s ease;
        }
      }
    }

    .buy-btn {
      width: 200rpx;
      height: 80rpx;
      line-height: 80rpx;
      background: #4E37FD;
      color: #fff;
      font-size: 28rpx;
      font-weight: bold;
      border-radius: 40rpx;
      border: none;
    }
  }
}
</style>