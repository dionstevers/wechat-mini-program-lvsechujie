// pages/picUp/picUp.ts
import { updateColor } from '../../utils/colorschema'
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    index:0,
    funclist:["随手拍","拍油耗"],
    picpath:'',
    modalHidden:true,
    userInfo: null,
    background: null,
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
        let size = res.tempFiles[0].size
        console.log(path)
        // 最大不超过2M
        if(size<=2000000){
          _this.setData({
            picpath:path
          })
        }else{
          wx.showToast({
            title:'上传图片不能大于2M',
            icon:'error'
          })
        }
        

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
    _this.setData({
      modalHidden: false
    })
    
  },
  modalCancel(e){
    this.setData({
      modalHidden:true
    })
  },
  modalConfirm(e){
    console.log("确定")
    
    this.setData({
      modalHidden: true
    })
    wx.showToast({
      title:"上传中",
      icon:"loading",
      duration:1500,
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
        wx.showModal({
          title:'成功上传',
          content:'感谢您的上传！',
          showCancel:false,
          confirmText:'确认',
        })
       
        let fileID = res.fileID;
        const db  = wx.cloud.database();
        const _ = db.command
        db.collection(collectionPath).add({
          data:{
            Img: fileID
          },
        })
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
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 更新颜色
    updateColor();

    this.setData({
      userInfo: app.globalData.userInfo
    })
    wx.setNavigationBarTitle({
      title: '碳行家｜低碳身边事'
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
    logEvent("Share App")
    return {
      title: "快来一起低碳出街~",
      path:`/pages/index/index?sharedFromID=${app.globalData.openid}`,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  }
})