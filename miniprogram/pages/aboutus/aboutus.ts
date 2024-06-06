
import { hexMD5 } from '../../utils/md5.js';
// pages/survey/survey.ts
export{}
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    background : 'linear-gradient(180deg, #00022a 0%,#009797 100%);',
    u_openid:''

  },
  /**
   * 生命周期函数--监听页面加载
   */

  onLoad(option) {
    console.log(option)
    console.log('the u_openid is ',option.u_openid)
    this.setData({
      u_openid : option.u_openid
    });
    wx.cloud.callFunction({
      name: 'getip',
      success(res) {
        if (res.result) {
          console.log('IP Address:', res.result);
        } else {
          console.error('Error getting IP address');
        }
      },
      fail(err) {
        console.error('Cloud function call failed:', err);
      }
    });
    

  },
  HandleSendCash() {
    if (!this.data.u_openid) {
      wx.showToast({
        title: '缺少用户openid',
        icon: 'error',
        duration: 1000
      });
      return;
    }
  
    const { u_openid } = this.data;
    const type = '0';
    const money = '50';

    wx.cloud.callFunction({
      name: 'sendCashReward',
      data: {
        u_openid,
        type,
        money
      },
      success: (res) => {
        console.log('successful call',res.result);
        if(res.result && typeof res.result === 'object' && 'success' in res.result){
          if (res.result.success) {
            wx.showModal({
              title: '恭喜！',
              content: '您的现金红包已发放',
              showCancel: false
            });
          };
        }else{
          console.log('results in failure',res.result);
          wx.showToast({
            title: '请稍后再试',
            icon: 'error',
            duration: 1000
          });
        };
      },
      fail: (err) => {
        wx.showToast({
          title: '请求失败',
          icon: 'error',
          duration: 1000
        });
        console.error('Failed to call cloud function:', err);
      }
    });
  },
  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
  // testApi(){
  //   wx.request({
  //     url:"https://mp001.yaoyaola.net/exapi/check_user/10815051?mp=1&url=/pages/aboutus/aboutus&flag=0",
  //     success(res){
  //       console.log('the res message is', res)
  //     },
  //     fail(err){
  //       console.log(err)
  //     }
  //   })
  // },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setData({
      userInfo : app.globalData.userInfo
    })
    wx.setNavigationBarTitle({
      title: '碳行家｜关于我们'
    })
    // this.testApi()
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