// pages/detail/detail.ts
const app = getApp()
export{}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    link: '',
    openid: '',
    openTime:'',
    userInfo:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(option){
    const link = option.link
    console.log('the link is ', link)
    const openTime  = new Date()
    this.setData({
      link: link,
      openid: app.globalData.openID,
      openTime: openTime,
      userInfo: app.globalData.userInfo
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
    const db = wx.cloud.database()
    const endTime = new Date()
    const startTime = new Date(this.data.openTime)

    try {
      db.collection('readHistory').add({
        data:{
          startTime: startTime,
          endTime: endTime,
          link: this.data.link
        }
      })
  
      if (this.data.userInfo.testGroup == 3) {
        wx.navigateTo({
          url: '/pages/quiz/quiz?link=' + this.data.link,
        })
      }
      else{  
        wx.showModal({
          title: '阅读成功',
          content:'低碳生活，携手同行！',
          showCancel: false
        })
      }
    } catch(err) {
      console.log("文章阅读记录失败：" + err)
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