// Screen 7 — Debriefing
// Shows Chinese debriefing text. 领取奖励 button activates after scroll to bottom.
// Logs debrief_shown_timestamp on load and debrief_read_timestamp on button tap.

Page({
  data: {
    buttonActive: false,
    submitting: false,
  },

  _pageHeight: 0,

  onLoad() {
    wx.cloud.callFunction({ name: 'logDebriefing', data: { event: 'shown' } })

    // Measure viewport height for scroll-to-bottom detection
    wx.getSystemInfo({
      success: (res) => { this._pageHeight = res.windowHeight },
    })
  },

  onScroll(e) {
    if (this.data.buttonActive) return

    const { scrollTop, scrollHeight } = e.detail
    // Activate when within 20px of bottom (accounts for sub-pixel rounding)
    if (scrollTop + this._pageHeight >= scrollHeight - 20) {
      this.setData({ buttonActive: true })
    }
  },

  onCollectReward() {
    if (!this.data.buttonActive || this.data.submitting) return
    this.setData({ submitting: true })

    wx.cloud.callFunction({
      name: 'logDebriefing',
      data: { event: 'read' },
      success: () => {
        wx.redirectTo({ url: '/pages/reward/reward' })
      },
      fail: () => {
        this.setData({ submitting: false })
        wx.showModal({ title: '提交失败', content: '请检查网络连接后重试', showCancel: false })
      },
    })
  },
})
