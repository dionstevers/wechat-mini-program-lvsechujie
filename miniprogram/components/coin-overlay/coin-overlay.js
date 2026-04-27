const app = getApp()

// movable-view uses px, not rpx. Convert via system info: windowWidth(px) ÷ 750(rpx).
const SIZE_RPX = 130
const MARGIN_RPX = 24

Component({
  data: {
    coins: 0,
    yuan: '0.00',
    x: 0,
    y: 0,
    pulsing: false,
  },
  lifetimes: {
    attached() {
      this._restorePosition()
      this._update(app && app.globalData ? (app.globalData.totalCoins || 0) : 0)
      if (app && typeof app.subscribeTotalCoins === 'function') {
        this._unsub = app.subscribeTotalCoins((v) => this._update(v))
      }
    },
    detached() {
      if (this._unsub) this._unsub()
    },
  },
  methods: {
    _update(coins) {
      const prev = this.data.coins
      this.setData({ coins, yuan: (coins * 0.05).toFixed(2) })
      if (coins > prev) this._triggerPulse()
    },
    _triggerPulse() {
      // Toggle off first so consecutive bumps re-fire the animation.
      if (this._pulseTimer) clearTimeout(this._pulseTimer)
      this.setData({ pulsing: false })
      setTimeout(() => this.setData({ pulsing: true }), 20)
      this._pulseTimer = setTimeout(() => {
        this.setData({ pulsing: false })
        this._pulseTimer = null
      }, 600)
    },
    _restorePosition() {
      const saved = app && app.globalData && app.globalData.coinOverlayPos
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        this.setData({ x: saved.x, y: saved.y })
        return
      }
      // Default: top-right corner
      try {
        const info = wx.getSystemInfoSync()
        const rpxToPx = info.windowWidth / 750
        const sizePx = SIZE_RPX * rpxToPx
        const marginPx = MARGIN_RPX * rpxToPx
        this.setData({
          x: info.windowWidth - sizePx - marginPx,
          y: marginPx + 35, // approx safe area
        })
      } catch (e) {
        this.setData({ x: 280, y: 60 })
      }
    },
    onMove(e) {
      // bindchange fires during drag and on release. Persist only the final touch position.
      if (e.detail.source === 'touch' || e.detail.source === 'touch-out-of-bounds') {
        if (app && app.globalData) {
          app.globalData.coinOverlayPos = { x: e.detail.x, y: e.detail.y }
        }
      }
    },
  },
})
