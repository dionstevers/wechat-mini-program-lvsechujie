const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    
    testGroup: null,
    userInfo:app.globalData.userInfo,
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    arlist: [],
    imgSrc:''
  }, 

  async getArticles(){
    // this should be un-commented once we begin experiment
    // const currentTime = new Date()
    // static time for now 
    const currentTime = new Date("Tue Oct 12 2023 10:00:00 GMT-0400")
    currentTime.setHours(0,0,0,0)
    console.log(
      'current time: ', currentTime
    )
    const db = wx.cloud.database()
    const _ = db.command
    const userInfo = this.data.userInfo
    const testGroup = userInfo.testGroup
    try{
      if(testGroup == 1){
        console.log('blank control')
        return
      }
      //  antForest
      if(testGroup == 2 || testGroup ==3 || testGroup == 4){
        const res = await db.collection('articles').where({
          uploadTime: _.lt(currentTime),
          author: '低碳我知道'
        }).limit(3).orderBy('uploadTime', 'desc').get()
        var list = res.data
        const arlist = this.TimeConvert(list)
        this.setData({
          arlist: arlist,
          imgSrc:'https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/groups/29391697426089_.pic.jpg?sign=8bf9e57267ca14df4fb5365586876cbc&t=1697468352'
        })
      }
      // xuexi
      if(testGroup == 5){
        const res  = await db.collection('articles').where({
          uploadTime: _.lt(currentTime),
          author:'低碳强国'
        }).orderBy('uploadTime', 'desc').limit(3).get()
        var list = res.data
        const arlist = this.TimeConvert(list)
        this.setData({
          arlist: arlist,
          imgSrc:'https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/groups/29341697425796_.pic.jpg?sign=e7ff04ac24e44232e2fc33522d3727af&t=1697435214'
        })
      }
    }catch(err){
     console.log("error msg: ", err)
    }
  },
  bindInfo(e){
    console.log(e.currentTarget.dataset.link)
    const link = e.currentTarget.dataset.link
    
    wx.navigateTo({
      url:'/pages/detail/detail?link=' + link
    })
  },
  TimeConvert(list){
    
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      const date = new Date(element.uploadTime);
      const formattedDate= date.toISOString().split("T")[0];
      element.date = formattedDate
    }
    return list
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo,
      testGroup :app.globalData.userInfo.testGroup
    })
    if(this.data.testGroup == 5 ){
      wx.setNavigationBarColor({
        backgroundColor: "#D13A29",
        frontColor: '#ffffff',
      })
      this.setData({
        background: 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
      })
    }
    this.getArticles()
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