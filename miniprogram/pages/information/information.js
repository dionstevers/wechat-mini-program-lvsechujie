// pages/information/information.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:null,
    testGroup:0,
    arlist: [],
    // articleList: [
  
    //   {
    //     title: '每年杀死数十亿只鸟，玻璃窗也是个超级鸟类杀手',
    //     abstract: '因为撞击玻璃窗而导致的鸟类死亡，已经成为仅次于家猫扑杀之外，造成鸟类死亡数量最多的人类影响。',
    //     date: 'Apr 02 2022',
    //     author: '新浪科技',
    //     imgUrl:'https://n.sinaimg.cn/tech/crawl/350/w550h600/20220419/c5bc-91a1d2eb524561e2ec5ccecb28c239ad.jpg',
    //     url:'https://view.inews.qq.com/a/20220423A03UKE00'
    //   },
     
    // ]
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
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()+1
    const day = date.getDate()
    const curDate = year+'-'+month+'-'+day
    console.log(curDate)
     
    const db = wx.cloud.database()
    const _ = db.command
    
    db.collection(group[num]).limit(3).get({
      success: function(res){
        console.log('success')
         
        _this.setData({
          arlist : res.data
        })
        console.log(_this.data.arlist)
        console.log('done')
      }
    })
   
    

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