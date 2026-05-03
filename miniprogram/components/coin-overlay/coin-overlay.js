const app = getApp()
const { REWARD_CONFIG } = require('../../config/reward.js')

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
    popVisible: false,
    popValue: 0,
    popKey: 0,
    idleGlow: false,
  },
  lifetimes: {
    attached() {
      this._restorePosition()
      // Hydrate silently — first mount on a tab page must not pulse just
      // because totalCoins jumped from 0 (component default) to whatever
      // globalData currently holds.
      this._update(app && app.globalData ? (app.globalData.totalCoins || 0) : 0, { silent: true })
      this._hydrated = true
      if (app && typeof app.subscribeTotalCoins === 'function') {
        this._unsub = app.subscribeTotalCoins((v) => this._update(v))
      }
      // Idle-glow animation intentionally not scheduled — researcher finds
      // it distracting on tab switches.
    },
    detached() {
      if (this._unsub) this._unsub()
      if (this._idleGlowTimer) clearTimeout(this._idleGlowTimer)
      if (this._idleGlowOffTimer) clearTimeout(this._idleGlowOffTimer)
    },
  },
  methods: {
    _update(coins, options) {
      const prev = this.data.coins
      this.setData({ coins, yuan: (coins * REWARD_CONFIG.coins_to_yuan_rate).toFixed(2) })
      if ((options && options.silent) || !this._hydrated) return
      if (coins > prev) {
        this._triggerPulse()
        this._triggerPop(coins - prev)
      }
    },
    _triggerPulse() {
      if (this._pulseTimer) clearTimeout(this._pulseTimer)
      this.setData({ pulsing: false })
      setTimeout(() => this.setData({ pulsing: true }), 20)
      this._pulseTimer = setTimeout(() => {
        this.setData({ pulsing: false })
        this._pulseTimer = null
      }, 600)
    },
    _triggerPop(delta) {
      if (this._popTimer) clearTimeout(this._popTimer)
      // Force re-mount via key bump so consecutive pops re-run the keyframe.
      this.setData({ popVisible: false })
      setTimeout(() => {
        this.setData({
          popVisible: true,
          popValue: delta,
          popKey: (this.data.popKey || 0) + 1,
        })
      }, 20)
      this._popTimer = setTimeout(() => {
        this.setData({ popVisible: false })
        this._popTimer = null
      }, 950)
    },
    _restorePosition() {
      const saved = app && app.globalData && app.globalData.coinOverlayPos
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        this.setData({ x: saved.x, y: saved.y })
        return
      }
      // Default: roughly screen-centre (horizontal centre, ~60% down)
      try {
        const info = wx.getSystemInfoSync()
        const rpxToPx = info.windowWidth / 750
        const sizePx = SIZE_RPX * rpxToPx
        this.setData({
          x: info.windowWidth * 0.85 - sizePx / 2,
          y: info.windowHeight * 0.79 - sizePx / 2,
        })
      } catch (e) {
        this.setData({ x: 150, y: 400 })
      }
    },
    _scheduleIdleGlow() {
      // Random 2–8s, restart after each glow finishes.
      const wait = 2000 + Math.floor(Math.random() * 6000)
      this._idleGlowTimer = setTimeout(() => {
        // Off→on toggle so consecutive glows re-trigger the keyframe
        this.setData({ idleGlow: false })
        setTimeout(() => this.setData({ idleGlow: true }), 20)
        this._idleGlowOffTimer = setTimeout(() => {
          this.setData({ idleGlow: false })
          this._scheduleIdleGlow()
        }, 2050)
      }, wait)
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
