
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

  },
  dailyOrderid(){
    const date = new Date();
    const orderid = date.getDate()+'-'+date.getDay()+'-'+date.getFullYear()+'-'+getApp().globalData.openID;
    return orderid;
  },

  HandleSendCash(){
    if(this.data.u_openid == ''){
      return;
    }
    const u_openid = this.data.u_openid;
    const uid = '10815051';
    const orderid = this.dailyOrderid();
    const type = '0';
    const money = '50';
    let reqtick = Date.parse(new Date().toString());
    reqtick = reqtick/1000;
    const openid = u_openid;
    const apikey = 'carbclever';
    const sig = hexMD5(uid + type + orderid + money + reqtick + openid + apikey);
    wx.request({
      url: 'https://mp001.yaoyaola.net/exapi/SendRedPackToOpenid?uid='+uid+'&type='+type+'&orderid='+orderid+'&money='+money+'&reqtick='+reqtick+'&openid='+openid+'&sign='+sig+'&title=现金发奖' + '&sendname=碳行家&wishing=心想事成',
      success(res){
        console.log('response from server',res)
        wx.showModal({
          title:'恭喜！',
          content:'您的现金红包已发放',
          showCancel:false
        })
      },
      fail(res){
        console.log('response not found',res)
        wx.showToast({
          title:'请稍后再试',
          icon:'error',
          duration:1000
        })
      }
    })
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
    this.dailyOrderid();
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