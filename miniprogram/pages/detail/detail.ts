// pages/detail/detail.ts
const appd = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    link: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(option){
    const link  = option.link
    console.log(link)
    this.setData({
      link: link
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setData({
      userInfo: appd.globalData.userInfo
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
   
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    if (this.data.userInfo.testGroup == 4 ||this.data.userInfo.testGroup == 5) {
      wx.navigateTo({
        url: '/pages/quiz/quiz?link=' + this.data.link,
      })
    }
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})