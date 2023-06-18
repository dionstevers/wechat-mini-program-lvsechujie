// pages/survey/survey.ts
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    background : 'linear-gradient(180deg, #00022a 0%,#009797 100%);'
  },
  tabchange(){
    var _this = this
    if (_this.data.userInfo.testGroup == 2) {
      _this.setData({
        background: 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
      }) 
      wx.setNavigationBarColor({
    
        backgroundColor: "#D13A29",
        frontColor: '#ffffff',
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */

  onLoad() {

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
      userInfo : app.globalData.userInfo
    })
    this.tabchange()
    wx.setNavigationBarTitle({
      title: '碳行家｜关于我们'
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