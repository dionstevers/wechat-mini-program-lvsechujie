// pages/home/home.ts
Page({
  data: {
    recordStatus: 'off',
    btnClass: 'btn btn-default',
    recordList: [],
    recordCount: 0,
    // 临时记录信息：
    startTime : 0,
    endTime: 0,
    duration: 0,
    distance: 0,
    transport: '步行',
    // 定时器：
    myTimer: null,

    transportList: [
      '步行','自行车','公交/地铁','我的汽车（京A88888）'
    ],
    index:0
  },

  onClickEvent() {
    let _this = this
    if (this.data.recordStatus == 'off') {
      this.startRecording();
      this.setData({
        btnClass: 'btn btn-start',
        recordStatus: 'on'
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '要结束本次行程记录吗？',
        success (res) {
          if (res.confirm) {
            console.log('用户点击确定');
            _this.endRecording();
            wx.showToast({
              title: '行程记录成功!',
              icon: 'success',
              duration: 2000
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }
  },

  startRecording() {
    this.setData({
      startTime: +new Date(),
      myTimer: setInterval(() => {
        let newTime = +new Date();
        let duration = newTime - this.data.startTime
        this.setData({
          duration
        })
      }, 1000)
    })
  },

  endRecording() {
    clearInterval(this.data.myTimer);
    let {recordList, recordCount,startTime, duration, distance, transport} = this.data
    let endTime = +new Date()
    let record = { startTime, endTime, duration, distance, transport}
    recordList.push(record)
    this.setData({
      recordList,
      recordCount: recordCount + 1,
      startTime: 0,
      endTime: 0,
      duration: 0,
      distance: 0,
      transport: '步行',
      index: 0,
      btnClass: 'btn btn-default',
      recordStatus: 'off'
    })
  },

  bindPickerChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value,
      transport: this.data.transportList[e.detail.value]
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