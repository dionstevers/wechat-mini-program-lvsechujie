
import { hexMD5 } from '../../utils/md5.js';
import { updateColor } from '../../utils/colorschema'
// pages/survey/survey.ts
export{}
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    background : null,
  },
  /**
   * 生命周期函数--监听页面加载
   */

 onLoad(option) {

  },
  

  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  onShow() {
    // 更新颜色
    updateColor();
    
    this.setData({
      userInfo : app.globalData.userInfo
    })
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