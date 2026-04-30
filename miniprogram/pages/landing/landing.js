const { LANDING_CONFIG } = require('../../config/landing.js')
const { REWARD_CONFIG } = require('../../config/reward.js')

const app = getApp()

function parseSegments(text) {
  const segs = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ text: text.slice(last, m.index), bold: false })
    segs.push({ text: m[1], bold: true })
    last = m.index + m[0].length
  }
  if (last < text.length) segs.push({ text: text.slice(last), bold: false })
  return segs
}

Page({
  data: {
    content: LANDING_CONFIG,
    rewardModal: { show: false, coins: 0, yuan: '0.00', lines: [] },
    submitting: false,
    btnCoins: REWARD_CONFIG.coins_landing || 0,
  },

  onNext() {
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const coins = REWARD_CONFIG.coins_landing || 0
    const yuan = (coins * REWARD_CONFIG.coins_to_yuan_rate).toFixed(2)
    if (app && typeof app.addTotalCoins === 'function') {
      app.addTotalCoins(coins)
    }
    const lines = (LANDING_CONFIG.rewardLines || []).map(t =>
      t.replace('{{coins}}', coins).replace('{{yuan}}', yuan)
    ).map(parseSegments)
    this.setData({
      submitting: false,
      rewardModal: { show: true, coins, yuan, lines },
    })
  },

  onRewardConfirm() {
    this.setData({ 'rewardModal.show': false })
    wx.redirectTo({ url: '/pages/consent/consent' })
  },
})
