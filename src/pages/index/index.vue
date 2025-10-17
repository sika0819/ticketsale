<template>
  <view class="index">
    <!-- 轮播图 -->
    <swiper class="banner" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500">
      <swiper-item v-for="(banner, index) in banners" :key="index">
        <image :src="banner.imageUrl" mode="aspectFill" @tap="onBannerTap(banner)" />
      </swiper-item>
    </swiper>

    <!-- 演唱会列表 -->
    <view class="concert-list">
      <view class="section-title">演出时间 ▼</view>
      <view class="concert-item" v-for="concert in concerts" :key="concert.id" @tap="navigateToConcert(concert.id)">
        <image :src="concert.imageUrl" mode="aspectFill" class="concert-image" />
        <view class="concert-info">
          <text class="concert-name">{{concert.city}} | {{ concert.name }}</text>
          <text class="concert-date">{{ concert.date }}</text>
          <text class="concert-venue">{{ concert.venue }}</text>
          <text class="concert-price">¥{{ concert.price }}起</text>
        </view>
      </view>
    </view>

    <!-- 移除 TabBar 组件 -->
  </view>
</template>

<script>
import { ref } from 'vue'
import Taro from '@tarojs/taro'
import './index.scss'

export default {
  setup () {
    const banners = ref([
      { 
        id: 1, 
        imageUrl: '../../assets/images/banner1.png', 
        link: '/pages/concert/index?id=1' 
      }
    ])
    
    const concerts = ref([
      {
        id: 1,
        city: '北京',
        name: '2025VR演唱会',
        date: '2025-10-31',
        venue: '北京鸟巢体育场',
        price: 380,
        imageUrl: '../../assets/images/concert1.png'
      }
    ])

    const onBannerTap = (banner) => {
      Taro.navigateTo({ url: banner.link })
    }

    const navigateToConcert = (id) => {
      Taro.navigateTo({ url: `/pages/concert/index?id=${id}` })
    }

    return {
      banners,
      concerts,
      onBannerTap,
      navigateToConcert
    }
  }
}
</script>