// pages/test/test.ts
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    code:'ilovecarbonclever',
    input: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  onInput(e){
    console.log(e.detail.value)
    this.setData({
      input:e.detail.value
    })
  },
  onSubmit(e){
    const _openid = app.globalData.openID
    const money  = 100 // 一元
    const batch_name = '低碳奖励金'
    const batch_remark = 'transfer test'
    const transfer_remark = '低碳奖金'
    if (this.data.code === this.data.input) {
      wx.cloud.callFunction({
        name:'transfer',
        data:{
          money,
          _openid,
          batch_name,
          batch_remark,
          transfer_remark,
        },
        success:(result)=>{
          wx.showToast({
            title:'领取成功',
            icon:'success'
          })
          this.setData({
            input:''
          })
        }
      })
    }else{
      wx.showToast({
        title:'答案错误',
        icon: 'error'
        })
      this.setData({
        input: ''
      })
    }
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