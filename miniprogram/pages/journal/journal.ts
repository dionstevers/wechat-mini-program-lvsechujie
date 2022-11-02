// pages/journal/journal.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    forminfo :'',
    userInfo: '',
    status:'',
    questions1:[
      {id:1,value:"未使用一次性制品"},
      {id:2,value:"乘坐公共交通或骑自行车出行"},
      
      
      {id:3,value:"主动进行垃圾分类"},
      {id:4,value:"进行了随手环保行动"},
      
    
    ],
    questions2:[
      {id:5,value:"用餐时践行光盘行动"},
      {id:6,value:"未大量摄入高碳水食物"}
    ],
    questions3:[
      {id:7,value:"今日践行了低碳生活"}
    ],
    checkSubmit:''
  },
  formSubmit: function(e: { detail: { value: any; }; }){
     
    const data = wx.getStorageSync('userInfo')
    
    // 提交低碳日记-->credit+20
    this.setData({
      forminfo:e.detail.value
    })
    const db  = wx.cloud.database();
    const _ = db.command;
    db.collection('userInfo').doc(data._id).update({
      data:{
        credit:_.inc(20)
      }
    })
    
    // 将form数据写入数据库
    db.collection('formdata').add({
      data:{
        time:  Date(),
        form: e.detail.value,
      }
    })
    // 将目前时间写入缓存，用来比对
    wx.setStorageSync("Time",Date()) 
    wx.setStorageSync("formData",e.detail.value)
    // 提交后禁用按钮
    this.setData({
      status:'true'
    })
  },
  checkSubmit(){
    var cur = wx.getStorageSync('Time');
    
    
    var month = cur.split(' ')[1];
    var date = cur.split(' ')[2];
    var year = cur.split(' ')[3];
    var now = Date();
    var now_month = now.split(' ')[1];
    var now_date = now.split(' ')[2];
    var now_year = now.split(' ')[3];
    if(month==now_month&&date==now_date&&year==now_year){
      this.setData({
        status:"false"
      })
    }else{
      this.setData({
        status:""
      })
    }
  },
  getUserInfo(){
    this.setData({
      userInfo: wx.getStorageSync('userInfo')
    })
  },
   
   
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.setNavigationBarTitle({
      title: '低碳日记'
    })
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
      this.checkSubmit()
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