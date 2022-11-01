// pages/journal/journal.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    forminfo :'',
    userInfo: '',
    
    questions:[
      {id:1,value:"未使用一次性餐具",isdisabled:''},
      {id:2,value:"乘坐公共交通或骑自行车出行",isdisabled:''}
      
    ]
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
    
 
  
     
  },
  checkSubmit(){},
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