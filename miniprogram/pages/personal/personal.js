// pages/personal/personal.js

Page({

  /**
   * 页面的初始数据
   */
  data: {
    openID: '',
    totalC: 0
  },

  GetDistance: function (lat1, lng1, lat2, lng2) {
    var radLat1 = lat1 * Math.PI / 180.0;
    var radLat2 = lat2 * Math.PI / 180.0;
    var a = radLat1 - radLat2;
    var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return s;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        this.setData({
          openID: res.result.openid,
        })
        var _this = this
        const db = wx.cloud.database()
        const _ = db.command
        var now = new Date()
        //now = new Date(new Date().setDate(new Date().getDate()-15))
        now.setHours(0,0,0,0)
        console.log(now)
        db.collection('trace').where({
            _openid: _this.data.openID,
            transport: _.exists(true),
            date: _.gt(now)
          })
          .get({
            success: function (res) {
              var tot = 0
              for (var i in res.data) {
                //console.log(res.data[i])
                var dist = 0
                for (var j in res.data[i].points) {
                  if (j == 0) continue
                  dist += _this.GetDistance(res.data[i].points[j - 1].latitude, res.data[i].points[j - 1].longitude, res.data[i].points[j].latitude, res.data[i].points[j].longitude)
                }
                console.log(res.data[i].transport + ' ' + dist + ' km')
                var carbon = 0
                if (res.data[i].transport == '自驾车') {
                  carbon = dist * 0.621371192 * 19.6 / 21.6 * 0.45359237
                } else if (res.data[i].transport == '网约车/出租车') {
                  carbon = dist * 0.621371192 * 19.6 / 21.6 * 0.45359237 * 0.7
                } else if (res.data[i].transport == '火车') {
                  carbon = dist * 0.065
                } else if (res.data[i].transport == '公交车') {
                  carbon = dist * 0.069
                } else if (res.data[i].transport == '地铁') {
                  carbon = dist * 0.042
                } else if (res.data[i].transport == '飞机') {
                  if (dist <= 200) carbon = dist * 0.275
                  else if (dist > 200 & dist <= 1000) carbon = 55 + 0.105 * (dist - 200)
                  else carbon = dist * 0.139
                }
                console.log('CO2 emission: ' + carbon + ' kg')
                tot += carbon
              }
              _this.setData({
                totalC: (tot == 0 ? 0 : tot.toFixed(2))
              })
            }
          })
      },
      fail: console.error
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})