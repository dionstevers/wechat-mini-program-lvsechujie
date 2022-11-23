// pages/myprize/myprize.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:null,
    prizelist:null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async getUserInfo(){
    const data = wx.getStorageSync('userInfo')
    if (data){
       
      const userInfo = await wx.cloud.database().collection('userInfo').doc(data._id).get()
      this.setData({
        userInfo: userInfo.data,
        prizelist:userInfo.data.prizelist,
      })
      console.log(userInfo)
    }
    
  },
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
    this.getUserInfo()
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