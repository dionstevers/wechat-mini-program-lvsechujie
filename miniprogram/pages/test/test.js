// pages/test/test.js

Page({

  /**
   * 页面的初始数据
   */
  data: {
    openID: '',
    aqi: '',
    name: '',
    category: ''
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

  calcDist: async function (triplet, i) {
    var _this = this
    var dist = -1
    const db = wx.cloud.database()
    return db.collection('monitor').where({
        POI_ID: triplet[2][i].id,
      })
      .get().then(res => {
        //console.log(res.data)
        var mlat = res.data[0].POI_Latitude
        var mlng = res.data[0].POI_Longitude
        return _this.GetDistance(triplet[0], triplet[1], mlat, mlng)
      })
  },

  async findClosest(triplet) {
    var _this = this
    var closest = -1
    var closestDist = -1
    for (var i in triplet[2]) {
      var dist = await _this.calcDist(triplet, i)
      console.log(i, dist)
      if (closest == -1 || dist < closestDist) {
        closest = i
        closestDist = dist
      }
    }
    return closest
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        this.setData({
          openID: res.result.openid
        })
      },
      fail: console.error
    })
    var _this = this
    wx.getLocation({
      type: 'gcj02',
      success(loc) {
        latitude = loc.latitude.toFixed(2)
        longitude = loc.longitude.toFixed(2)
        console.log(longitude, latitude)
        wx.request({
          url: "https://devapi.qweather.com/v7/air/now?key=df35576dc85c4dd19641b86b91b48190&location=" + longitude + ',' + latitude,
          success: async function (res) {
            _this.updateAQI(res, await _this.findClosest([latitude, longitude, res.data.station]))
          },
          fail: function (err) {
            console.log(err)
          }
        })
      }
    })
  },

  updateAQI: function (res, closest) {
    console.log(closest)
    this.setData({
      aqi: res.data.station[closest].aqi,
      name: res.data.station[closest].name,
      category: res.data.station[closest].category
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