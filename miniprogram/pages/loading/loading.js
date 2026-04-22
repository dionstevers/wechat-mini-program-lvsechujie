Page({
  onLoad() {
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/consent/consent' })
    }, 2000)
  },
})
