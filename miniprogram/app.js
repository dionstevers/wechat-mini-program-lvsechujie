//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env:'iluvcarb-0gzvs45g82b57f98',
        traceUser: true,
      })
    }

    this.globalData = {}
    
  },
  globalData: {
    userInfo: null,
    openID: null,
    testGroup : 0,
    background: null,
  }
})
