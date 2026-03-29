export default defineAppConfig({
  pages: [
    'pages/live/index',
    'pages/game/index',
    'pages/events/index',
    'pages/logic/index',
    'pages/strategy/index',
    'pages/worlds/index',
    'pages/settings/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#0a0a0a',
    navigationBarTitleText: '\u67d3\u949f\u697c\u903b\u8f91\u52a9\u624b',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0a0a0a',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#7c3aed',
    backgroundColor: '#0a0a0a',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/game/index', text: '\u5bf9\u5c40', iconPath: 'assets/tab-game.png', selectedIconPath: 'assets/tab-game-active.png' },
      { pagePath: 'pages/events/index', text: '\u4e8b\u4ef6', iconPath: 'assets/tab-events.png', selectedIconPath: 'assets/tab-events-active.png' },
      { pagePath: 'pages/logic/index', text: '\u903b\u8f91', iconPath: 'assets/tab-logic.png', selectedIconPath: 'assets/tab-logic-active.png' },
      { pagePath: 'pages/worlds/index', text: '\u4e16\u754c', iconPath: 'assets/tab-worlds.png', selectedIconPath: 'assets/tab-worlds-active.png' },
      { pagePath: 'pages/settings/index', text: '\u8bbe\u7f6e', iconPath: 'assets/tab-settings.png', selectedIconPath: 'assets/tab-settings-active.png' },
    ],
  },
});
