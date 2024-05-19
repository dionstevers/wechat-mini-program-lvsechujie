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
          // get the entry
          const userDoc = await db.collection('shareNet').where({
            _id: openid
          }).get();

          // check if the entry exists
          if(userDoc.data.length>0){
            await db.collection('shareNet').doc(openid).update({
              data: {
                sharedFromid: db.command.addToSet(sharedFromid) // Add to the array if not already present
              }
            });
          }else{//if the entry does not exist, then create it
            await db.collection('shareNet').add({
              data: {
                _id: openid, // Use openid as the document id
                sharedFromid: [sharedFromid],
              }
            });
          }
        }
      }catch(err){
        console.log(err)
      }
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */

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
          url:'/pages/information/information'
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