// pages/triphistory/triphistory.ts
import { updateColor } from "../../utils/colorschema";
import { logEvent } from "../../utils/log";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    openID: "",
    todayRecordList: []
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
  onLoad() {
    var _this = this
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        _this.setData({
          openID: res.result.data._openid,
        })
        console.log('openID:', _this.data.openID)
        _this.setList()
      }
    })
  },

  setList() { // 更新列表
    var _this = this
    const db = wx.cloud.database()
    const _ = db.command
    var now = new Date()
    now.setHours(0, 0, 0, 0)
    db.collection('track').where({
        _openid: _this.data.openID,
        date: _.gt(now)
      })
      .get({
        success: function (res) {
          let list = res.data
          console.log('get list:', list);
          list.forEach(item => {
            if (item['date']) item['date'] = item.date.getTime()
            if (item['endTime']) item['endTime'] = item.endTime.getTime()
            var dist = 0
            for (var j in item['points']) {
              if (j == 0) continue
              dist += _this.GetDistance(item['points'][j - 1].latitude, item['points'][j - 1].longitude, item['points'][j].latitude, item['points'][j].longitude)
            }
            item['distance'] = dist.toFixed(2)
          })
          _this.setData({
            todayRecordList: list.reverse(),
          })
          console.log(_this.data.todayRecordList)
        }
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
    // 更新颜色
    updateColor();
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