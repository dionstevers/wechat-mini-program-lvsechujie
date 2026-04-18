const app = getApp()
const { CONSENT_RENDER } = require('../../config/consent.js')

Page({
  data: {
    devMode: false,
    content: CONSENT_RENDER,
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
    const m = CONSENT_RENDER.disagreeModal
    wx.showModal({
      title: m.title,
      content: m.content,
      showCancel: false,
      confirmText: m.confirmText,
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
