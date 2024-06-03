import { SceneDefaultComponents } from "XrFrame/elements";
import { CREATE_INSTANCE } from "XrFrame/kanata/lib/kanata";
import { logEvent } from "../../utils/log";

Page({
  data: {
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
  async claimMerch() {
    const app = getApp();
    const openid = app.globalData.openID;
    const price = this.data.merch.price;
    const merch_id = this.data.merch.merch_id;
    const merch_name = this.data.merch.title;
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
    })

    
  }
  
  
});
