// pages/information/information.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:null,
    testGroup:0,
    arlist: [],
  },
  bindInfo(e){
    console.log(e.currentTarget.dataset.title)
    const link = e.currentTarget.dataset.title
    // console.log(link)
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
 
  getGroup(){
    return this.data.testGroup

  },
  async getArticles(num){
    var _this = this
    const group = ['social_based_article','policy_based_article-copy','knowledge_based_article']
    
    const _date = new Date()
    _date.setHours(0,0,0,0)
    
    console.log(_date.valueOf())
     
    const db = wx.cloud.database()
    const _ = db.command
    //test code below , delete when database is updated
    _date.setDate(_date.getDate()+1)
    //test code above, delete when database is updated 
    db.collection(group[num]).limit(3).where({
      date: _.lte(_date.valueOf())
    }).get({
      success:function(res){
        console.log('yes')
        console.log(res.data)
        
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
  getUserInfo() {
    
    const db = wx.cloud.database();
    const _ = db.command;
    let _this = this;
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        _this.setData({
          openID: res.result.data._openid,
        })
        console.log('openID:', _this.data.openID)
        db.collection('userInfo').where({
          _openid: _this.data.openID,
        }).get({
            success: function (res) {
              console.log(_this.data.userInfo)
              console.log(res.data)
              if (res.data.length == 1) {
                _this.setData({
                  userInfo: res.data[0],
                  testGroup: res.data[0].testGroup
                })
                _this.getArticles(res.data[0].testGroup)
                console.log(_this.data.userInfo)
                
              }
            }
          })
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.getUserInfo()
  
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