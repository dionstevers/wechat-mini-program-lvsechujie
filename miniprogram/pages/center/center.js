// pages/center/center.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    functionList: [{
        functionSrc: '../../asset/img/note.png',
        functionTitle: '低碳日记',
        url: '../journal/journal'
      },
      {
        functionSrc: '../../asset/img/history.png',
        functionTitle: '出行历史',
        url: '../triphistory/triphistory'
      },
      {
        functionSrc: '../../asset/img/exchange.png',
        functionTitle: '积分中心',
        url: '../store/store'
      }
    ],
    CoinRatio: 0
  },

  onTapFunction(e) {
    let {
      url
    } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({
        url,
      })
    }

  },

  // 用户注册
  async login() {
    const {
      userInfo
    } = await wx.getUserProfile({
      desc: '用于完善用户信息',
    })
    console.log(userInfo)
    var _this = this
    wx.cloud.callFunction({
      name: 'login',
      data: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
      },
      success: res => {
        _this.setData({
          userInfo: res.result.data
        })
      
      wx.setStorageSync('userInfo', res.result.data)

      }
    })
  },
  // 已注册用户登录
  async getUserInfo(){
    const data = wx.getStorageSync('userInfo')
    if (data){
       
      const userInfo = await wx.cloud.database().collection('userInfo').doc(data._id).get()
      this.setData({
        userInfo: userInfo.data
      })
      console.log(userInfo)
    }
    
  },

  onSurvey(e) {
    wx.navigateTo({
      url: '/pages/survey/survey',
    })

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
    this.getUserInfo()
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