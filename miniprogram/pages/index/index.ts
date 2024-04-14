// pages/index/index.ts
export{}
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */

  data: {
    userInfo: [],
    openID: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  
  async onLoad(options) {
      console.log('the openid of the one who shared is ', options.id)
      const db = wx.cloud.database()
      try{
        const res = await wx.cloud.callFunction({ name: 'login' });
        this.setData({ openID: (res.result as {data?:any}).data._openid });
        app.globalData.openID = (res.result as {data?:any}).data._openid;
        const userInfoQuery = await db.collection('userInfo')
          .where({ _openid: this.data.openID })
          .get();
        if (userInfoQuery.data.length === 1) {
          app.globalData.userInfo = userInfoQuery.data[0];
          wx.showToast({ 
          title:'正在登录中',
          icon:'loading',
          duration:1500 });
          setTimeout(() => {
            wx.switchTab({
              url : '/pages/center/center'
            })
        }, 1500);
        }}catch(err){
        console.log(err)
      }
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady(){

  },

  async HandleSignUp() {
    const db = wx.cloud.database()
    try{
      const res = await wx.cloud.callFunction({ name: 'login' });
      this.setData({ openID: (res.result as {data?:any}).data._openid });
      app.globalData.openID = (res.result as {data?:any}).data._openid;
      const userInfoQuery = await db.collection('userInfo')
      .where({ _openid: this.data.openID })
      .get();
      if (userInfoQuery.data.length === 1) {
        app.globalData.userInfo = userInfoQuery.data[0];
        wx.showModal({ title: '您已有账号',content:'请直接点击登录按钮登录' , showCancel:false});
      }else{
        wx.navigateTo({
          url:'/pages/login/login'
        })
      }

    }catch(err){
      console.log(err)
    }
  },
 async HandleSignIn() {
    const db = wx.cloud.database()
    try{
      const res = await wx.cloud.callFunction({ name: 'login' });
      this.setData({ openID: (res.result as {data?:any}).data._openid });
      app.globalData.openID = (res.result as {data?:any}).data._openid;
      const userInfoQuery = await db.collection('userInfo')
        .where({ _openid: this.data.openID })
        .get();
      if (userInfoQuery.data.length === 1) {
        app.globalData.userInfo = userInfoQuery.data[0];
        wx.showToast({ 
        title:'正在登录中',
        icon:'loading',
        duration:1500 });
        setTimeout(() => {
          wx.switchTab({
            url : '/pages/center/center'
          })
      }, 1500);
      }else{
        wx.showModal({
          title: '您尚未注册',
          content: '请点击下方注册按钮注册',
          showCancel: false
        })
      }
    }catch(err){
      console.log(err)
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },
  
  onShareTimeline(){
    return {
      title:"快来一起低碳出街",
      query:this.data.openID,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313"
    }
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