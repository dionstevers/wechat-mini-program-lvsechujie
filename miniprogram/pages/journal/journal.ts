import { createNativeULUMap } from "XrFrame/kanata/lib/index";

const app = getApp()

// pages/journal/journal.ts

Page({

  /**
   * 页面的初始数据
   */
  data: {
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    forminfo: '',
    openID: '',
    userInfo: null,
    status: null,
    questions1: [
      { id: 1, value: "未使用一次性制品" },
      { id: 2, value: "乘坐公共交通或骑自行车出行" },


      { id: 3, value: "主动进行垃圾分类" },
      { id: 4, value: "进行了随手环保行动" },


    ],
    questions2: [
      { id: 5, value: "用餐时践行光盘行动" },
      { id: 6, value: "未大量摄入高碳水食物" }
    ],
    questions3: [
      { id: 7, value: "今日践行了低碳生活" }
    ],

  },
  formSubmit: function (e: { detail: { value: any; }; }) {
    //const list = wx.getStorageSync('list')
    wx.disableAlertBeforeUnload()

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var dates = date.getDate();

    var time = year + "-" + month + "-" + dates
    const data = 

    // 提交低碳日记-->credit+20
    this.setData({
      forminfo: e.detail.value
    })
    const db = wx.cloud.database();
    const _ = db.command;
    var _this = this
    const testGroup = _this.data.userInfo.testGroup
    var num = 0
    // 空白组和蚂蚁森林组每次完成问卷不加分，xuexi组每次完成问卷加10分，一天最多可以完成三次问卷
    if(testGroup ==0 && testGroup ==1){num = 0}
    if(testGroup ==2){num = 10}
    db.collection('userInfo').doc(_this.data.userInfo._id).update({
        data: {
          credit: _.inc(num),
          loginlist: _.push([[time,_this.data.userInfo.loginlist.length+1]])
        }
      })
    // 将form数据写入数据库
    db.collection('formdata').add({
      data: {
        time: time,
        form: e.detail.value,
      }
    })

    // 将目前时间写入缓存，用来比对
    //wx.setStorageSync("Time", time)

    // 提交后禁用按钮
    this.setData({
      status: 'true'

    })

    wx.showToast({
      title: "提交成功",
      icon: "success",
      duration: 2000,
      mask: true,
      success: function () {
        setTimeout(function () {
          wx.navigateBack({
            delta: 1
          })
        }, 1500)
      }
    })
  },

  getUserInfo() {
    //const data = wx.getStorageSync('userInfo');
    const db = wx.cloud.database();
    const _ = db.command;
    let _this = this;
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var dates = date.getDate();

    var today = year + "-" + month + "-" + dates;

    // wx.cloud.callFunction({
    //   name: 'login',
    //   success: res => {
    //     _this.setData({
    //       openID: res.result.data._openid,
    //     })
    //     console.log('openID:', _this.data.openID)
    //     db.collection('userInfo').where({
    //       _openid: _this.data.openID,
    //     }).get({
    //         success: function (res) {
    //           console.log(_this.data.userInfo)
    //           console.log(res.data)
    //           if (res.data.length == 1) {
    //             _this.setData({
    //               userInfo: res.data[0],
    //             })
    //             console.log(_this.data.userInfo)
    //           }
    //         }
    //       })
    //       db.collection('formdata').where({
    //         _openid: _this.data.openID,
    //         time: today
    //       }).get({
    //           success: function (res) {
    //             console.log('Length:',res.data.length)
    //             if(res.data.length > 0){
    //               _this.setData({
    //                 status: "true"
    //               })
    //             }
    //             else{
    //               _this.setData({
    //                 status: null
    //               })
    //             }
    //           }
    //         })
    //   }
    // })
  },
  tabchange(){
    console.log("working" , this.data.userInfo.testGroup)
    
    var _this = this
    if (_this.data.userInfo.testGroup == 2) {
      _this.setData({
        background: 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
      })
  
      wx.setNavigationBarColor({
    
        backgroundColor: "#D13A29",
        frontColor: '#ffffff',
      })

    }
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    
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
    this.setData({
      userInfo: app.globalData.userInfo
    })
    this.tabchange()
    
    this.setData({
      userInfo: app.globalData.userInfo
    })
    if (this.data.userInfo.testGroup == 0 || this.data.userInfo.testGroup == 1 ) {
      wx.setNavigationBarTitle({
        title: '碳行家｜低碳日记'
      })
    }
   if(this.data.userInfo.testGroup == 2){
    wx.setNavigationBarTitle({
      title: '碳行家｜文章答题'
    })
    wx.enableAlertBeforeUnload(
      {
      message: '答题未完成将导致扣分，请确认是否退出',
      success:function(res){
        console.log('成功调用',res)
      },
      fail: function (err){
        console.log('调用失败',err)
      }
      
    })
   }
    
  
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
    
    if(this.data.status== null && this.data.userInfo.testGroup == 2){
      const db = wx.cloud.database();
      const _ = db.command;
      db.collection('userInfo').doc(this.data.userInfo._id).update({
        data:{
          credit: _.inc(-10)
      }
    })
    }

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