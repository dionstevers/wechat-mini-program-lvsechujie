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
          this._markPaid(result)
        } else if (result.error === 'in_flight') {
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

  _markPaid(result) {
    const txn = result.transaction_id || ''
    const ts = result.paid_at || Date.now()
    this.setData({ payState: 'paid', transactionId: txn, paidAt: ts })
    // Hydrate globalData so the loading dispatcher (and 个人积分 banner)
    // route the participant to the finished-state news-feed on every
    // subsequent re-launch.
    if (app && app.globalData) {
      app.globalData.rewardPaid = true
      app.globalData.rewardYuan = Number(this.data.rewardYuan || 0)
      app.globalData.rewardTransactionId = txn
      app.globalData.rewardPaidTimestamp = ts
    }
  },

  _retryAfterInFlight() {
    if (this.data.payState !== 'paying') return
    wx.cloud.callFunction({
      name: 'claimReward',
      success: (res) => {
        const result = res.result || {}
        if (result.success) {
          this._markPaid(result)
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
