<template>
  <view class="concert-intro">
    <view class="intro-text">{{ text }}</view>
  </view>
</template>

<script>
export default {
  name: 'ConcertIntro',
  props: {
    text: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.concert-intro {
  padding: 24rpx;
  background: #f9f9f9;
  border-radius: 16rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #333;
  .intro-text {
    white-space: pre-wrap;
  }
}
</style>
