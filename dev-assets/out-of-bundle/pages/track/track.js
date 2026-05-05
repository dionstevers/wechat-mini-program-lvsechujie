// pages/track/track.js
Page({
  data: {
    // ... 其他状态
    gpsPoints: [], // 存储GPS点
    tripActive: false, // 行程状态
    intervalId: null // 用于存储定时器ID
  },

  startTrip: function() {
    this.setData({ tripActive: true });
    this.showAnimation(); // 显示动画

    // 开始定时获取GPS数据
    const that = this;
    this.setData({
      intervalId: setInterval(function() {
        that.getGpsData(); // 定期获取GPS数据
      }, 5000) // 每5秒获取一次位置
    });
  },

  endTrip: function() {
    if (!this.data.tripActive) return; // 检查行程是否正在进行
    this.setData({ tripActive: false });

    // 清除定时器
    clearInterval(this.data.intervalId);

    this.calculateSpeed(); // 计算速度
  },

  getGpsData: function() {
    const that = this;
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        const { latitude, longitude } = res;
        that.setData({
          gpsPoints: [...that.data.gpsPoints, { lat: latitude, lng: longitude }]
        });
        console.log("GPS Data: ", that.data.gpsPoints); // 调试输出
      },
      fail() {
        console.error("Failed to get location."); // 错误处理
      }
    });
  },

  // 其他方法保持不变
});
