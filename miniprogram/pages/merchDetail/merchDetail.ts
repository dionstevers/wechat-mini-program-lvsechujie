import { updateColor } from '../../utils/colorschema'
import { logEvent } from "../../utils/log";
const app = getApp();

Page({
  data: {
    background: null,
    code:null,
    flag: false,
    merch: {
      merch_id: '',
      image: '',
      title: '',
      description: '',
      longDescription: '',
      price: 0
    }
  },
  onLoad(options) {
    const merchId = options.merch_id;
    this.getMerchDetail(merchId);

  },
  getMerchDetail(merchId) {
    const prizes = wx.getStorageSync('prizes');
    const merch = prizes.find(item => item.merch_id == merchId);
    if (merch) {
      this.setData({ merch });
    }
  },
  async getrealtimephonenumber (e) {
    console.log(e.detail.code)  // 动态令牌
    const code = e.detail.code
    if(code){
      this.setData({
        code: code
      })
      this.claimMerch();
    }
    console.log(e.detail.errMsg) // 回调信息（成功失败都会返回）
    console.log(e.detail.errno)  // 错误码（失败时返回）
    wx.cloud.callFunction({
      name:'getphoneno',
      data:{
        code:e.detail.code
      },
      success: function(res){
        console.log(res)
        // wx.showToast({
        //   title:'授权成功',
        //   icon:'success'
        // })
      },
      fail:function(res){
        console.log(res)
      }
    })
  },
  async claimMerch() {
    const app = getApp();
    const openid = app.globalData.openID;
    const price = this.data.merch.price;
    const merch_id = this.data.merch.merch_id;
    const merch_name = this.data.merch.title;
    if(this.data.code){ 
      wx.showModal({
      title:'请您确认' ,
      content: '以 ' + price + ' 积分兑换 ' + merch_name + '?',
      success(res){
        if(res.confirm){
          wx.cloud.callFunction({
            name: 'claimMerch',
            data: {
              openid,
              merch_id,
              price,
              merch_name
            },
            success: res => {
              if (res.result !== undefined ) {
                console.log('the console message', res)
                wx.showModal({
                  title: '兑换成功',
                  content: '请于我的奖品页查看并兑奖',
                  showCancel:false
                })
              } else {
                wx.showToast({
                  title:'请稍后再试',
                  icon: 'error',
                  duration:2000
                })
              }
            },
            fail: err => {
              console.error('Error calling cloud function:', err);
              wx.showToast({
                title: '请稍后再试',
                icon: 'error',
                duration: 2000,
              });
            }
          });
        }
      }
    })}else{
      wx.showModal({
        title: '授权失败',
        content:'请返回并再次点击兑换并授权手机号'
      })
    }
  },
  
  onShow() {
    // 更新颜色
    updateColor();
  },

  onShareAppMessage() {
    logEvent("Share App")
    return {
      title: "快来一起低碳出街~",
      path:`/pages/index/index?sharedFromID=${app.globalData.openID}`,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  }
  
});
