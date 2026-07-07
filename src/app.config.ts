export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/recommend/index',
    'pages/detail/index',
    'pages/favorites/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '今天吃啥',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '选菜',
        iconPath: 'assets/tabbar/index.png',
        selectedIconPath: 'assets/tabbar/index-active.png',
      },
      {
        pagePath: 'pages/recommend/index',
        text: '推荐',
        iconPath: 'assets/tabbar/recommend.png',
        selectedIconPath: 'assets/tabbar/recommend-active.png',
      },
      {
        pagePath: 'pages/favorites/index',
        text: '我的',
        iconPath: 'assets/tabbar/me.png',
        selectedIconPath: 'assets/tabbar/me-active.png',
      },
    ],
  },
});
