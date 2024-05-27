// pages/home/home.ts
const app = getApp();
Page({
  data: {
    testGroup: null,
    background: "linear-gradient(180deg, #00022a 0%,#009797 100%)",
    users: [],
    recordStatus: false,
    btnClass: "btn btn-default",
    todayRecordList: [],
    isRecordEmpty: true,
    userInfo: null,
    // 临时记录信息：
    startTime: 0,
    endTime: 0,
    duration: 0,
    // 用户数据
    openID: "",
    brand: "",
    model: "",
    system: "", //Phone OS
    version: "", //WeChat version
    platform: "",
    curID: "",
    transport: "步行",
    transportList: ["步行或骑行", "公共交通", "驾驶电动汽车", "驾驶燃油汽车"],
    endTransportList: ["未驾驶汽车", "驾驶电动汽车", "驾驶燃油汽车"],
    index: 0,
    endIndex: 0,
    defaultIndex: 0,
    capacity: 0,
    capacityList: ["1", "2", "3", "4", "5+"],
    isFront: true,
    aqi: "",
    name: "",
    category: "",
    transporModalHidden: true,
    capacityModalHidden: true,
    speedBtwwon: [
      {
        label: "步行/跑步",
        min: 0,
        max: 2.78
      },
      {
        label: "骑行",
        min: 2.78,
        max: 5.56
      },
      {
        label: "汽车(市区)",
        min: 5.56,
        max: 13.89
      },
      {
        label: "汽车(高速公路)",
        min: 22.22,
        max: 33.33
      },
      {
        label: "公交车（市区）",
        min: 4.17,
        max: 8.33
      },
      {
        label: "公交车（长途）",
        min: 16.67,
        max: 25
      }
    ]
  },

  capacityModalConfirm(e) {
    this.setData({ capacityModalHidden: true });
    this.onTrack();
  },
  capacityModalCancel() {
    this.setData({ capacityModalHidden: true });
  },
  transporModalConfirm(e) {
    this.setData({
      transporModalHidden: true
    });
    this.endTrack();
  },
  transporModalCancel() {
    this.setData({
      transporModalHidden: true
    });
  },
  // 展示数据库中节省碳足迹top_n
  carbRanking() {
    const db = wx.cloud.database();
    db.collection("userInfo")
      .orderBy("carbSum", "desc")
      .limit(3)
      .get({
        success: res => {
          const ranking = res.data.map(item => ({
            ...item,
            carbSum: Math.round(item.carbSum / 1000)
          }));
          this.setData({ users: ranking });
        }
      });
  },
  // 计算离aqi基站距离
  calcDist: async function (triplet, i) {
    const db = wx.cloud.database();
    const { data } = await db
      .collection("monitor")
      .where({
        POI_ID: triplet[2][i].id
      })
      .get();
    const { POI_Latitude: mlat, POI_Longitude: mlng } = data[0];
    return this.GetDistance(triplet[0], triplet[1], mlat, mlng);
  },
  //  找到最近aqi基站
  async findClosest(triplet) {
    let closest = -1;
    let closestDist = -1;

    for (let i = 0; i < triplet[2].length; i++) {
      let dist = await this.calcDist(triplet, i);
      if (closest === -1 || dist < closestDist) {
        closest = i;
        closestDist = dist;
      }
    }
    return closest;
  },
  // 更新aqi数据
  updateAQI: function (res, closest) {
    this.setData({
      aqi: res.data.station[closest].aqi,
      name: res.data.station[closest].name,
      category: res.data.station[closest].category
    });
  },
  // 更新碳排放列表
  updateCarbon() {
    const _this = this;
    const db = wx.cloud.database();
    const _ = db.command;
    let now = new Date();
    now.setHours(0, 0, 0, 0);
    let carbon = 0;
    db.collection("track")
      .where({
        _openid: _this.data.openID,
        date: _.gt(now)
      })
      .orderBy("date", "desc")
      .limit(1)
      .get({
        success: function (res) {
          let list = res.data;
          list.forEach(item => {
            if (item["date"]) item["date"] = item.date.getTime();
            if (item["endTime"]) item["endTime"] = item.endTime.getTime();
            let dist = 0;
            for (let j in item["points"]) {
              if (j == 0) continue;
              dist += _this.GetDistance(
                item["points"][j - 1].latitude,
                item["points"][j - 1].longitude,
                item["points"][j].latitude,
                item["points"][j].longitude
              );
            }
            item["distance"] = dist.toFixed(2);
            let passenger = parseInt(item["capacity"]) + 1;

            let saving = 0;
            if (item["transport"] == "步行或骑行") saving = 292.4;
            else if (item["transport"] == "驾驶电动汽车") saving = 292.4 - 181.5 / passenger;
            else if (item["transport"] == "公共交通") saving = 292.4 - 20 / passenger;
            else saving = 292.4 - 292.4 / passenger;
            carbon += dist * saving;
          });

          // TODO: put the carbsum and carblist into a seperate collection
          db.collection("lottery")
            .where({
              _openid: _this.data.openID
            })
            .get({
              success: function (res) {
                let user_id = res.data[0]._id;
                let four = new Date();
                four.setHours(4, 0, 0, 0);
                db.collection("track")
                  .where({
                    _openid: _this.data.openID,
                    date: _.gt(four)
                  })
                  .get({
                    success: function (res) {
                      let list = res.data;

                      if (list.length == 1) {
                        db.collection("lottery")
                          .doc(user_id)
                          .update({
                            data: {
                              credit: _.inc(25)
                            }
                          });
                      }
                    }
                  });
              }
            });
          db.collection("userInfo")
            .where({
              _openid: _this.data.openID
            })
            .get({
              success: function (res) {
                let user_id = res.data[0]._id;
                db.collection("userInfo")
                  .doc(user_id)
                  .update({
                    data: {
                      carbSum: _.inc(carbon)
                    }
                  });
              },
              fail: console.error
            });
        }
      });
  },
  // 更新行程记录列表
  setList() {
    const _this = this;
    const db = wx.cloud.database();
    const _ = db.command;
    let now = new Date();
    now.setHours(0, 0, 0, 0);
    db.collection("track")
      .where({
        _openid: _this.data.openID,
        date: _.gt(now)
      })
      .orderBy("date", "desc")
      .limit(1)
      .get({
        success: function (res) {
          let list = res.data;
          list.forEach(item => {
            if (item["date"]) item["date"] = item.date.getTime();
            if (item["endTime"]) item["endTime"] = item.endTime.getTime();
            let dist = 0;
            for (let j in item["points"]) {
              if (j == 0) continue;
              dist += _this.GetDistance(
                item["points"][j - 1].latitude,
                item["points"][j - 1].longitude,
                item["points"][j].latitude,
                item["points"][j].longitude
              );
            }

            item["distance"] = dist.toFixed(2);
            item["carbSum"] = item.carbSum.toFixed(2);
          });
          _this.setData({
            todayRecordList: list.reverse(),
            isRecordEmpty: list.length == 0
          });
        }
      });
  },
  // 计算当次节省碳排放 - 问题：  是否与update carbon 重复？
  /*
  calcCarbon() {
    const _this = this
    const db = wx.cloud.database()
    const _ = db.command
    let now = new Date()
    now.setHours(0, 0, 0, 0)
    let carbon = 0
    db.collection('track').where({
        _openid: _this.data.openID,
        date: _.gt(now)
      })
      .get({
        success: function (res) {
          let list = res.data
          console.log('get list:', list);
          list.forEach(item => {
            let dist = 0
            for (let j in item['points']) {
              if (j == 0) continue
              dist += _this.GetDistance(item['points'][j - 1].latitude, item['points'][j - 1].longitude, item['points'][j].latitude, item['points'][j].longitude)
            }
            item['distance'] = dist.toFixed(2)
            let passenger = parseInt(item['capacity']) + 1
            console.log("passenger", passenger)
            let saving = 0
            if (item['transport'] == '步行或骑行') saving = 192;
            //else if (item['transport'] == '电动自行车') saving = 192 - 10 / passenger;
            else if (item['transport'] == '公共交通') saving = 192 - 20 / passenger;
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
  */
  // 开启行程记录
  keepTracking: function () {
    const db = wx.cloud.database();
    const _ = db.command;
    let cnt = 10;

    wx.startLocationUpdateBackground({
      success(res) {
        console.log("开启后台定位", res);
      },
      fail(err) {
        console.log("开启后台定位失败", err);
      }
    });

    wx.onLocationChange(async locationFn => {
      cnt++;

      if (cnt >= 10) {
        cnt = 0;
        try {
          const networkRes = await wx.getNetworkType();
          await db
            .collection("track")
            .doc(this.data.curID)
            .update({
              data: {
                points: _.push(new db.Geo.Point(locationFn.longitude, locationFn.latitude)),
                velos: _.push(locationFn.speed),
                timestamps: _.push(new Date()),
                networkTypes: _.push(networkRes.networkType),
                isFront: _.push(this.data.isFront)
              }
            });
        } catch (err) {
          console.error("网络类型获取或数据更新失败", err);
        }
      }
    });
  },
  // 结束行程记录
  onClickEvent() {
    const _this = this;
    if (_this.data.userInfo != null) {
      if (!this.data.recordStatus) {
        this.startTrackConfirm();
      } else {
        wx.showModal({
          title: "提示",
          content: "要结束本次行程记录吗？",
          success(res) {
            if (res.confirm) {
              _this.setData({
                transporModalHidden: false
              });
            }
          }
        });
      }
    }
    if (_this.data.userInfo == null) {
      wx.showModal({
        title: "您尚未注册/登录",
        content: "请先注册/登录并同意隐私条款",
        success(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: "../login/login"
            });
          }
        }
      });
    }
  },
  // 记录前隐私调用准备
  startTrackConfirm: function () {
    wx.getSetting().then(res => {
      if (res.authSetting["scope.userLocationBackground"]) {
        this.setData({
          capacityModalHidden: false
        });
      } else {
        wx.showModal({
          title: "提示",
          content: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”"
        }).then(modalRes => {
          if (modalRes.confirm) {
            wx.openSetting().then(settingRes => {
              if (settingRes.authSetting["scope.userLocationBackground"]) {
                this.setData({
                  capacityModalHidden: false
                });
              }
            });
          }
        });
      }
    });
  },

  onTrack: function () {
    this.setData({
      btnClass: "btn btn-start",
      recordStatus: true,
      startTime: +new Date(),
      myTimer: setInterval(() => {
        this.setData({
          duration: +new Date() - this.data.startTime
        });
      }, 1000)
    });

    const db = wx.cloud.database();
    const _ = db.command;

    wx.getWeRunData({
      success: res => {
        wx.cloud
          .callFunction({
            name: "echo",
            data: {
              info: wx.cloud.CloudID(res.cloudID)
            }
          })
          .then(async res => {
            console.log("[onGetWeRunData] 收到 echo 回包：", res);
            let stepList = res.result.info.data.stepInfoList;

            const trackRes = await db.collection("track").add({
              data: {
                date: new Date(),
                points: [],
                velos: [],
                timestamps: [],
                networkTypes: [],
                isFront: [],
                brand: this.data.brand,
                model: this.data.model,
                system: this.data.system,
                version: this.data.version,
                platform: this.data.platform,
                transport: this.data.transportList[this.data.index],
                capacity: this.data.capacity,
                startSteps: stepList[30].step
              }
            });

            this.setData({
              curID: trackRes._id,
              isTracking: true
            });

            wx.startLocationUpdateBackground({
              success(res) {
                console.log("开启后台定位", res);
              },
              fail(err) {
                console.log("开启后台定位失败", err);
              }
            });

            let cnt = 10;
            wx.onLocationChange(async locationFn => {
              cnt++;
              if (cnt >= 10) {
                cnt = 0;
                try {
                  const networkRes = await wx.getNetworkType();
                  await db
                    .collection("track")
                    .doc(this.data.curID)
                    .update({
                      data: {
                        points: _.push(new db.Geo.Point(locationFn.longitude, locationFn.latitude)),
                        velos: _.push(locationFn.speed),
                        timestamps: _.push(new Date()),
                        networkTypes: _.push(networkRes.networkType),
                        isFront: _.push(this.data.isFront)
                      }
                    });
                } catch (err) {
                  console.error("网络类型获取或数据更新失败", err);
                }
              }
            });
          })
          .catch(err => {
            console.log("[onGetWeRunData] 失败：", err);
          });
      }
    });
  },

  // 结束记录
  endTrack: function () {
    const _this = this;
    const db = wx.cloud.database();
    wx.getWeRunData({
      success: res => {
        wx.cloud
          .callFunction({
            name: "echo",
            data: {
              // info 字段在云函数 event 对象中会被自动替换为相应的敏感数据
              info: wx.cloud.CloudID(res.cloudID)
            }
          })
          .then(res => {
            console.log("[onGetWeRunData] 收到 echo 回包：", res);
            let stepList = res.result.info.data.stepInfoList;

            db.collection("track")
              .doc(_this.data.curID)
              .get({
                success: function (res) {
                  let dist = 0;
                  for (let j in res.data.points) {
                    if (j == 0) continue;
                    dist += _this.GetDistance(
                      res.data.points[j - 1].latitude,
                      res.data.points[j - 1].longitude,
                      res.data.points[j].latitude,
                      res.data.points[j].longitude
                    );
                  }
                  let item = res.data;

                  // 人数
                  let passenger = parseInt(item["capacity"]) + 1;
                  let saving = 0;

                  // new logic
                  // 初始化统计结果
                  const result = new Map();
                  for (let [key, value] of _this.data.speedBtwwon.entries()) {
                    result.set(key, {
                      label: value.label,
                      count: 0,
                      totalTime: 0,
                      totalMeters: 0
                    });
                  }

                  // 计算每个速度对应的区间并统计数量和时间
                  item.velos.forEach(speed => {
                    _this.data.speedBtwwon.forEach((item, key) => {
                      const { min, max } = item || {};
                      if (speed >= min && speed <= max) {
                        const currentEntry = result.get(key);
                        currentEntry.count += 1;
                        currentEntry.totalTime += 1;
                        currentEntry.totalMeters += speed;
                        result.set(key, currentEntry);
                      }
                    });
                  });

                  // 计算省碳排放 旧版
                  // if (item["transport"] == "步行或骑行") saving = 292.4;
                  // else if (item["transport"] == "驾驶电动汽车") saving = 292.4 - 181.5 / passenger;
                  // else if (item["transport"] == "公共交通") saving = 292.4 - 20 / passenger;
                  // else aving = 292.4 - 292.4 / passenger;
                  // saving *= dist;

                  // 新逻辑
                  // 步行或骑行
                  const { totalMeters: totalMetersWalk = 0 } = result.get(0) || {};
                  const { totalMeters: totalMetersCycling = 0 } = result.get(1) || {};
                  const total = _this.roundToTwoKM(totalMetersWalk + totalMetersCycling);

                  const savingRate = [368.68, 184.34, 122.89, 92.17, 67.09];
                  saving += total * savingRate[passenger - 1];

                  // 公共交通
                  const { totalMeters: totalMetersCity = 0 } = result.get(4) || {};
                  const { totalMeters: totalMetersHighSpeed = 0 } = result.get(5) || {};

                  const cityRate = 337.05;
                  const highSpeedRate = 200.51;

                  const cityTotal = _this.roundToTwoKM(totalMetersCity);
                  const highSpeedTotal = _this.roundToTwoKM(totalMetersHighSpeed);

                  saving += cityTotal * cityRate;
                  saving += highSpeedTotal * highSpeedRate;
                  const arr = ["步行或骑行", "步行或骑行", "驾驶燃油汽车", "驾驶燃油汽车", "公共交通", "公共交通"];

                  let maxEntry = null;
                  let maxMeters = -Infinity;

                  for (const [key, value] of result.entries()) {
                    if (value.totalMeters > maxMeters) {
                      maxMeters = value.totalMeters;
                      maxEntry = {
                        key,
                        value
                      };
                    }
                  }
                  let transport = arr[maxEntry.key];

                  // 驾驶电动汽车
                  if (_this.data.transport === "驾驶电动汽车") {
                    transport = "驾驶电动汽车";
                    // 市区
                    const { totalMeters: totalMetersCity = 0 } = result.get(2) || {};
                    // 高速
                    const { totalMeters: totalMetersHighSpeed = 0 } = result.get(3) || {};

                    const cityTotal = _this.roundToTwoKM(totalMetersCity);
                    const highSpeedTotal = _this.roundToTwoKM(totalMetersHighSpeed);

                    // 电车市区节省碳比例
                    const savingCityRate = [308.68, 154.34, 102.89, 77.17, 61.74, 56.12];
                    // 电车高速节省碳比例
                    const savingHighSpeedRate = [170.87, 85.44, 56.95, 42.72, 34.17, 31.07];

                    saving += cityTotal * savingCityRate[passenger - 1];
                    saving += highSpeedTotal * savingHighSpeedRate[passenger - 1];
                  }

                  db.collection("track")
                    .doc(_this.data.curID)
                    .update({
                      data: {
                        endTime: new Date(),
                        endSteps: stepList[30].step,
                        distance: dist.toFixed(2),
                        carbSum: saving,
                        transport
                      }
                    })
                    .then(res => {
                      if (res.stats.updated == 1) {
                        console.log("行程记录成功！", res);
                        wx.showToast({
                          title: "行程记录成功!",
                          icon: "success",
                          duration: 2000
                        });
                        clearInterval(_this.data.myTimer);
                        _this.setData({
                          startTime: 0,
                          endTime: 0,
                          duration: 0,
                          capacity: 0,
                          index: _this.data.defaultIndex,
                          btnClass: "btn btn-default",
                          recordStatus: false
                        });
                        wx.stopLocationUpdate();
                        wx.offLocationChange();
                        _this.setList();
                        //_this.calcCarbon()
                        _this.updateCarbon();
                        _this.onLoad();
                      }
                    });
                }
              });
          })
          .catch(err => {
            console.log("[onGetWeRunData] 失败：", err);
          });
      }
    });
  },
  // 四舍五入并转公里
  roundToTwoKM(num) {
    if (num <= 0) return 0;
    return Math.round((num / 1000) * 100) / 100;
  },
  GetDistance: function (lat1, lng1, lat2, lng2) {
    let radLat1 = (lat1 * Math.PI) / 180.0;
    let radLat2 = (lat2 * Math.PI) / 180.0;
    let a = radLat1 - radLat2;
    let b = (lng1 * Math.PI) / 180.0 - (lng2 * Math.PI) / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return s;
  },

  // 出行方式选择
  bindPickerChange: function (e) {
    this.setData({
      endIndex: e.detail.value,
      transport: this.data.endTransportList[e.detail.value]
    });
  },

  bindCapacityChange: function (e) {
    this.setData({
      capacity: e.detail.value
    });
  },

  // 删除记录
  /*
  deleteRecord(e) {
    const db = wx.cloud.database()
    const _this = this
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
              //_this.calcCarbon()
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
  */
  onShow() {
    this.setData({
      isFront: true
    });
    wx.setNavigationBarTitle({
      title: "碳行家｜行程记录"
    });
    this.setData({
      userInfo: app.globalData.userInfo
    });
  },
  onHide() {
    this.setData({
      isFront: false
    });
  },
  onLoad: async function () {
    console.log(app)
    this.setData({
      userInfo: app.globalData.userInfo,
      testGroup: app.globalData.userInfo.testGroup
    });
    if (this.data.testGroup == 3) {
      wx.setNavigationBarColor({
        backgroundColor: "#D13A29",
        frontColor: "#ffffff"
      });
      this.setData({
        background: "linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)"
      });
    }
    const db = wx.cloud.database();
    const _ = db.command;
    const _this = this;
    this.carbRanking();
    wx.getSystemInfo({
      success(res) {
        _this.setData({
          brand: res.brand,
          model: res.model,
          system: res.system,
          version: res.version,
          platform: res.platform
        });

        wx.cloud.callFunction({
          name: "login",
          success: res => {
            _this.setData({
              openID: res.result.data._openid
            });
            _this.setList();
            let now = new Date();
            now.setHours(0, 0, 0, 0);

            wx.getLocation({
              type: "gcj02",
              success(loc) {
                let latitude = loc.latitude.toFixed(2);
                let longitude = loc.longitude.toFixed(2);
                console.log("Location: ", longitude, latitude);
                console.log(loc.speed, "speed");

                wx.request({
                  url: "https://geoapi.qweather.com/v2/city/lookup?key=df35576dc85c4dd19641b86b91b48190&location=" + longitude + "," + latitude,
                  success: async function (res) {
                    console.log(res.data.location[0]);
                    let city_id = res.data.location[0].id;
                    let city_name = res.data.location[0].adm2 + res.data.location[0].name;
                    wx.request({
                      url: "https://devapi.qweather.com/v7/air/now?key=df35576dc85c4dd19641b86b91b48190&location=" + city_id,
                      success: async function (res) {
                        let new_category = "";
                        let new_aqi = 0;
                        const airQuality = res.data.now.aqi;

                        // 处理空气质量数据
                        new_aqi = Math.min(
                          Math.round(
                            Math.max(
                              (airQuality * 50) / 12,
                              ((airQuality - 12) * 50) / 13.5,
                              ((airQuality - 35.5) * 50) / 20,
                              ((airQuality - 55.5) * 50) / 95,
                              airQuality - 0 + 50
                            ),
                            500
                          )
                        );
                        new_category =
                          new_aqi <= 50
                            ? "优"
                            : new_aqi <= 100
                            ? "良"
                            : new_aqi <= 150
                            ? "轻度污染"
                            : new_aqi <= 200
                            ? "中度污染"
                            : new_aqi <= 300
                            ? "重度污染"
                            : "严重污染";

                        _this.setData({
                          name: city_name,
                          aqi: res.data.now.aqi,
                          category: res.data.now.category
                        });
                      },
                      fail: function (err) {
                        console.log(err);
                      }
                    });
                  },
                  fail: function (err) {
                    console.log(err);
                  }
                });
              },
              fail: function (err) {
                console.log(err);
              }
            });

            db.collection("userInfo")
              .limit(1)
              .where({
                _openid: _this.data.openID
              })
              .get({
                success: function (res) {
                  _this.setData({
                    defaultIndex: res.data[0].basicInfo.trans,
                    index: res.data[0].basicInfo.trans
                  });
                },
                fail: console.error
              });

            // 查询上次未结束的tracking？
            db.collection("track")
              .orderBy("date", "desc")
              .limit(1)
              .where({
                _openid: _this.data.openID
              })
              .get({
                success: function (res) {
                  let prevTracking = _this.data.recordStatus;
                  _this.setData({
                    isTracking: !res.data[0].endTime,
                    curID: res.data[0]._id
                  });
                  if (!prevTracking && _this.data.recordStatus) _this.keepTracking();
                }
              });
          },
          fail: console.error
        });
      }
    });
  }
});
