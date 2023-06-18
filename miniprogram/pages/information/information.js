// pages/information/information.ts
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:null,
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    arlist: [],

  }, 
  tabchange(){
    console.log("working" , this.data.userInfo.testGroup)
    
    var _this = this
    if (_this.data.userInfo.testGroup == 2) {
      _this.setData({
        background: 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
      })
      wx.setTabBarStyle({
        color: '#ffffff',
        selectedColor: '#ffffff',
        backgroundColor: '#D13A29',
        borderStyle: 'white'
      })
      
      wx.setNavigationBarColor({
    
        backgroundColor: "#D13A29",
        frontColor: '#ffffff',
      })
    }
  },
  bindInfo(e){
    console.log(e.currentTarget.dataset.link)
    const link = e.currentTarget.dataset.link
    
    wx.navigateTo({
      url:'/pages/detail/detail',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function(data) {
          console.log(data)
        },
      },
      success: function(res) {
        // 通过 eventChannel 向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: link })
      }
    })
  },

  getArticles(){
    if (this.data.userInfo.testGroup == 0) {
      return;
    }
    var _this = this
    const group = ['nothing','AntForest','Xiticle']
    
    const _date = new Date()
    _date.setHours(0,0,0,0)
    
    console.log(_date.valueOf())
     
    const db = wx.cloud.database()
    const _ = db.command
    //test code below , delete when database is updated
    _date.setDate(_date.getDate())
    //test code above, delete when database is updated 
    db.collection(group[this.data.userInfo.testGroup]).limit(3).get({
      success:function(res){
        console.log('this is the data',res.data)
        
        _this.TimeConvert(res.data)
        _this.setData({
          arlist:res.data.reverse()
        })
        
        console.log('done')
      }
    })


  },
  TimeConvert(list){
    
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      const timestamp = element.date;
      const date = new Date(timestamp);
      const formattedDate= date.toISOString().split("T")[0];
      console.log(formattedDate);
      element.date = formattedDate
    }
    console.log("successfully converted")
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // this.getUserInfo()
    
    
  
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
    wx.setNavigationBarTitle({
      title: '碳行家｜环境资讯'
    })
    this.setData({
      userInfo: app.globalData.userInfo
    })
    this.tabchange()
    this.getArticles()
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
    console.log("refreshing")
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