// exit-timer — floating pill that runs the global 2-minute news-feed clock.
// Mounts on home / news-feed / center. Reads start time from app.globalData
// (so all three tabs share the same clock). On expiry, awards +88 and
// reLaunches into the exit-survey. In dev mode, tappable to skip.

const { REWARD_CONFIG } = require('../../config/reward.js')
const app = getApp()

function pad2(n) { return n < 10 ? '0' + n : '' + n }

Component({
  data: {
    visible: false,
    devMode: false,
    mmss: '',
    expired: false,
  },

  lifetimes: {
    attached() {
      this.setData({ devMode: !!(app.globalData && app.globalData.devMode) })
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
      // Award the entry-to-exit-survey coin on the client for the overlay
      // pulse. Server-side completeSession adds COINS_EXIT_ENTRY as a flat
      // constant, so the client tally and the payout stay aligned.
      if (typeof app.addTotalCoins === 'function') {
        app.addTotalCoins(REWARD_CONFIG.coins_exit_entry || 0)
      }
      wx.reLaunch({ url: '/pages/exit-survey/exit-survey' })
    },
  },
})
