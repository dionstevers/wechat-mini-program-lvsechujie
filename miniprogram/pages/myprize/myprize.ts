// pages/myprize/myprize.ts
const app = getApp()
export{}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    prizelist:null,
    claimedprizes:null,
  },
  claimPrize(){
    var prizelist = JSON.stringify(this.data.prizelist)
    wx.navigateTo({
      url: '/pages/journal/journal?typeq=3&prizelist=' + prizelist
    })
  },
  onLoad(options) {
    var prizelist = JSON.parse(options.prizelist!)
    var claimedprizes = JSON.parse(options.claimedprizes!)
    this.setData({
      prizelist: prizelist,
      claimedprizes: claimedprizes
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