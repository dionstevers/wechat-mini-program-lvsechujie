// Screen 8 — Reward Collection
// Shows the participant's coin total + yuan equivalent, then offers a Claim
// button that triggers the claimReward cloud function (which dispatches a
// red packet via sendCashReward server-side). Idempotent on reward_paid.

const app = getApp()

Page({
  data: {
    coinsTotal: 0,
    rewardYuan: '0.00',
    confirmationId: '',
    loading: true,
    payState: 'idle',          // 'idle' | 'paying' | 'paid' | 'error'
    transactionId: '',
    paidAt: null,
    errorMsg: '',
  },

  _claiming: false,

  onLoad() {
    wx.cloud.callFunction({
      name: 'completeSession',
      success: (res) => {
        const result = res.result || {}
        if (!result.success) {
          this._showError()
          return
        }
        const openid = (app.globalData && app.globalData.openID) || ''
        const confirmationId = openid ? openid.slice(-8).toUpperCase() : '—'
        const alreadyPaid = result.reward_paid === true

        this.setData({
          coinsTotal: result.coins_total || 0,
          rewardYuan: (result.reward_yuan || 0).toFixed(2),
          confirmationId,
          loading: false,
          payState: alreadyPaid ? 'paid' : 'idle',
          transactionId: result.reward_transaction_id || '',
          paidAt: result.reward_paid_timestamp || null,
        })
      },
      fail: () => this._showError(),
    })
  },

  onClaim() {
    if (this._claiming) return
    if (this.data.payState === 'paid' || this.data.payState === 'paying') return
    this._claiming = true
    this.setData({ payState: 'paying', errorMsg: '' })

    wx.cloud.callFunction({
      name: 'claimReward',
      success: (res) => {
        const result = res.result || {}
        if (result.success) {
          this.setData({
            payState: 'paid',
            transactionId: result.transaction_id || '',
            paidAt: result.paid_at || Date.now(),
          })
        } else if (result.error === 'in_flight') {
          // Another tap is mid-flight on the server; retry once after 2s.
          setTimeout(() => this._retryAfterInFlight(), 2000)
        } else {
          this._enterError(result.error || 'unknown_error')
        }
      },
      fail: (err) => {
        this._enterError((err && err.errMsg) || 'network_error')
      },
      complete: () => {
        this._claiming = false
      },
    })
  },

  _retryAfterInFlight() {
    if (this.data.payState !== 'paying') return
    wx.cloud.callFunction({
      name: 'claimReward',
      success: (res) => {
        const result = res.result || {}
        if (result.success) {
          this.setData({
            payState: 'paid',
            transactionId: result.transaction_id || '',
            paidAt: result.paid_at || Date.now(),
          })
        } else {
          this._enterError(result.error || 'in_flight_timeout')
        }
      },
      fail: (err) => this._enterError((err && err.errMsg) || 'network_error'),
    })
  },

  _enterError(msg) {
    this.setData({ payState: 'error', errorMsg: String(msg) })
  },

  _showError() {
    this.setData({ loading: false })
    wx.showModal({ title: '出错了', content: '请检查网络连接后重试', showCancel: false })
  },
})
