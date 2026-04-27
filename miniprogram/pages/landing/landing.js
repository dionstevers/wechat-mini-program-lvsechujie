const { LANDING_CONFIG } = require('../../config/landing.js')
const { REWARD_CONFIG } = require('../../config/reward.js')

const app = getApp()

Page({
  data: {
    content: LANDING_CONFIG,
    rewardModal: { show: false, coins: 0, yuan: '0.00' },
    submitting: false,
  },

  onNext() {
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const coins = REWARD_CONFIG.coins_registration || 0
    const yuan = (coins * REWARD_CONFIG.coins_to_yuan_rate).toFixed(2)
    if (app && typeof app.addTotalCoins === 'function') {
      app.addTotalCoins(coins)
    }
    this.setData({
      submitting: false,
      rewardModal: { show: true, coins, yuan },
    })
  },

  onRewardConfirm() {
    this.setData({ 'rewardModal.show': false })
    wx.redirectTo({ url: '/pages/consent/consent' })
  },
})
