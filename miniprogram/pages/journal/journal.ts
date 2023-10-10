import { createNativeULUMap } from "XrFrame/kanata/lib/index";

const app = getApp()

// pages/journal/journal.ts

Page({

  /**
   * 页面的初始数据
   */
  data: {
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    forminfo: '',
    openID: '',
    userInfo: app.globalData.userInfo,
    type :1 , // todo  : static now, will add a function to tell time 
    status: null,
    single:[],
    sort:[],
    singleSelected: [], // 单选题选项的选择结果
    sortSelected:[],
    isLoading: true
  },
  handleSingleSelect: function (e) {

    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const singleSelected = this.data.singleSelected;
    singleSelected[index] = value;
    this.setData({ singleSelected });
  },

  async fetchData() {
    this.setData({
      isLoading: true // 开始加载数据，按钮将被隐藏
    });
    wx.showToast({
      title: '加载中', // 显示加载中提示
      icon: 'loading',
      duration: 10000 // 设置持续显示时间，单位毫秒
    });
  
    const db = wx.cloud.database();
  
    try {
      const type = this.data.type
      const res = await db.collection('qsThree').where({_id: 1}).get();
      console.log(res.data[0]);
      
      // 隐藏加载中提示
      wx.hideToast();
      this.setData({
        isLoading: false
      });
  
      this.setData({
        single: res.data[0].single,
        sort: res.data[0].sort,
        
      });
    } catch (error) {
      // 处理加载数据失败的情况
      wx.hideToast(); // 隐藏加载中提示
      wx.showToast({
        title: '加载数据失败',
        icon: 'none',
        duration: 2000
      });
      console.error('加载数据失败', error);
    }
  },

 
  formCheck(){
    var ans = this.data.singleSelected.length
    const total = this.data.single.length
    console.log('answered', ans)
    console.log('total',total)
    if(ans!=total){
      wx.showModal({
         content:'您有问题未回答哦，请再次检查全部作答',
         showCancel:false
      })
      return false
    }
    return true
  },
  async formSubmit() {
    if (this.formCheck()) {
      // 显示上传中的提示
      wx.showToast({
        title: '上传中',
        icon: 'loading',
        duration: 10000 // 设置持续显示时间，单位毫秒，可根据实际上传时间调整
      });
    
      const db = wx.cloud.database();
      db.collection('qsAns').add({
        data: {
          ans: this.data.singleSelected,
          type: this.data.type
        }
      }).then(() => {
        // 隐藏上传中提示
        wx.hideToast();
    
        // 显示上传完成的提示
        wx.showToast({
          title: '上传完成',
          icon: 'success',
          duration: 2000 // 设置上传完成提示的显示时间，单位毫秒
        });
    
        // 在上传完成后切换到 'pages/center/center' 页面
        wx.switchTab({
          url: '/pages/center/center'
        });
      }).catch((error) => {
        // 处理上传失败的情况
        wx.hideToast(); // 隐藏上传中提示
        wx.showToast({
          title: '上传失败',
          icon: 'none',
          duration: 2000
        });
        console.error('上传失败', error);
      });
    }
    
    
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.fetchData()
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