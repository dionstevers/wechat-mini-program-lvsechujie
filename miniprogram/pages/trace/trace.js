// pages/trace/trace.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    array: ['步行', '骑行', '公交车', '自驾车', '网约车/出租车', '地铁', '火车', '飞机'],
    objectArray: [{
        id: 0,
        name: '步行'
      },
      {
        id: 1,
        name: '骑行'
      },
      {
        id: 2,
        name: '公交车'
      },
      {
        id: 3,
        name: '自驾车'
      },
      {
        id: 4,
        name: '网约车/出租车'
      },
      {
        id: 5,
        name: '地铁'
      },
      {
        id: 6,
        name: '火车'
      },
      {
        id: 7,
        name: '飞机'
      }
    ],
    index: 0,
    openID: '',
    isTracking: false,
    curID: ''
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

  bindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value
    })
  },

  onTrack: function () {
    var _this = this
    const db = wx.cloud.database()
    db.collection('trace').add({
      data: {
        transport: _this.data.array[_this.data.index],
        date: new Date(),
        points: [],
        velos: []
      },
      success: function (res) {
        console.log(res)
        _this.setData({
          curID: res._id,
          isTracking: true
        })
      }
    })
    wx.requestSubscribeMessage({
      tmplIds: ['TMmOMnmX_9L5m1G4oPhsygORiRM73_Uq4senr1qoqEc'],
      success(res) {}
    })
    //_this.onLoad()
    wx.startLocationUpdateBackground({
      success(res) {
        console.log('开启后台定位', res)
      },
      fail(err) {
        console.log('开启后台定位失败', err)
      },
    })
    const _ = db.command
    var cnt = 10
    wx.onLocationChange(function (locationFn) {
      cnt++
      if (cnt >= 10) {
        cnt = 0
        console.log('location change', locationFn)
        db.collection('trace').doc(_this.data.curID).update({
          data: {
            points: _.push(new db.Geo.Point(locationFn.longitude, locationFn.latitude)),
            velos: _.push(locationFn.speed)
          },
          success: function (res) {
            console.log(res)
          }
        })
      }
    })
  },
  keepTracking: function () {
    var _this = this
    wx.startLocationUpdateBackground({
      success(res) {
        console.log('开启后台定位', res)
      },
      fail(err) {
        console.log('开启后台定位失败', err)
      },
    })
    const db = wx.cloud.database()
    const _ = db.command
    var cnt = 10
    console.log(_this.data.curID)
    wx.onLocationChange(function (locationFn) {
      cnt++
      if (cnt >= 10) {
        cnt = 0
        console.log('location change', locationFn)
        db.collection('trace').doc(_this.data.curID).update({
          data: {
            points: _.push(new db.Geo.Point(locationFn.longitude, locationFn.latitude)),
            velos: _.push(locationFn.speed)
          },
          success: function (res) {
            console.log(res)
          }
        })
      }
    })
  },
  startTrack: function () {
    var _this = this
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userLocationBackground']) {
          _this.onTrack()
        } else {
          wx.showModal({
            title: '提示',
            content: '请开启后台定位权限',
            success(res) {
              if (res.confirm) {
                wx.openSetting({
                  success(res) {
                    console.log(res.authSetting)
                    if (res.authSetting['scope.userLocationBackground']) {
                      _this.onTrack()
                    }
                  }
                })
              }
            }
          })
        }
      }
    })
  },

  processTime: function (sec) {
    if (sec < 60) return sec + " s"
    else if (sec < 3600) return parseInt(sec / 60) + " min " + sec % 60 + " s"
    else return parseInt(sec / 3600) + " h " + parseInt((sec % 3600) / 60) + " min " + sec % 60 + " s"
  },

  endTrack: function () {
    const db = wx.cloud.database()
    console.log(this.data.curID)
    db.collection('trace').doc(this.data.curID).update({
      data: {
        endTime: new Date()
      },
      success: function (res) {
        console.log(res)
      }
    })
    var _this = this
    db.collection('trace').doc(this.data.curID).get({
      success: function (res) {
        var dist = 0
        for (var j in res.data.points) {
          if (j == 0) continue
          dist += _this.GetDistance(res.data.points[j - 1].latitude, res.data.points[j - 1].longitude, res.data.points[j].latitude, res.data.points[j].longitude)
        }
        var length = parseInt((res.data.endTime - res.data.date) / 1000)
        var avgVel = (dist / (length / 3600)).toFixed(2)
        console.log("Distance: " + dist + " km")
        console.log("Time: " + _this.processTime(length))
        console.log("Average Velocity: " + avgVel)
        wx.showModal({
          title: '行程结束',
          content: "距离：" + dist + " km\n时间：" + _this.processTime(length) + "\n平均速度：" + avgVel + " km/h",
          success(res) {
            if (res.confirm) {
              console.log('用户点击确定')
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        })

      }
    })
    wx.stopLocationUpdate()
    wx.offLocationChange()
    this.onLoad()
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
        now.setHours(0, 0, 0, 0)
        console.log(now)
        db.collection('trace').orderBy('date', 'desc').limit(1).where({
            _openid: _this.data.openID,
            transport: _.exists(true)
          })
          .get({
            success: function (res) {
              //console.log('Last entry:')
              //console.log(res.data[0])
              var prevTracking = _this.data.isTracking
              _this.setData({
                isTracking: !res.data[0].endTime,
                curID: res.data[0]._id
              })
              console.log(prevTracking)
              console.log(_this.data.isTracking)
              if(!prevTracking && _this.data.isTracking)_this.keepTracking()
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