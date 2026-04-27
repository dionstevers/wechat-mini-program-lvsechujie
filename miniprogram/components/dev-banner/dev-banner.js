const app = getApp()

Component({
  data: {
    devMode: false,
    devLabel: '',
  },
  attached() {
    const on = !!(app && app.globalData && app.globalData.devMode)
    const opt = (app && app.globalData && app.globalData.devModeOption) || ''
    this.setData({
      devMode: on,
      devLabel: opt ? `DEV_MODE [${opt}]` : 'DEV_MODE',
    })
  },
})
