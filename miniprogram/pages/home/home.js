// pages/home/home.ts
Page({
  data: {
    recordStatus: false,
    btnClass: 'btn btn-default',
    todayRecordList: [],

    // 定时器：
    myTimer: null,
    // 临时记录信息：
    startTime: 0,
    endTime: 0,
    duration: 0,
    // 用户数据
    openID: '',
    brand: '',
    model: '',
    system: '', //Phone OS
    version: '', //WeChat version
    platform: '',
    curID: '',
    transport: '步行',

    transportList: [
      '步行', '自行车', '公交/地铁', '我的汽车（京A88888）'
    ],
    index: 0,
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const db = wx.cloud.database()
    const _ = db.command
    let _this = this
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
            console.log('openID:', _this.data.openID)
            _this.setList()
            var now = new Date()
            now.setHours(0, 0, 0, 0)
            console.log(now)

            // 查询上次未结束的tracking？
            db.collection('track').orderBy('date', 'desc').limit(1).where({
              _openid: _this.data.openID,
            })
              .get({
                success: function (res) {
                  //console.log('Last entry:')
                  //console.log(res.data[0])
                  var prevTracking = _this.data.recordStatus
                  _this.setData({
                    isTracking: !res.data[0].endTime,
                    curID: res.data[0]._id
                  })
                  console.log(prevTracking)
                  console.log(_this.data.recordStatus)
                  if (!prevTracking && _this.data.recordStatus) _this.keepTracking()
                }
              })
          },
          fail: console.error
        })
      }
    })
  },

  setList() {  // 更新列表
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
          console.log('get list:',list);
            list.forEach(item => {
              if(item['date']) item['date'] = item.date.getTime()
              if(item['endTime']) item['endTime'] = item.endTime.getTime() 
            })
            _this.setData({
              todayRecordList: list.reverse(),
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
        db.collection('track').doc(_this.data.curID).update({
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

  onClickEvent() {
    let _this = this
    if (!this.data.recordStatus) {
      this.startTrackConfirm();
    } else {
      wx.showModal({
        title: '提示',
        content: '要结束本次行程记录吗？',
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定');
            _this.endTrack();
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }
  },

  // 记录前准备
  startTrackConfirm: function () {
    wx.getSetting()
      .then(res => {
        // console.log('getSetting', res);
        if (res.authSetting['scope.userLocationBackground']) {
          this.onTrack()
        } else {
          wx.showModal({
            title: '提示',
            content: '请开启后台定位权限'
          })
            .then(res => {
              if (res.confirm) {
                wx.openSetting({
                  success(res) {
                    console.log(res.authSetting)
                    if (res.authSetting['scope.userLocationBackground']) {
                      this.onTrack()
                    }
                  }
                })
              }
            })
        }
      })

  },

  onTrack: function () {  // 开始记录
    this.setData({
      btnClass: 'btn btn-start',
      recordStatus: true,
      startTime: +new Date(),
      myTimer: setInterval(() => {
        let newTime = +new Date();
        let duration = newTime - this.data.startTime
        this.setData({
          duration
        })
      }, 1000)
    })
    let _this = this
    const db = wx.cloud.database()
    const _ = db.command
    // console.log(_this.data.brand)
    // console.log(_this.data.model)
    // console.log(_this.data.system)
    // console.log(_this.data.version)
    // console.log(_this.data.platform)
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
          db.collection('track').add({
            data: {
              date: new Date(),
              points: [],
              velos: [],
              brand: _this.data.brand,
              model: _this.data.model,
              system: _this.data.system,
              version: _this.data.version,
              platform: _this.data.platform,
              transport: _this.data.transportList[_this.data.index],
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
          wx.startLocationUpdateBackground({
            success(res) {
              console.log('开启后台定位', res)
            },
            fail(err) {
              console.log('开启后台定位失败', err)
            },
          })
          var cnt = 10
          wx.onLocationChange(function (locationFn) {
            cnt++
            if (cnt >= 10) {
              cnt = 0
              console.log('location change', locationFn)
              db.collection('track').doc(_this.data.curID).update({
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

  // 结束记录
  endTrack: function () {
    let _this = this
    const db = wx.cloud.database()
    console.log(this.data.curID)
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
          let stepList = res.result.info.data.stepInfoList
          console.log(stepList[30].step)
          let dist = 0
          db.collection('track').doc(_this.data.curID).get({
            success: function (res) {
              for (var j in res.data.points) {
                if (j == 0) continue
                dist += _this.GetDistance(res.data.points[j - 1].latitude, res.data.points[j - 1].longitude, res.data.points[j].latitude, res.data.points[j].longitude)
              }
            }
          })
          db.collection('track').doc(_this.data.curID).update({
            data: {
              endTime: new Date(),
              endSteps: stepList[30].step,
              distance: dist
            }
          }).then(res => {
            if(res.stats.updated == 1){
              console.log('行程记录成功！', res)
              wx.showToast({
                title: '行程记录成功!',
                icon: 'success',
                duration: 2000
              })
              clearInterval(_this.data.myTimer);
              this.setData({
                startTime: 0,
                endTime: 0,
                duration: 0,
                index: 0,
                btnClass: 'btn btn-default',
                recordStatus: false
              })
              wx.stopLocationUpdate()
              wx.offLocationChange()
              _this.setList()
              _this.onLoad()
            }
          })
        }).catch(err => {
          console.log('[onGetWeRunData] 失败：', err)
        })
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

  // 出行方式选择
  bindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value,
      transport: this.data.transportList[e.detail.value]
    })
  },

  // 删除记录
  deleteRecord(e){
    const db = wx.cloud.database()
    let _this = this
    let _id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '删除本条记录？',
      success(res) {
        if (res.confirm) {
          db.collection('track')
          .doc(_id)
          .remove()
          .then(res=>{
            wx.showToast({
              title: '删除成功!',
              icon: 'success',
              duration: 1000
            })
            _this.setList()
          })
          .catch(err => {
            wx.showToast({
              title: '删除失败!'+ err,
              icon: 'fail',
              duration: 1000
            })
          })

        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  }
  
})