// pages/information/information.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:'',
    testGroup:0,
    articleList: [
      {
        title: '光华管理学院院长刘俏：碳中和将是一个新的文明形态的变化',
        abstract: '4月20日上午，博鳌亚洲论坛2022年年会举办《碳中和：企业在行动》分论坛。光华管理学院院长刘俏在发言中表示，碳中和不是一个单纯的技术问题...',
        date: 'Jan 02 2022',
        author: '博鳌论坛',
        imgUrl:'https://img.in-en.com/upload/202204/25/10204723236084.png',
        url:'https://news.caijingmobile.com/article/detail/458491?source_id=40'
      },
      {
        title: '联合国环境报告：污染致死人数超过新冠，需立即采取行动',
        abstract: '2月15日发布的一份联合国环境报告称，各国和企业造成的污染导致的死亡人数超过新冠疫情，呼吁“立即采取雄心勃勃的行动”来禁止一些有毒化学品。',
        date: 'Feb 02 2022',
        author: '澎湃新闻',
        imgUrl:'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fnimg.ws.126.net%2F%3Furl%3Dhttp%253A%252F%252Fdingyue.ws.126.net%252F2022%252F0411%252Fc98cc54ej00ra6fob004pc000ug00jxm.jpg%26thumbnail%3D660x2147483647%26quality%3D80%26type%3Djpg&refer=http%3A%2F%2Fnimg.ws.126.net&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1653471125&t=13cc4a3272893e400a4795ea524f838a',
        url:'https://m.gmw.cn/baijia/2022-02/17/1302807740.html'
      },
      {
        title: '每年杀死数十亿只鸟，玻璃窗也是个超级鸟类杀手',
        abstract: '因为撞击玻璃窗而导致的鸟类死亡，已经成为仅次于家猫扑杀之外，造成鸟类死亡数量最多的人类影响。',
        date: 'Apr 02 2022',
        author: '新浪科技',
        imgUrl:'https://n.sinaimg.cn/tech/crawl/350/w550h600/20220419/c5bc-91a1d2eb524561e2ec5ccecb28c239ad.jpg',
        url:'https://view.inews.qq.com/a/20220423A03UKE00'
      },
      {
        title: '世卫警告空气污染危害比想象更危险，每年七百万人死于相关疾病',
        abstract: '世界卫生组织警告称，空气污染比想象中更危险。据世卫估计，每年有700万人死于与空气污染有关的疾病。',
        date: 'Apr 13 2021',
        author: '澎湃新闻',
        imgUrl:'https://nimg.ws.126.net/?url=http%3A%2F%2Fdingyue.ws.126.net%2F2022%2F0425%2Fa84a175dj00ravonr00cgc0018g00p0g.jpg&thumbnail=660x2147483647&quality=80&type=jpg',
        url:'https://m.thepaper.cn/newsDetail_forward_14657308'
      }
    ]
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