<template>
  <view class="ticket-detail-page">
    <!-- 订单状态 -->
    <view class="page-header">
      <view class="page-title">
        {{ getStatusText(ticket.status) }}
      </view>
      <text class="status-desc">{{ getStatusDesc(ticket.status) }}</text>
    </view>

    <!-- 票信息 -->
    <view class="ticket-info-section">
      <view class="ticket-card">
        <view class="ticket-details">
          <text class="concert-name">{{ticket.city}} | {{ ticket.concertName }}</text>
            <text class="concert-venue">{{ ticket.venue }}</text>
          <text class="concert-date">{{ ticket.date }} {{ ticket.time }}</text>
          <text class="ticket-price">¥{{ ticket.price }}</text>
        </view>
      </view>
            
      <!-- 核销二维码（待核销状态显示） -->
      <view class="qrcode-section" v-if="ticket.status === 'confirmed'">
        <view class="qrcode-container">
           <text class="seat-info">座位：{{ ticket.seatArea }} {{ ticket.seatNumber }}</text>
          <canvas 
            canvas-id="qrcodeCanvas" 
            class="qrcode-canvas"
            :style="{width: qrcodeSize + 'px', height: qrcodeSize + 'px'}"
          ></canvas>
          <text class="qrcode-tip">请出示此二维码进行核销</text>
          <text class="qrcode-info">票号：{{ ticket.ticketNumber }}</text>
          <text class="qrcode-info">订单号：{{ ticket.orderNumber }}</text>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="order-info-section">
      <view class="section-title">订单信息</view>
      <view class="info-list">
        <view class="info-item">
          <text class="info-label">订单编号</text>
          <text class="info-value">{{ ticket.orderNumber }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">票券编号</text>
          <text class="info-value">{{ ticket.ticketNumber }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">下单时间</text>
          <text class="info-value">{{ ticket.purchaseTime }}</text>
        </view>
        <view class="info-item" v-if="ticket.refundTime">
          <text class="info-label">退款时间</text>
          <text class="info-value">{{ ticket.refundTime }}</text>
        </view>
        <view class="info-item" v-if="ticket.expireTime">
          <text class="info-label">有效期至</text>
          <text class="info-value">{{ ticket.expireTime }}</text>
        </view>
        <view class="info-item" v-if="ticket.refundDeadline">
          <text class="info-label">退票截止</text>
          <text class="info-value">{{ ticket.refundDeadline }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button 
        class="action-btn" 
        :class="getButtonClass(ticket.status)"
        @tap="handleAction(ticket)"
      >
        {{ getButtonText(ticket.status) }}
      </button>
    </view>
  </view>
</template>

<script>
import useTicketDetail from './index.ts'
import './index.scss'

export default {
  setup() {
    const {
      ticket,
      qrcodeSize,
      getStatusClass,
      getStatusText,
      getStatusDesc,
      getButtonText,
      getButtonClass,
      handleAction
    } = useTicketDetail()

    return {
      ticket,
      qrcodeSize,
      getStatusClass,
      getStatusText,
      getStatusDesc,
      getButtonText,
      getButtonClass,
      handleAction
    }
  }
}
</script>
