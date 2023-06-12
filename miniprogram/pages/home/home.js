// pages/home/home.ts
const app = getApp();
Page({
  data: {
   background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    users:[],
    recordStatus: false,
    btnClass: 'btn btn-default',
    todayRecordList: [],
    isRecordEmpty: true,
    userInfo: null,

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
      "步行/自行车", "电动自行车", "摩托车/小型汽车", "公交/出租车/网约车/轨道交通"
    ],
    index: 0,
    defaultIndex: 0,
    capacity: 0,
    capacityList: ["1", "2", "3", "4", "5+"],

    isFront: true,

    aqi: '',
    name: '',
    category: '',

    carbonFootprint: 0
  },
  carbRanking(){
    var _this = this
    const db = wx.cloud.database()
    const _ = db.command
    db.collection('userInfo').orderBy('carbSum','desc').limit(3).get({
      success: function(res){
        console.log('ranking data successfully retrieved')
        console.log(res.data)
        const ranking  = res.data
        for (let index = 0; index < ranking.length; index++) {
          const element = ranking[index];
          const carbSum = Math.round(element.carbSum/1000);
          element.carbSum = carbSum
          
        }
        _this.setData({
          users:ranking
        })
      }
    })
  },
  onShow() {
    this.setData({
      isFront: true
    })
  },

  onHide() {
    this.setData({
      isFront: false
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
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
    console.log(triplet)
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
  updateAQI: function (res, closest) {
    console.log(closest)
    this.setData({
      aqi: res.data.station[closest].aqi,
      name: res.data.station[closest].name,
      category: res.data.station[closest].category
    })
  },

  onLoad: async function () {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    const db = wx.cloud.database()
    const _ = db.command
    let _this = this
    this.carbRanking()
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
              openID: res.result.data._openid,
            })
            console.log('openID:', _this.data.openID)
            _this.setList()
            _this.calcCarbon()
            var now = new Date()
            now.setHours(0, 0, 0, 0)
            console.log(now)

            wx.getLocation({
              type: 'gcj02',
              success(loc) {
                var latitude = loc.latitude.toFixed(2)
                var longitude = loc.longitude.toFixed(2)
                console.log('Location: ', longitude, latitude)
                wx.request({
                  url: "https://geoapi.qweather.com/v2/city/lookup?key=df35576dc85c4dd19641b86b91b48190&location=" + longitude + ',' + latitude,
                  success: async function (res) {
                    console.log(res.data.location[0])
                    var city_id = res.data.location[0].id
                    var city_name = res.data.location[0].adm2 + res.data.location[0].name
                    wx.request({
                      url: "https://devapi.qweather.com/v7/air/now?key=df35576dc85c4dd19641b86b91b48190&location=" + city_id,
                      success: async function (res) {
                        console.log(res.data)
                        var new_category = ""
                        var new_aqi = 0
                        if (res.data.now.aqi <= 12) {
                          new_aqi = Math.round(res.data.now.aqi * 50 / 12)
                        }
                        else if (res.data.now.aqi <= 35.5) {
                          new_aqi = 50 + Math.round((res.data.now.aqi - 12) * 50 / 13.5)
                        }
                        else if (res.data.now.aqi <= 55.5) {
                          new_aqi = 100 + Math.round((res.data.now.aqi - 35.5) * 50 / 20)
                        }
                        else if (res.data.now.aqi <= 150.5) {
                          new_aqi = 150 + Math.round((res.data.now.aqi - 55.5) * 50 / 95)
                        }
                        else{
                          new_aqi = Math.min(res.data.now.aqi - 0 + 50, 500)
                        }
                        if (new_aqi <= 50) new_category = "优"
                        else if (new_aqi <= 100) new_category = "良"
                        else if (new_aqi <= 150) new_category = "轻度污染"
                        else if (new_aqi <= 200) new_category = "中度污染"
                        else if (new_aqi <= 300) new_category = "重度污染"
                        else new_category = "严重污染"
                        _this.setData({
                            aqi: new_aqi,
                            name: city_name,
                            category: new_category
                          })   
                      },
                      fail: function (err) {
                        console.log(err)
                      }
                    })                 
                  },
                  fail: function (err) {
                    console.log(err)
                  }
                })
              },
              fail: function (err) {
                console.log(err)
              }
            })

            db.collection('userInfo').limit(1).where({
                _openid: _this.data.openID,
              })
              .get({
                success: function (res) {
                  console.log(res.data[0].basicInfo.trans)
                  _this.setData({
                    defaultIndex: res.data[0].basicInfo.trans,
                    index: res.data[0].basicInfo.trans
                  })
                },
                fail: console.error
              })


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

  updateCarbon() { // 更新列表
    var _this = this
    const db = wx.cloud.database()
    const _ = db.command
    var now = new Date()
    now.setHours(0, 0, 0, 0)
    var carbon = 0
    db.collection('track').where({
        _openid: _this.data.openID,
        date: _.gt(now)
      })
      .orderBy('date', 'desc')
      .limit(1)
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
            var passenger = parseInt(item['capacity']) + 1
            console.log("passenger", passenger)
            var saving = 0
            if (item['transport'] == '步行/自行车') saving = 192;
            else if (item['transport'] == '电动自行车') saving = 192 - 10 / passenger;
            else if (item['transport'] == '公交/出租车/网约车/轨道交通') saving = 192 - 20 / passenger;
            else saving = 192 - 192 / passenger;
            carbon += dist * saving
          })
          console.log("carbon", carbon)
          db.collection('userInfo').where({
              _openid: _this.data.openID,
            })
            .get({
              success: function (res) {
                var user_id = res.data[0]._id
                db.collection('userInfo').doc(user_id).update({
                  data: {
                    carbSum: _.inc(carbon),
                    carblist: _.push([
                      [new Date(), carbon]
                    ])
                  },
                  success: function (res) {
                    console.log(res.data)
                  }
                })
              },
              fail: console.error
            })
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
      .orderBy('date', 'desc')
      .limit(1)
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
            isRecordEmpty: list.length == 0
          })
        }
      })
  },

  calcCarbon() { // 更新列表
    var _this = this
    const db = wx.cloud.database()
    const _ = db.command
    var now = new Date()
    now.setHours(0, 0, 0, 0)
    var carbon = 0
    db.collection('track').where({
        _openid: _this.data.openID,
        date: _.gt(now)
      })
      .get({
        success: function (res) {
          let list = res.data
          console.log('get list:', list);
          list.forEach(item => {
            var dist = 0
            for (var j in item['points']) {
              if (j == 0) continue
              dist += _this.GetDistance(item['points'][j - 1].latitude, item['points'][j - 1].longitude, item['points'][j].latitude, item['points'][j].longitude)
            }
            item['distance'] = dist.toFixed(2)
            var passenger = parseInt(item['capacity']) + 1
            console.log("passenger", passenger)
            var saving = 0
            if (item['transport'] == '步行/自行车') saving = 192;
            else if (item['transport'] == '电动自行车') saving = 192 - 10 / passenger;
            else if (item['transport'] == '公交/出租车/网约车/轨道交通') saving = 192 - 20 / passenger;
            else saving = 192 - 192 / passenger;
            carbon += dist * saving
          })
          console.log("carbon", carbon)
          _this.setData({
            carbonFootprint: carbon.toFixed(2)
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
        wx.getNetworkType({
          success(res) {
            db.collection('track').doc(_this.data.curID).update({
              data: {
                points: _.push(new db.Geo.Point(locationFn.longitude, locationFn.latitude)),
                velos: _.push(locationFn.speed),
                timestamps: _.push(new Date()),
                networkTypes: _.push(res.networkType),
                isFront: _.push(_this.data.isFront)
              },
              success: function (res) {
                console.log(res)
              }
            })
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

  onTrack: function () { // 开始记录
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
              timestamps: [],
              networkTypes: [],
              isFront: [],
              brand: _this.data.brand,
              model: _this.data.model,
              system: _this.data.system,
              version: _this.data.version,
              platform: _this.data.platform,
              transport: _this.data.transportList[_this.data.index],
              capacity: _this.data.capacity,
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
              console.log('Front?', _this.data.isFront)
              wx.getNetworkType({
                success(res) {
                  db.collection('track').doc(_this.data.curID).update({
                    data: {
                      points: _.push(new db.Geo.Point(locationFn.longitude, locationFn.latitude)),
                      velos: _.push(locationFn.speed),
                      timestamps: _.push(new Date()),
                      networkTypes: _.push(res.networkType),
                      isFront: _.push(_this.data.isFront)
                    },
                    success: function (res) {
                      console.log(res)
                    }
                  })
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
              db.collection('track').doc(_this.data.curID).update({
                data: {
                  endTime: new Date(),
                  endSteps: stepList[30].step,
                  distance: dist.toFixed(2)
                }
              }).then(res => {
                if (res.stats.updated == 1) {
                  console.log('行程记录成功！', res)
                  wx.showToast({
                    title: '行程记录成功!',
                    icon: 'success',
                    duration: 2000
                  })
                  clearInterval(_this.data.myTimer);
                  _this.setData({
                    startTime: 0,
                    endTime: 0,
                    duration: 0,
                    capacity: 0,
                    index: _this.data.defaultIndex,
                    btnClass: 'btn btn-default',
                    recordStatus: false
                  })
                  wx.stopLocationUpdate()
                  wx.offLocationChange()
                  _this.setList()
                  _this.calcCarbon()
                  _this.updateCarbon()
                  _this.onLoad()
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

  bindCapacityChange: function (e) {
    console.log('capacity发送选择改变，携带值为', e.detail.value)
    this.setData({
      capacity: e.detail.value
    })
  },

  // 删除记录
  deleteRecord(e) {
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
            .then(res => {
              wx.showToast({
                title: '删除成功!',
                icon: 'success',
                duration: 1000
              })
              _this.setList()
              _this.calcCarbon()
              _this.onLoad()
            })
            .catch(err => {
              wx.showToast({
                title: '删除失败!' + err,
                icon: 'fail',
                duration: 1000
              })
            })

        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  tabchange(){
    
    var _this = this
    
    if (_this.data.userInfo.testGroup == 2) {
      _this.setData({
        background: 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
      })
     
      
      wx.setTabBarStyle({
        color: '#ffffff',
        selectedColor: '#ffffff',
        backgroundColor: '#D13A29',
        borderStyle: 'white'
      })
      
      wx.setNavigationBarColor({
    
        backgroundColor: "#D13A29",
        frontColor: '#ffffff',
      })
      wx.setNavigationBarTitle({
        title: '低碳强国',
      })
    }
  },
  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    this.tabchange()
    
  
  },

})