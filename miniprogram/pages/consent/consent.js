const app = getApp()
const { CONSENT_RENDER, CONSENT_RENDER_EN } = require('../../config/consent.js')
const { REWARD_CONFIG } = require('../../config/reward.js')

Page({
  data: {
    devMode: false,
    content: CONSENT_RENDER,
    contentEn: null,
    btnCoins: REWARD_CONFIG.coins_consent || 0,
    submitting: false,
  },

  onLoad() {
    const devMode = !!app.globalData.devMode
    this.setData({
      devMode,
      contentEn: devMode ? CONSENT_RENDER_EN : null,
    })
  },

  onAgree() {
    // Synchronous instance-var guard — beats the setData race window where
    // a second rapid tap lands before WeChat has rendered disabled=true.
    if (this._consenting) return
    this._consenting = true
    this.setData({ submitting: true })
    wx.cloud.callFunction({
      name: 'saveConsent',
      data: { consent_given: true },
      success: () => {
        if (app && typeof app.addTotalCoins === 'function') {
          app.addTotalCoins(REWARD_CONFIG.coins_consent || 0)
        }
        wx.redirectTo({ url: '/pages/registration/registration' })
      },
      fail: (err) => {
        console.error('saveConsent failed', err)
        this._consenting = false
        this.setData({ submitting: false })
        wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      },
    })
  },

  onDisagree() {
    if (this._consenting) return
    const m = CONSENT_RENDER.disagreeModal
    wx.showModal({
      title: m.title,
      content: m.content,
      showCancel: false,
      confirmText: m.confirmText,
      success: () => {
        if (this._consenting) return
        this._consenting = true
        this.setData({ submitting: true })
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
