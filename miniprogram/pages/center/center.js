// pages/center/center.ts
import { logEvent } from '../../utils/log';
import * as echarts from "../../asset/ec-canvas/echarts"
import { onHandleSignIn } from '../../utils/login'
import { updateColor } from '../../utils/colorschema'
import {initChart} from '../../utils/chart'
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */

  data: {
    shareFromID:null,
    credit: 0,
    percent : 0,
    background: null,
    ec: {
      onInit: initChart
    },
    userInfo: null,
    openID: '',
    functionList: [{
        functionSrc: '../../asset/img/order_unread.png',
        functionTitle: '低碳问答',
        url: '../journal/journal?typeq=2'
      },
      {
        functionSrc: '../../asset/img/message_unread.png',
        functionTitle: '消息中心',
        url: '../notification/notification'
      },
      {
        functionSrc: '../../asset/img/credits.png',
        functionTitle: '积分好礼',
        url: '../prizeCenter/prizeCenter'
      }
    ],
    CoinRatio: 0,

  },
  updateCredit(){
    const db = wx.cloud.database()
    db.collection('lottery').where({
      _openid : this.data.openID
    }).watch({
      onChange:(snapshot) =>{
        console.log('query result snapshot after the event', snapshot.docs[0])
          this.setData({
            credit : snapshot.docs[0].credit,
            percent: Math.floor(snapshot.docs[0].credit/1.5)
          })
      },
      onError:(err)=>{
        console.log(err)
      }
    })
  },
  // editProfile(){
  //   if (app.globalData.userInfo) {
  //     wx.showModal({
  //       title: '您确认要修改您的个人信息吗？',
  //       content: '点击确定按钮以重新编辑您的个人信息',
  //       success: (res) => {
  //         if(res.confirm) {
  //           wx.navigateTo({
  //             url:'/pages/login/login'
  //           })
  //         }
  //       }
  //     })
  //   }
  // },
  initChart() {
    let chart;
    if (this.randerComponent) {

      this.randerComponent.init((canvas, width, height, dpr) => {
        const getPixelRatio = () => {
          let dpr = 0;
          wx.getSystemInfo({
            success: function (res) {
              dpr = res.pixelRatio
              console.log('dpr =  ', dpr)
            },
            fail: function () {
              dpr = 2
            }
          })
          return dpr
        }

        chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: getPixelRatio(),
        });
        setChartOption(chart);
        this.chart = chart;
        return chart
      })
    }
  },
  dealer() {
    return;
  },


  onTapFunction(e) {
    onHandleSignIn({
      message: '使用此功能需登录',
      success: () => {
        console.log(e)
        console.log(e.currentTarget.dataset)
        let url = e.currentTarget.dataset.url
        let title = e.currentTarget.dataset.title
        if(url!=null & title !=null){
          logEvent(title)
          wx.navigateTo({
            url: url,
          })
        }
        // if (url && title ) {
        //   logEvent(title)
        //   wx.navigateTo({
        //     url,
        //   })
        // }
      }
    })
  },
  setUserinfo() {
    this.setData({
      openID: app.globalData.openID,
    })
    if (app.globalData.userInfo != null) {
      const userInfo = app.globalData.userInfo
      
      console.log('userinfo', userInfo)
      this.setData({
        userInfo: userInfo
      })
      console.log('userinfo updated!!', this.data.userInfo)
      return
    }

  },
  // this function is no longer in use
  onlogin(e) {
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },
  onSurvey(e) {
    logEvent('About Us')
    wx.navigateTo({
      url: '/pages/aboutus/aboutus',
    })
  },
  onPrivacy(e) {
    logEvent('Privacy Statement')
    wx.navigateTo({
      url: '/pages/privacy/privacy',
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  // TODO: idReceiver function, testing..
  // idReceiver(options){
  //   const receiverID = getApp().globalData.openID;
  //   // not authenticated
  //   if(!receiverID){
  //     console.log('no receiver openid')
  //     return;
  //   }
  //   for (var key in options){
  //     key = JSON.parse(key)
  //     wx.showModal({
  //       title: 'data received',
  //       content: key.data
  //     })
  //     const senderID = key.data
  //     //no sender
  //     if(!senderID){
  //       console.log('no sender openid')
  //       return;
  //     }
  //     if(senderID && receiverID){
  //       wx.cloud.callFunction({
  //         name:'netCreate',
  //         data:{
  //           senderID: senderID,
  //           receiverID: receiverID
  //         },
  //         success: function(res){
  //           console.log(res)
  //         },
  //         fail: function(res){
  //           console.log(res)
  //         }
  //       })
  //     }
  //   }
  // },
  onLoad(options) {
    // TODO: id receiver function testing
    // this.idReceiver(options)
    // used to debug: share to time line 
    for (var key in options){
      key = JSON.parse(key);
      if(key.data){
        wx.showModal({
          title: 'success',
          content: key.data,
        })
      }
    }
    wx.showShareMenu({
      withShareTicket:true,
      menus:["shareAppMessage","shareTimeline"]
    })
    
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0,
    })
    this.setUserinfo()
    this.updateCredit()
    this.initChart()
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
    updateColor();
    onHandleSignIn();
    logEvent('Center Page')
    wx.setNavigationBarTitle({
      title: '碳行家｜个人主页'
    })
    this.randerComponent = this.selectComponent('#mychart-dom-area');

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload(){},
  onShareTimeline(){
    logEvent('Share App')
    var query = {
      data: this.data.openID
    };
    query = JSON.stringify(query);

    return{
      title:'省碳领现金，快来试试吧～',
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      query:query,
      success: function(res){
        console.log(res)
      },fail: function (res){console.log(res)}
    }
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */


  // onPullDownRefresh: function () {

  // },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    logEvent('Share App')
    return {
      title: "省碳得现金，就用碳行家~",
      path:"/pages/index/index?id=" + this.data.openID,
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
