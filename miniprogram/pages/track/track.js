// pages/track/track.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    openID: '',
    brand: '',
    model: '',
    system: '', //Phone OS
    version: '', //WeChat version
    platform: '',
    isTracking: false,
    curID: '',
    showModal: false,
    content: 'END',
    items: [{
      label: '预测是否准确？若准确，请点击“预测准确”；若不准确，请写下您的反馈（即正确的交通方式）',
      name: 'feedback'
    }],
    feedback: 'Correct'
  },

  onComplete: function (e) {
    this.setData({
      showModal: false
    })

    if (e.detail.confirm) {
      var formData = e.detail.formData
      var formId = e.detail.formId
      // eg.
      // formData: {name: "Jaime"}
      // formId: "the formId is a mock one"
      this.setData({
        feedback: formData.feedback
      })
    } else {
      // 用户点击取消
    }
    console.log(this.data.feedback)
    var _this = this
    const db = wx.cloud.database()
    db.collection('trace2').doc(this.data.curID).update({
      data: {
        feedback: _this.data.feedback
      },
      success: function (res) {
        console.log(res)
      }
    })
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

  getSteps: function () {
    wx.getWeRunData({
      success: res => {
        wx.cloud.callFunction({
          name: 'echo',
          data: {
            // info 字段在云函数 event 对象中会被自动替换为相应的敏感数据
            info: wx.cloud.CloudID(res.cloudID),
          },
        }).then(res => {
          console.log('[onGetWeRunData] 收到 echo 回包：', res)
          var stepList = res.result.info.data.stepInfoList
          console.log(stepList[30].step)
          return stepList[30].step
        }).catch(err => {
          console.log('[onGetWeRunData] 失败：', err)
          return "Error"
        })
      }
    })
  },

  onTrack: function () {
    var _this = this
    const db = wx.cloud.database()
    console.log(_this.data.brand)
    console.log(_this.data.model)
    console.log(_this.data.system)
    console.log(_this.data.version)
    console.log(_this.data.platform)
    wx.getWeRunData({
      success: res => {
        wx.cloud.callFunction({
          name: 'echo',
          data: {
            // info 字段在云函数 event 对象中会被自动替换为相应的敏感数据
            info: wx.cloud.CloudID(res.cloudID),
          },
        }).then(res => {
          console.log('[onGetWeRunData] 收到 echo 回包：', res)
          var stepList = res.result.info.data.stepInfoList
          console.log(stepList[30].step)
          db.collection('trace2').add({
            data: {
              date: new Date(),
              points: [],
              velos: [],
              brand: _this.data.brand,
              model: _this.data.model,
              system: _this.data.system,
              version: _this.data.version,
              platform: _this.data.platform,
              startSteps: stepList[30].step
            },
            success: function (res) {
              console.log(res)
              _this.setData({
                curID: res._id,
                isTracking: true
              })
            }
          })
          /*
          wx.requestSubscribeMessage({
            tmplIds: ['TMmOMnmX_9L5m1G4oPhsygORiRM73_Uq4senr1qoqEc'],
            success(res) {}
          })
          */
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
              db.collection('trace2').doc(_this.data.curID).update({
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
        }).catch(err => {
          console.log('[onGetWeRunData] 失败：', err)
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
        db.collection('trace2').doc(_this.data.curID).update({
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
    var _this = this
    wx.getWeRunData({
      success: res => {
        wx.cloud.callFunction({
          name: 'echo',
          data: {
            // info 字段在云函数 event 对象中会被自动替换为相应的敏感数据
            info: wx.cloud.CloudID(res.cloudID),
          },
        }).then(res => {
          console.log('[onGetWeRunData] 收到 echo 回包：', res)
          var stepList = res.result.info.data.stepInfoList
          console.log(stepList[30].step)
          db.collection('trace2').doc(_this.data.curID).update({
            data: {
              endTime: new Date(),
              endSteps: stepList[30].step
            },
            success: function (res) {
              console.log(res)
              _this.predict(_this.openModal);
            }
          })
          wx.stopLocationUpdate()
          wx.offLocationChange()
          _this.onLoad()
        }).catch(err => {
          console.log('[onGetWeRunData] 失败：', err)
        })
      }
    })
  },

  predict: function (e) {
    const db = wx.cloud.database()
    var _this = this
    db.collection('trace2').doc(this.data.curID).get({
      success: function (res) {
        var dist = 0
        for (var j in res.data.points) {
          if (j == 0) continue
          dist += _this.GetDistance(res.data.points[j - 1].latitude, res.data.points[j - 1].longitude, res.data.points[j].latitude, res.data.points[j].longitude)
        }
        var length = parseInt((res.data.endTime - res.data.date) / 1000)
        var avgVel = (dist / (length / 3600)).toFixed(2)
        //if (res.data.points.length * 50 < length) avgVel = -1
        e(dist, length, avgVel);
      }
    })
  },

  openModal: function (dist, length, avgVel) {
    var _this = this
    /*
    if (avgVel == -1) {
      _this.setData({
        showModal: true,
        content: "因数据缺失过多，小程序无法预测您的交通方式"
      })
      return
    }
    */
    console.log("Distance: " + dist + " km")
    console.log("Time: " + this.processTime(length))
    console.log("Average Velocity: " + avgVel)
    var transport = '步行'
    if (avgVel > 6.3) transport = '骑行'
    if (avgVel > 7.5) transport = '公交车'
    if (avgVel > 19) transport = '汽车'
    if (avgVel > 150) transport = '火车'
    _this.setData({
      showModal: true,
      content: "距离：" + dist + " km\n时间：" + _this.processTime(length) + "\n平均速度：" + avgVel + " km/h\n您最有可能使用的交通方式是 " + transport
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this = this
    wx.getSystemInfo({
      success(res) {
        _this.setData({
          brand: res.brand,
          model: res.model,
          system: res.system,
          version: res.version,
          platform: res.platform
        })
        wx.cloud.callFunction({
          name: 'login',
          success: res => {
            _this.setData({
              openID: res.result.openid,
            })
            const db = wx.cloud.database()
            const _ = db.command
            var now = new Date()
            now.setHours(0, 0, 0, 0)
            console.log(now)
            db.collection('trace2').orderBy('date', 'desc').limit(1).where({
                _openid: _this.data.openID,
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
                  if (!prevTracking && _this.data.isTracking) _this.keepTracking()
                }
              })
          },
          fail: console.error
        })
      }
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