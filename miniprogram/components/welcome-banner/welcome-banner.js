// welcome-banner — small dismissable strip that surfaces re-entry copy.
// Reads app.globalData.welcomeBackBanner on attach. Tapping 知道了 clears
// the global field so it doesn't re-appear on subsequent tab switches.

const app = getApp()

Component({
  data: {
    visible: false,
    text: '',
  },
  lifetimes: {
    attached() {
      const text = (app && app.globalData && app.globalData.welcomeBackBanner) || ''
      if (text) this.setData({ visible: true, text })
    },
  },
  methods: {
    onDismiss() {
      this.setData({ visible: false })
      if (app && app.globalData) app.globalData.welcomeBackBanner = ''
    },
  },
})
