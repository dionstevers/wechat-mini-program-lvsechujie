// pages/index/index.ts
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
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady(){

  },
  HandleSignUp() {
    const db = wx.cloud.database()
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        this.setData({
          openID:res.result.data._openid
        })
        app.globalData.openID = res.result.data._openid
        db.collection('userInfo').where({
          _openid : this.data.openID
        }).get({
          success: function(res) {
            console.log('userinfo for gloabl data',res.data[0])
            if(res.data.length==1){
              app.globalData.userInfo = res.data[0]
              wx.showModal({
                title:'您已有账号',
                content:'请直接点击登录按钮登录'
              })
            }else{
              wx.navigateTo({
                url:'/pages/login/login'
              })
            }
          },
          fail: err => {
            console.error( 'login function call failed:', err);
            // Handle the error here.
          }   
        })
      },
      fail: err => {
        console.error( 'login function call failed:', err);
        // Handle the error here.
      }
    })
  },
  HandleSignIn() {
    const db = wx.cloud.database()
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        this.setData({
          openID:res.result.data._openid
        })
        console.log(this.data.openID)
        db.collection('userInfo').where({
          _openid : this.data.openID
        }).get({
          success: function(res) {
            console.log('userinfo for gloabl data',res.data[0])
            if(res.data.length==1){
              app.globalData.userInfo = res.data[0]
              wx.showToast({
                title:'正在登录中',
                icon:'loading',
                duration:1500
              })
              setTimeout(() => {
                  wx.reLaunch({
                    url : '/pages/center/center'
                  })
              }, 1500);
              
            }else{
              wx.showModal({
                title: '您尚未注册',
                content: '请点击下方注册按钮注册',
                success(res){
                  if(res.confirm){
                    console.log('confirm')
                  }
                }
              })
            }
          },
          fail: err => {
            console.error( 'login function call failed:', err);
            // Handle the error here.
          }   
        })
      },
      fail: err => {
        console.error( 'login function call failed:', err);
        // Handle the error here.
      }
    })
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

  }
})