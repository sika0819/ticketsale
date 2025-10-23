<template>
  <view class="tickets-page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-title">我的票夹</text>
      <text class="page-subtitle">共 {{ filteredTickets.length }} 张票</text>
    </view>

    <!-- 顶部Tab切换 -->
    <view class="tab-container">
      <scroll-view class="tab-scroll" scroll-x>
        <view class="tab-list">
          <view 
            v-for="tab in tabs" 
            :key="tab.key"
            class="tab-item" 
            :class="{ active: activeTab === tab.key }"
            @tap="switchTab(tab.key)"
          >
            <text class="tab-text">{{ tab.label }}</text>
            <text class="tab-count" v-if="getTabCount(tab.key) > 0">
              {{ getTabCount(tab.key) }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 票夹列表 -->
    <scroll-view class="tickets-list" scroll-y>
      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredTickets.length === 0">
        <view class="empty-image-placeholder">📄</view>
        <text class="empty-text">{{ getEmptyText() }}</text>
        <text class="empty-subtext">{{ getEmptySubtext() }}</text>
        <button class="buy-btn" @tap="goToHome" v-if="activeTab === 'all'">去购票</button>
      </view>

      <!-- 票列表 -->
  <view class="ticket-item" v-for="ticket in filteredTickets" :key="ticket.id" @tap="viewTicketDetail(ticket)">
        <!-- 票状态标签 -->
        <view class="ticket-status" :class="getStatusClass(ticket.status)">
          {{ getStatusText(ticket.status) }}
        </view>

  <!-- 票信息 -->
        <view class="ticket-content">
          <image :src="ticket.concertImage" class="concert-image" mode="aspectFill" />
          <view class="ticket-info">
            <text class="concert-name">{{ ticket.concertName }}</text>
            <text class="concert-date">{{ ticket.date }} {{ ticket.time }}</text>
            <text class="concert-venue">{{ ticket.venue }}</text>
            <text class="seat-info">座位：{{ ticket.seatArea }} {{ ticket.seatNumber }}</text>
            <text class="ticket-price">¥{{ ticket.price }}</text>
          </view>
        </view>

        <!-- 支付按钮（仅在待支付状态下显示） -->
        <button class="pay-btn" v-if="ticket.status === 'pending'" @tap.stop="payOrder(ticket)">
          立即支付
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import config from '../../../config/index'

export default {
  setup() {
    const activeTab = ref('all') // 当前激活的Tab
    
    // Tab配置
    const tabs = ref([
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待支付' },
      { key: 'confirmed', label: '待核销' },
      { key: 'refunded', label: '已退款' },
      { key: 'expired', label: '已过期' }
    ])

    // 票数据从后台获取
    const tickets = ref([])

    // 根据当前Tab筛选票
    const filteredTickets = computed(() => {
      if (activeTab.value === 'all') {
        return tickets.value
      }
      return tickets.value.filter(ticket => ticket.status === activeTab.value)
    })

    // 获取各Tab的数量
    const getTabCount = (tabKey) => {
      if (tabKey === 'all') {
        return tickets.value.length
      }
      return tickets.value.filter(ticket => ticket.status === tabKey).length
    }

    // 切换Tab
    const switchTab = (tabKey) => {
      activeTab.value = tabKey
    }

    // 获取状态样式类
    const getStatusClass = (status) => {
      const statusMap = {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        refunded: 'status-refunded',
        expired: 'status-expired'
      }
      return statusMap[status] || 'status-pending'
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusTextMap = {
        pending: '待支付',
        confirmed: '待核销',
        refunded: '已退款',
        expired: '已过期'
      }
      return statusTextMap[status] || '未知状态'
    }

    // 查看票详情
    const viewTicketDetail = (ticket) => {
      Taro.navigateTo({
        url: `/pages/detail/index?id=${ticket.id}`
      })
    }

    // 去首页购票
    const goToHome = () => {
      Taro.switchTab({
        url: '/pages/index/index'
      })
    }

    // 空状态文本
    const getEmptyText = () => {
      const textMap = {
        all: '暂无票券',
        pending: '暂无待支付订单',
        confirmed: '暂无待核销票券',
        refunded: '暂无退款记录',
        expired: '暂无过期票券'
      }
      return textMap[activeTab.value] || '暂无数据'
    }

    const getEmptySubtext = () => {
      const textMap = {
        all: '快去购买喜欢的演唱会门票吧',
        pending: '快去挑选心仪的演唱会吧',
        confirmed: '购票后可以在这里查看',
        refunded: '退款记录会在这里显示',
        expired: '过期票券会在这里显示'
      }
      return textMap[activeTab.value] || '暂无相关数据'
    }

    // 加载票数据
    const loadTickets = async () => {
      try {
        console.log('请求票夹接口:', `${config.apiBaseUrl}/tickets`)
        const res = await Taro.request({
          url: `${config.apiBaseUrl}/tickets`, // 实际接口路径
          method: 'GET'
        })
        console.log('票夹接口返回:', res)
        tickets.value = res.data || []
      } catch (err) {
        Taro.showToast({ title: '票夹加载失败', icon: 'none' })
      }
    }

    // 微信支付统一下单
    const payOrder = async (ticket) => {
      try {
        // 检查网络状态
        const { checkNetworkStatus, safeRequest } = await import('../../utils/networkErrorHandler')
        
        const isNetworkAvailable = await checkNetworkStatus()
        if (!isNetworkAvailable) return

        // 1. 请求后端微信支付统一下单接口
        const res = await safeRequest({
          url: `${config.apiBaseUrl}/wechatpay/unifiedorder`,
          method: 'POST',
          data: {
            description: ticket.concertName || '演唱会门票',
            out_trade_no: ticket.orderNumber || `ORDER_${ticket.id}`,
            amount: ticket.price,
            openid: ticket.openid || '', // 需确保有openid
            trade_type: 'JSAPI'
          }
        })
        
        const payData = res.data
        
        // 验证支付数据完整性
        if (!payData.timeStamp || !payData.nonceStr || !payData.package || !payData.paySign) {
          throw new Error('支付数据不完整')
        }

        // 2. 调用微信支付
        await Taro.requestPayment({
          timeStamp: payData.timeStamp,
          nonceStr: payData.nonceStr,
          package: payData.package,
          signType: payData.signType || 'MD5',
          paySign: payData.paySign
        })
        
        Taro.showToast({ title: '支付成功', icon: 'success' })
        checkPayStatus(ticket.id)
      } catch (err) {
        console.error('支付失败:', err)
        // 支付相关的特殊错误处理
        let errorMsg = '支付失败，请重试'
        if (err.errMsg) {
          if (err.errMsg.includes('cancel')) {
            errorMsg = '支付已取消'
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '支付失败，请检查网络连接'
          }
        }
        Taro.showToast({ title: errorMsg, icon: 'none' })
      }
    }
    // 查询支付状态
    const checkPayStatus = async (orderId) => {
      try {
        const { safeRequest } = await import('../../utils/networkErrorHandler')
        
        console.log('请求支付状态接口:', `${config.apiBaseUrl}/order/status`, { orderId })
        const res = await safeRequest({
          url: `${config.apiBaseUrl}/order/status`,
          method: 'GET',
          data: { orderId }
        })
        console.log('支付状态接口返回:', res)
        // 可根据返回结果刷新票据状态
        loadTickets()
      } catch (err) {
        console.error('查询支付状态失败:', err)
        // 静默失败，不影响用户体验
      }
    }

    onMounted(() => {
      loadTickets()
    })

    return {
      activeTab,
      tabs,
      tickets,
      filteredTickets,
      getTabCount,
      switchTab,
      getStatusClass,
      getStatusText,
      viewTicketDetail,
      goToHome,
      getEmptyText,
      getEmptySubtext,
  payOrder,
  checkPayStatus,
    }
  }
}
</script>

<style lang="scss">
.tickets-page {
  background: #101528;
  min-height: 100vh;
  padding-bottom: 40px;

  .page-header {
    padding: 30px;
    background: rgba(255, 255, 255, 0.05);

    .page-title {
      display: block;
      font-size: 36px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 10px;
    }

    .page-subtitle {
      font-size: 28px;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .tab-container {
    background: #1a1f36;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .tab-scroll {
      white-space: nowrap;

      .tab-list {
        display: inline-flex;
        padding: 0 20px;

        .tab-item {
          position: relative;
          padding: 20px 25px;
          font-size: 28px;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.3s ease;

          &.active {
            color: #4E37FD;
            font-weight: bold;

            &::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 25px;
              right: 25px;
              height: 4px;
              background: #4E37FD;
              border-radius: 2px;
            }
          }

          .tab-count {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #f5222d;
            color: #fff;
            font-size: 20px;
            padding: 2px 6px;
            border-radius: 10px;
            min-width: 20px;
            text-align: center;
          }
        }
      }
    }
  }

  .tickets-list {
    height: calc(100vh - 300px);
    padding: 20px;

    .ticket-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      margin-bottom: 20px;
      padding: 20px;
      position: relative;
      overflow: hidden;

      .ticket-status {
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 22px;
        font-weight: bold;

        &.status-pending {
          background: #faad14;
          color: #fff;
        }

        &.status-confirmed {
          background: #52c41a;
          color: #fff;
        }

        &.status-refunded {
          background: #8c8c8c;
          color: #fff;
        }

        &.status-expired {
          background: #f5222d;
          color: #fff;
        }
      }

      .ticket-content {
        display: flex;
        margin-bottom: 20px;

        .concert-image {
          width: 120px;
          height: 90px;
          border-radius: 8px;
          margin-right: 20px;
        }

        .ticket-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .concert-name {
            font-size: 28px;
            font-weight: bold;
            color: #fff;
            margin-bottom: 8px;
          }

          .concert-date,
          .concert-venue,
          .seat-info {
            font-size: 24px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 4px;
          }

          .ticket-price {
            font-size: 26px;
            color: #4E37FD;
            font-weight: bold;
            margin-top: 8px;
          }
        }
      }

      .pay-btn {
        background: #4E37FD;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-size: 24px;
        font-weight: bold;
        position: absolute;
        bottom: 20px;
        right: 20px;
        transition: background 0.3s ease;

        &:hover {
          background: #5b4efc;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 100px 30px;

      .empty-image-placeholder {
        width: 200px;
        height: 200px;
        margin-bottom: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 80px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
      }

      .empty-text {
        display: block;
        font-size: 32px;
        color: #fff;
        margin-bottom: 10px;
      }

      .empty-subtext {
        display: block;
        font-size: 26px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 40px;
      }

      .buy-btn {
        background: #4E37FD;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 20px 40px;
        font-size: 28px;
        font-weight: bold;
      }
    }
  }
}
</style>