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
  onShow:function(e){
    console.log('event',e)
    this.globalData.shareTicket = e.shareTicket
    console.log('the share ticket is ', e.shareTicket)
  },

  // 全局常量
  constData: {
    totalTestGroupNumber: 3,
    totalArticleTypeNumber: 2
  },

  // 全局用户数据
  globalData: {
    userInfo: null,
    openID: null,
    testGroup : 0,
    background: null,
    shareTicket:null
  }
})
