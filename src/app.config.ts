export default defineAppConfig({
  // 回退：所有页面直接放主包，方便排查空白
  pages: [
    'pages/index/index',
    'pages/orders/index',
    'pages/mine/index',
    'pages/concert/index',
    'pages/detail/index',
    'pages/ticket/index'
  ],

  tabBar: {
    color: '#7A7E83',
    selectedColor: '#4E37FD',
    backgroundColor: '#1a1f36',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/images/home.png',
        selectedIconPath: 'assets/images/home-active.png'
      },
      {
        pagePath: 'pages/orders/index',
        text: '票夹',
        iconPath: 'assets/images/order.png',
        selectedIconPath: 'assets/images/order-active.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/images/user.png',
        selectedIconPath: 'assets/images/user-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#101528',
    navigationBarTitleText: 'VR演唱会',
    navigationBarTextStyle: 'white'
  }
})