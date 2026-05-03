const { LANDING_CONFIG } = require('../../config/landing.js')
const { REWARD_CONFIG } = require('../../config/reward.js')
const { parseSegments } = require('../../utils/parse-segments.js')

const app = getApp()

Page({
  data: {
    content: LANDING_CONFIG,
    headerSegs: parseSegments(LANDING_CONFIG.header || ''),
    rewardModal: { show: false, coins: 0, yuan: '0.00', lines: [] },
    submitting: false,
    btnCoins: REWARD_CONFIG.coins_landing || 0,
  },

  onNext() {
    if (this._claimed) return
    this._claimed = true
    this.setData({ submitting: true })

    const coins = REWARD_CONFIG.coins_landing || 0
    const yuan = (coins * REWARD_CONFIG.coins_to_yuan_rate).toFixed(2)
    if (app && typeof app.addTotalCoins === 'function') {
      app.addTotalCoins(coins)
    }
    const lines = (LANDING_CONFIG.rewardLines || []).map(t =>
      t.replace('{{coins}}', coins).replace('{{yuan}}', yuan)
    ).map(parseSegments)
    // Keep submitting true so the button stays disabled while the reward
    // modal is open. Reset only on modal confirm + redirect — by then the
    // page is being torn down anyway.
    this.setData({
      rewardModal: { show: true, coins, yuan, lines },
    })
  },

  onRewardConfirm() {
    this.setData({ 'rewardModal.show': false })
    wx.redirectTo({ url: '/pages/consent/consent' })
  },
})
