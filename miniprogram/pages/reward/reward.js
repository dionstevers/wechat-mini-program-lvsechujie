// Screen 8 — Reward Collection
// Calls completeSession to compute final coin total and yuan reward.
// Displays confirmation number (openid short hash) and reward instructions.

Page({
  data: {
    coinsTotal: 0,
    rewardYuan: '0.00',
    confirmationId: '',
    loading: true,
  },

  onLoad() {
    wx.cloud.callFunction({
      name: 'completeSession',
      success: (res) => {
        const result = res.result
        if (result.success) {
          // Derive short confirmation ID from openid stored in globalData (last 8 chars)
          const app = getApp()
          const openid = app.globalData.openID || ''
          const confirmationId = openid ? openid.slice(-8).toUpperCase() : '—'

          this.setData({
            coinsTotal: result.coins_total || 0,
            rewardYuan: (result.reward_yuan || 0).toFixed(2),
            confirmationId,
            loading: false,
          })
        } else {
          this._showError()
        }
      },
      fail: () => this._showError(),
    })
  },

  _showError() {
    this.setData({ loading: false })
    wx.showModal({ title: '出错了', content: '请检查网络连接后重试', showCancel: false })
  },
})
