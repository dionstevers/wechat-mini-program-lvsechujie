// pages/index/index.ts
export{}
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: [],
    openID: '',
  },

  /**
   * 页面实例数据
   */
  isFetchingUserInfo: false,
  isNavigating: false,

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // share app message
      console.log('the openid of the one who shared is ', options.id)
      const sharedFromid = options.id
      const db = wx.cloud.database()

      try{
        const res = await wx.cloud.callFunction({ name: 'login' });
        this.setData({ openID: (res.result as {data?:any}).data._openid });
        app.globalData.openID = (res.result as {data?:any}).data._openid;
        const openid = (res.result as {data?:any}).data._openid;
        
        // now include sharedFromid upload
        if(sharedFromid==null){
          console.log('no share user')
          return;
        }
        // check if the sharedFromid is null
        if(sharedFromid!=null){
          await this.recordShare(openid, sharedFromid);
        }
          // If the sender document does not exist, create it


        
      }catch(err){
        console.log(err)
      } 
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady(){
    this.isFetchingUserInfo = true;
    this.onHandleSignIn(true);
  },
  // record share relations
  async recordShare(openid, sharedFromid) {
    const db = wx.cloud.database();
  
    try {
      const receiverDoc = await db.collection('shareNet').doc(openid).get();
      const senderDoc = await db.collection('shareNet').doc(sharedFromid).get();
  
      // If the receiver document does not exist, create it
      if (receiverDoc.data.length === 0) {
        await db.collection('shareNet').add({
          data: {
            _id: openid,
            sharedFromid: [sharedFromid],
            shareToid: []
          }
        });
      } else {
        // If the receiver document exists, update it
        await db.collection('shareNet').doc(openid).update({
          data: {
            sharedFromid: db.command.addToSet(sharedFromid)
          }
        });
      }
  
      // If the sender document does not exist, create it
      if (senderDoc.data.length === 0) {
        await db.collection('shareNet').add({
          data: {
            _id: sharedFromid,
            sharedFromid: [],
            shareToid: [openid]
          }
        });
      } else {
        // If the sender document exists, update it
        await db.collection('shareNet').doc(sharedFromid).update({
          data: {
            shareToid: db.command.addToSet(openid)
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  },
  
  // 注册
  HandleSignUp(){
    if (!this.isFetchingUserInfo && !this.isNavigating) {
      this.isFetchingUserInfo = true;
      this.onHandleSignUp();
    }
  },
  
  // 注册-抓取
  async onHandleSignUp() {
    const db = wx.cloud.database();
    try {
      const res = await wx.cloud.callFunction({ name: 'login' });
      const openID = (res.result as { data?: any }).data._openid;
      this.setData({ openID });
      getApp().globalData.openID = openID;

      const userInfoQuery = await db.collection('userInfo')
        .where({ _openid: openID })
        .get();

      if (userInfoQuery.data.length === 1) {
        getApp().globalData.userInfo = userInfoQuery.data[0];
        wx.showModal({
          title: '您已有账号',
          content: '请直接点击登录按钮登录',
          showCancel: false,
        });
      } else {
        this.isNavigating = true;
        wx.navigateTo({
          url: '/pages/login/login',
          complete: () => this.isNavigating = false
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      this.isFetchingUserInfo = false;
    }
  },

  // 登录
  HandleSignIn(){
    if (!this.isFetchingUserInfo && !this.isNavigating) {
      this.isFetchingUserInfo = true;
      this.onHandleSignIn(false);
    }
  },

  // 登录-抓取
  async onHandleSignIn(autoLogin: boolean) {
    const db = wx.cloud.database();
    try {
      const res = await wx.cloud.callFunction({ name: 'login' });
      const openID = (res.result as { data?: any }).data._openid;
      this.setData({ openID });
      getApp().globalData.openID = openID;

      const userInfoQuery = await db.collection('userInfo')
        .where({ _openid: openID })
        .get();
        
      if (userInfoQuery.data.length === 1) {
        app.globalData.userInfo = userInfoQuery.data[0];
        this.isNavigating = true;
        wx.showToast({ 
        title:'正在登录中',
        icon:'loading',
        duration:1500 });
        setTimeout(() => {
          wx.switchTab({
            url : '/pages/center/center',
            complete: () => this.isNavigating = false
          })
        }, 1500);
      } else if (!autoLogin) {
        wx.showModal({
          title: '您尚未注册',
          content: '请点击下方注册按钮注册',
          showCancel: false
        })
      }
    } catch(err) {
      console.log(err)
    } finally {
      this.isFetchingUserInfo = false;
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('index page showing up')
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
    return {
      title: "快来一起低碳出街~",
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