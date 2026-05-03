const app = getApp()
const { CONSENT_RENDER, CONSENT_RENDER_EN } = require('../../config/consent.js')
const { REWARD_CONFIG } = require('../../config/reward.js')

Page({
  data: {
    devMode: false,
    content: CONSENT_RENDER,
    contentEn: null,
    btnCoins: REWARD_CONFIG.coins_consent || 0,
  },

  onLoad() {
    const devMode = !!app.globalData.devMode
    this.setData({
      devMode,
      contentEn: devMode ? CONSENT_RENDER_EN : null,
    })
  },

  onAgree() {
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
