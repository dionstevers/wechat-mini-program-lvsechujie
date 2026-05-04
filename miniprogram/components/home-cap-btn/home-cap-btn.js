// home-cap-btn — custom replacement for the WeChat home capsule on
// mid-flow pages. Mid-flow taps emit a `nudge` event (host page paints a
// banner via welcome-banner.showText). Session-complete taps reLaunch to
// the loading dispatcher, which routes the participant to news-feed in
// finished/free-use state.

const app = getApp()

Component({
  methods: {
    onTap() {
      const g = (app && app.globalData) || {}
      if (g.rewardPaid || g.rewardAttempted) {
        wx.reLaunch({ url: '/pages/loading/loading' })
        return
      }
      this.triggerEvent('nudge', { route: g.experimentRoute || '' })
    },
  },
})
