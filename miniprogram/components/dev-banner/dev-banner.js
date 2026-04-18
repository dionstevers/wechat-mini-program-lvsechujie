const app = getApp()

Component({
  data: {
    devMode: false,
  },
  attached() {
    this.setData({ devMode: !!(app && app.globalData && app.globalData.devMode) })
  },
})
