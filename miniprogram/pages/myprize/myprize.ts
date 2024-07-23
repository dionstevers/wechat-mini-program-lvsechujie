// pages/myprize/myprize.ts
import { updateColor } from '../../utils/colorschema'
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    prizelist:null,
    claimedprizes:null,
    background: null
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
    // 更新颜色
    updateColor();
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

  onShareAppMessage() {
    logEvent("Share App")
    return {
      title: "快来一起低碳出街~",
      path:`/pages/index/index?sharedFromID=${app.globalData.openid}`,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  }
})