// exit-timer — draggable floating pill that runs the global 2-minute
// news-feed clock. Mounts on home / news-feed / center; reads start time
// from app.globalData (so all three tabs share the same clock). On expiry,
// awards +88 and reLaunches into the exit-survey. Tap once to skip in dev
// mode. Drag to reposition (movable-view).

const { REWARD_CONFIG } = require('../../config/reward.js')
const app = getApp()

const STORAGE_KEY = 'exit_timer_pos'

function pad2(n) { return n < 10 ? '0' + n : '' + n }

Component({
  data: {
    visible: false,
    devMode: false,
    mmss: '',
    expired: false,
    rewardCoins: 0,
    x: 0,
    y: 0,
  },

  lifetimes: {
    attached() {
      const devMode = !!(app.globalData && app.globalData.devMode)
      // movable-view uses px, not rpx. Compute the right-edge default from
      // the system window so the pill lands flush-right on first mount.
      let initialX = 0
      let initialY = 20
      try {
        const info = wx.getSystemInfoSync()
        const screenW = info.windowWidth
        const pillW = screenW * (devMode ? 460 : 320) / 750
        initialX = Math.max(0, screenW - pillW)
      } catch (e) {}
      // In production, always snap flush-right; ignore any drag persisted
      // from prior dev sessions. In dev mode, restore the last drag position.
      const saved = devMode
        ? (function () { try { return wx.getStorageSync(STORAGE_KEY) || null } catch (e) { return null } })()
        : null
      this.setData({
        devMode,
        rewardCoins: REWARD_CONFIG.coins_exit_entry || 0,
        x: saved && typeof saved.x === 'number' ? saved.x : initialX,
        y: saved && typeof saved.y === 'number' ? saved.y : initialY,
      })
      this._tick()
      this._interval = setInterval(() => this._tick(), 1000)
    },
    detached() {
      if (this._interval) clearInterval(this._interval)
    },
  },

  methods: {
    _tick() {
      const start = app.globalData && app.globalData.newsTimerStartTs
      if (!start) {
        if (this.data.visible) this.setData({ visible: false })
        return
      }
      const total = (app.globalData.NEWS_TIMER_DURATION_MS) || (2 * 60 * 1000)
      const remaining = total - (Date.now() - start)
      if (remaining <= 0) {
        this._fireExitSurvey()
        return
      }
      const seconds = Math.ceil(remaining / 1000)
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      const mmss = m + ':' + pad2(s)
      if (!this.data.visible) this.setData({ visible: true, mmss })
      else if (this.data.mmss !== mmss) this.setData({ mmss })
    },

    onMove(e) {
      // Persist position only on user-driven drags so the pill returns to
      // wherever the participant last left it across tab switches.
      if (e.detail.source !== 'touch' && e.detail.source !== 'touch-out-of-bounds') return
      const { x, y } = e.detail
      try { wx.setStorageSync(STORAGE_KEY, { x, y }) } catch (e2) {}
    },

    onTap() {
      // Dev-mode shortcut: skip the timer immediately.
      if (!this.data.devMode) return
      this._fireExitSurvey()
    },

    _fireExitSurvey() {
      if (app.globalData.exitSurveyFired) return
      app.globalData.exitSurveyFired = true
      this.setData({ expired: true })
      if (this._interval) {
        clearInterval(this._interval)
        this._interval = null
      }
      if (typeof app.addTotalCoins === 'function') {
        app.addTotalCoins(REWARD_CONFIG.coins_exit_entry || 0)
      }
      wx.reLaunch({ url: '/pages/exit-survey/exit-survey' })
    },
  },
})
