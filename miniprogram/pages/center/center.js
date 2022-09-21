// pages/center/center.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    functionList:[
      {
        functionSrc:'../../asset/img/note.png',
        functionTitle:'低碳日记',
        url:'../journal/journal'
      },
      {
        functionSrc:'../../asset/img/history.png',
        functionTitle:'出行历史'
      },
      {
        functionSrc:'../../asset/img/exchange.png',
        functionTitle:'兑换'
      }
    ]
  },

  onTapFunction(e){
    let {url} = e.currentTarget.dataset
    if(url){
      wx.navigateTo({
        url,
      })
    }

  },

  onSurvey(e){
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