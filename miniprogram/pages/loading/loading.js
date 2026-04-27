Page({
  onLoad() {
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/landing/landing' })
    }, 2000)
  },
})
