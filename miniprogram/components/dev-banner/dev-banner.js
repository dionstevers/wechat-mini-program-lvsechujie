const app = getApp()

Component({
  data: {
    devMode: false,
    devLabel: '',
    dimmed: false,
  },
  attached() {
    const on = !!(app && app.globalData && app.globalData.devMode)
    const opt = (app && app.globalData && app.globalData.devModeOption) || ''
    this.setData({
      devMode: on,
      devLabel: opt ? `DEV_MODE [${opt}]` : 'DEV_MODE',
    })
  },
  methods: {
    onTap() {
      this.setData({ dimmed: !this.data.dimmed })
    },
  },
})
