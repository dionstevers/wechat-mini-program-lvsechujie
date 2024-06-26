
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
    const u_openid = options.u_openid
    const price = this.data.merch.price;
    if(u_openid){
      const type = '0';
      const money = price 
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
              if(res.result.data.errmsg ==='发放成功'){
                wx.showModal({
                  title: '恭喜！',
                  content: '您的现金红包已发放',
                  showCancel: false,
                  success:(res)=>{
                    if(res.confirm){
                      wx.navigateTo({
                        url:'/pages/prizeCenter/prizeCenter'
                      })
                    }
                  }
                });
              }else{
                wx.showModal({
                  title: '测试错误',
                  content: res.result.data.errmsg,
                  showCancel: false,
                  success:(res)=>{
                    if(res.confirm){
                      wx.navigateTo({
                        url:'/pages/prizeCenter/prizeCenter'
                      })
                    }
                  }
                });
              }
              
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
    }
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
    // TODO : this is just for testing, NO CHECKING CREDIT IMPLEMENTED SO FAR
    if(merch_name!=='现金红包'){ 
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
      wx.navigateTo({
        url: `/pages/test/test?merch_id=${merch_id}`
      })
    }


    
  }
  
  
});
