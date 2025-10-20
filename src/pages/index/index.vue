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
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'
export default {
  setup () {
    const banners = ref([])
    const concerts = ref([])

    // 获取轮播图和演唱会列表数据
    const fetchData = async () => {
      try {
        // 轮播图接口
        console.log('请求轮播图接口:', 'https://www.3fenban.com/api/banners')
        const bannerRes = await Taro.request({
          url: 'https://www.3fenban.com/api/banners', // 替换为实际接口
          method: 'GET'
        })
        console.log('轮播图接口返回:', bannerRes)
        banners.value = bannerRes.data || []

        // 演唱会列表接口
        console.log('请求演唱会列表接口:', 'https://www.3fenban.com/api/concerts')
        const concertRes = await Taro.request({
          url: 'https://www.3fenban.com/api/concerts', // 替换为实际接口
          method: 'GET'
        })
        console.log('演唱会列表接口返回:', concertRes)
        concerts.value = concertRes.data || []
      } catch (err) {
        console.error('数据加载失败:', err)
        Taro.showToast({ title: '数据加载失败', icon: 'none' })
      }
    }

    const onBannerTap = (banner) => {
      Taro.navigateTo({ url: banner.link })
    }

    const navigateToConcert = (id) => {
      Taro.navigateTo({ url: `/pages/concert/index?id=${id}` })
    }

    // 页面加载时获取数据
   
    useLoad(() => {
      fetchData()
    })

    return {
      banners,
      concerts,
      onBannerTap,
      navigateToConcert
    }
  }
}
</script>