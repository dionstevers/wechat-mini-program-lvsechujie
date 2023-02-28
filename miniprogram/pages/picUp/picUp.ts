// pages/picUp/picUp.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    index:0,
    funclist:["随手拍","拍油耗"],
    picpath:'',


  },
  bindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value,
    })
  },
  chooseImage:function(e){
    var _this = this
    
    wx.chooseMedia({
      mediaType:['image'],
      sourceType:['album','camera'],
      camera:'back',
      count:1,
      success:function(res){
        let path = res.tempFiles[0].tempFilePath
        console.log(path)
        _this.setData({
          picpath:path
        })

      }
    })
    console.log(e)
  },
  uploadImage:function(e){
    console.log(e)
    var _this = this
    if(_this.data.picpath==''){
      wx.showToast({
        title:'未选择图片',
        icon:'error',
        duration:1500,
        mask:true
      })
      return;
    }
    _this.popup = _this.selectComponent("#popup1");
    _this.popup2 = _this.selectComponent("popup2")
    _this.popup.showPopup()
  },
  _error(){
    console.log("取消")
    this.popup.hidePopup()
  
  },
  _success(){
    console.log("确定")
    
    this.popup.hidePopup()
    wx.showToast({
      title:"上传中",
      icon:"loading",
      duration:2000,
      mask:true
    })
    const filePath = this.data.picpath
    let cloudPath;
    let collectionPath;
    if(this.data.index ==0){
      cloudPath = 'randImage/' + new Date().getTime() + '.png'
      collectionPath = "randImage"
    }
    if(this.data.index ==1){
      cloudPath = 'carImage/' + new Date().getTime() + '.png'
      collectionPath = "carImage"
    }
    console.log(filePath)
    console.log(cloudPath)
    wx.cloud.uploadFile({
      cloudPath:cloudPath,
      filePath:filePath,
      success: res=>{
        console.log('成功上传')
        console.log(res.fileID)
        wx.showToast({
          title:" 成功上传，为您点赞!",
          icon:"none",
          duration:2000,
          mask:true,

        })
        let fileID = res.fileID;
        const db  = wx.cloud.database();
        db.collection(collectionPath).add({
          data:{
            Img: fileID
          },
        })
        this.popup2.showPopup()
      }
    })
    this.setData({
      unhide:true,
      picpath:''
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
    // this.popup = this.selectComponent("#popup1");
    // this.popup.showPopup();
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