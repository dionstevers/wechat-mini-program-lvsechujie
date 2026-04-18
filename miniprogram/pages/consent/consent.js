const app = getApp()

Page({
  data: {
    devMode: false,
  },

  onLoad() {
    this.setData({ devMode: !!app.globalData.devMode })
  },

  onAgree() {
    wx.cloud.callFunction({
      name: 'saveConsent',
      data: { consent_given: true },
      success: () => {
        wx.redirectTo({ url: '/pages/registration/registration' })
      },
      fail: (err) => {
        console.error('saveConsent failed', err)
        wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      },
    })
  },

  onDisagree() {
    wx.showModal({
      title: '感谢您的时间',
      content: '您已选择不参与本研究。',
      showCancel: false,
      confirmText: '退出',
      success: () => {
        wx.cloud.callFunction({
          name: 'saveConsent',
          data: { consent_given: false },
          complete: () => {
            if (wx.exitMiniProgram) {
              wx.exitMiniProgram()
            } else {
              wx.navigateBack({ delta: 10, fail: () => {} })
            }
          },
        })
      },
    })
  },
})
