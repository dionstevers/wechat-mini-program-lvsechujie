import { updateColor } from '../../utils/colorschema'
import {logEvent} from '../../utils/log'
const app = getApp()

Page({
  data: {
    credits: 0,
    prizes:[],
    prizeList:[],
    claimedprizes:[],
    background: null
  },
  onLoad(){
    this.getLotteryInfo()
    this.getMerchData()
  },
  onShow(){
    // 更新颜色
    updateColor();
    
    this.getLotteryInfo()
  },
  navigateToLottery: function() {
    // Add your navigation logic here
    wx.navigateTo({
      url: '/pages/store/store'
    });
  },
  async getMerchData() {
    try {
      const db = wx.cloud.database();
      let res = (await db.collection('merch').get());
      console.log(res)
      // Map data excluding quantity
      const prizes = res.data.filter(item=>{return item?.attribute!=='lottery'}).map(item => ({
        merch_id: item.merch_id,
        image: item.image_url,
        title: item.title,
        description: item.descp_short,
        longDescription: item.descp_full,
        price: item.price
      }));
      // set local storage
      wx.setStorageSync('prizes', prizes);
      // Update local state
      this.setData({ prizes });
    } catch (err) {
      console.log(err);
    }
  },
  navigateToMerchs: function(e){ 
    const merchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/merchDetail/merchDetail?merch_id=${merchId}`
    });
    console.log(merchId);
  },
  navigateToPrizes: function() {
    var prizelist = JSON.stringify(this.data.prizeList);
    var claimedprizes = JSON.stringify(this.data.claimedprizes);
    // Add your navigation logic here
    wx.navigateTo({
      url: "/pages/myprize/myprize?prizelist=" + prizelist + "&claimedprizes=" + claimedprizes
    });
  },
  async getLotteryInfo() {
    wx.showToast({
      title: "数据更新中",
      icon: "loading",
      mask: true,
      duration: 10000
    });
    const db = wx.cloud.database();
    console.log('the openid is ', app.globalData.openID)
    try {
      db.collection("lottery")
        .where({
          _openid: app.globalData.openID
        })
        .watch({
          onChange: snapshot => {
            console.log("docs's changed events", snapshot.docChanges[0]);
            console.log("query result snapshot after the event", snapshot.docs[0]);
            this.setData({
              credits: snapshot.docs[0].credit,
              _id: snapshot.docs[0]._id,
              attempts: snapshot.docs[0].attempts,
              prizeList: snapshot.docs[0].prizes,
              claimedprizes: snapshot.docs[0].claimedprizes
            });
            wx.hideToast();
          },
          onError: err => {
            console.log(err);
          }
        });

    } catch (err) {
      console.log(err);
    }
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
