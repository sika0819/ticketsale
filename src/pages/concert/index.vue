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
        <image class="arrow-icon" :src="arrowIcon" mode="aspectFit" />
        <text class="distance">{{ concert.distance }}</text>
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
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import Taro from '@tarojs/taro'

// 异步加载介绍组件
const ConcertIntro = defineAsyncComponent({
  loader: () => import('@/components/ConcertIntro.vue'),
  delay: 200,
  timeout: 10000,
  suspensible: false
})

export default {
  components: { ConcertIntro },
  setup() {
    const concert = ref({})
 const arrowIcon = ref('../../assets/images/arrow.png') // 箭头图标路径

    // 计算剩余票数百分比
    const ticketPercentage = computed(() => {
      const remaining = concert.value.remainingTickets || 0
      const total = concert.value.totalTickets || 1
      return (remaining / total) * 100
    })

    onMounted(() => {
      loadConcertData()
    })

    const loadConcertData = () => {
      // 模拟演唱会数据
      concert.value = {
        id: 1,
        poster: '../../assets/images/concert1.png',
        location: '北京',
        name: '2025VR演唱会',
        price: 380,
        date: '2025-10-31',
        time: '19:30',
        venue: '合生汇',
        address: '北京市朝阳区西大望路21号合生汇购物中心5层',
        distance: '1.2km',
        tags: ['提供VR设备', '电子发票', '支持退票'],
        introduction: '2025最新VR巡回演唱会，带来最新专辑以及经典歌曲表演。跨年夜，让我们一起跟随音乐唱响未来！本次演唱会采用最先进的VR技术，为观众带来沉浸式视听体验。演出包含多首经典曲目和新专辑首发歌曲，时长约120分钟。',
        remainingTickets: 40,
        totalTickets: 100
      }
    }

    const goToTicketSelection = () => {
      Taro.navigateTo({
        url: `/pages/ticket/index`
      })
    }

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
          width: 32rpx;
          height: 32rpx;
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