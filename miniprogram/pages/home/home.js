// pages/home/home.ts
import Dialog from "@vant/weapp/dialog/dialog";
import { logEvent } from "../../utils/log";
import { getWeekRange } from "../../utils/time";
import { updateUserData, onCheckSignIn } from "../../utils/login";
import { updateColor } from "../../utils/colorschema";
import {GetDistance} from '../../utils/homeUtils'
const app = getApp();

Page({
  data: {
    mysaving: 0,
    myranking: "未上榜",
    testGroup: null,
    colorStyle: null,
    background: null,
    isFromShareTimeline: true,
    users: [],
    recordStatus: false,
    btnClass: "btn btn-default",
    todayRecordList: [],
    isRecordEmpty: true,
    userInfo: null,
    // Temporary record information
    startTime: 0,
    endTime: 0,
    duration: 0,
    // User data
    openID: "",
    brand: "",
    model: "",
    system: "", //Phone OS
    version: "", //WeChat version
    platform: "",
    curID: "",
    transport: "步行",
    transportList: ["步行或骑行", "公共交通", "电动汽车", "燃油汽车"],
    purpose: [],
    purposes: [
      {
        value: "上班",
        name: "上班"
      },
      {
        value: "上学",
        name: "上学"
      },
      {
        value: "吃饭",
        name: "吃饭"
      },
      {
        value: "其他",
        name: "其他"
      }
    ],
    endTransportList: [
      {
        value: "步行",
        name: "步行"
      },
      {
        value: "自行车(共享单车)",
        name: "自行车(共享单车)"
      },
      {
        value: "电动自行车",
        name: "电动自行车"
      },
      {
        value: "公交车",
        name: "公交车"
      },
      {
        value: "驾驶/乘坐燃油汽车",
        name: "驾驶/乘坐燃油汽车"
      },
      {
        value: "驾驶/乘坐电动汽车",
        name: "驾驶/乘坐电动汽车"
      },
      {
        value: "地铁",
        name: "地铁"
      },
      {
        value: "高铁",
        name: "高铁"
      }
    ],
    index: 0,
    endIndex: 0,
    defaultIndex: 0,
    capacity: 0,
    capacityList: ["1", "2", "3", "4", "5+"],
    // isFront: true,
    aqi: "",
    name: "",
    category: "",
    transporModalHidden: true,
    // capacityModalHidden: true,
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

  transporModalConfirm(e) {
    this.setData({
      transporModalHidden: true
    });

    const reasetEndTransportList = this.data.endTransportList.map(item => ({ ...item, checked: false }));
    const reasetPurposesList = this.data.purposes.map(item => ({ ...item, checked: false }));
    this.setData({ endTransportList: reasetEndTransportList, purposes: reasetPurposesList });
    this.endTrack();
  },
  // Show carbon footprint savings in database top_n
  // Import the function that gets the week range

  // Function to update the weekly ranking
  async updateWeeklyRanking() {
    const db = wx.cloud.database();
    var { firstDayOfWeek, lastDayOfWeek } = getWeekRange();
    const $ = db.command.aggregate;
    const _ = db.command;
    try {
      var f = new Date(firstDayOfWeek),
        a = $.dateFromString({
          dateString: f.toJSON()
        });
      const ranking = await db
        .collection("track")
        .aggregate()
        .addFields({
          matched: $.gte(["$endTime", a])
        })
        // Filter documents where 'matched' is true
        .match({
          matched: true
        })
        .group({
          _id: "$_openid",
          totalCarbSum: $.sum("$carbSum")
        })
        .sort({
          totalCarbSum: -1
        })
        .limit(10)
        .end();
      console.log("the ranking", ranking);

      // Now, fetch user details from the userInfo collection for the top users
      const topUserOpenIds = ranking.list.map(item => item._id);
      const userDetails = await db
        .collection("userInfo")
        .where({
          _openid: _.in(topUserOpenIds)
        })
        .get();
      console.log("the users", userDetails);
      // Combine user details with their total carb sums
      const rankedUsers = userDetails.data.map(user => {
        const userAggregate = ranking.list.find(agg => agg._id === user._openid);
        return {
          ...user,
          totalCarbSum: Math.ceil(userAggregate ? userAggregate.totalCarbSum : 0),
          rank: topUserOpenIds.indexOf(user._openid) + 1
        };
      });
      console.log("the ranked users", rankedUsers);
      // Optionally sort by rank (if needed, since they should already be in order)
      rankedUsers.sort((a, b) => a.rank - b.rank);
      console.log(rankedUsers);

      this.setData({ users: rankedUsers });
      const currentUser = rankedUsers.find(user => user._openid === this.data.openID);
      if (currentUser) {
        this.setData({
          mysaving: currentUser.totalCarbSum,
          myranking: currentUser.rank
        });
      } else {
        this.setData({
          mysaving: "<1",
          myranking: "未上榜"
        });
      }
      return rankedUsers;
    } catch (error) {
      console.error("Error updating weekly ranking:", error);
      throw error;
    }
  },
  // Calculate the distance from aqi base station
  calcDist: async function (triplet, i) {
    const db = wx.cloud.database();
    const { data } = await db
      .collection("monitor")
      .where({
        POI_ID: triplet[2][i].id
      })
      .get();
    const { POI_Latitude: mlat, POI_Longitude: mlng } = data[0];
    return GetDistance(triplet[0], triplet[1], mlat, mlng);
  },
  // Find the closest aqi base station
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
  // Update aqi data
  updateAQI: function (res, closest) {
    this.setData({
      aqi: res.data.station[closest].aqi,
      name: res.data.station[closest].name,
      category: res.data.station[closest].category
    });
  },
  // Update the carbon saving list
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
            for (let j in item.record) {
              if (j == 0) continue;
              dist += GetDistance(
                item.record[j - 1]["points"].latitude,
                item.record[j - 1]["points"].longitude,
                item.record[j]["points"].latitude,
                item.record[j]["points"].longitude
              );
            }
            item["distance"] = parseFloat(dist.toFixed(2));
            let passenger = 1; //parseInt(item["capacity"]) + 1;

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
  // Update recording list
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
            for (let j in item.record) {
              if (j == 0) continue;
              dist += GetDistance(
                item.record[j - 1]["points"].latitude,
                item.record[j - 1]["points"].longitude,
                item.record[j]["points"].latitude,
                item.record[j]["points"].longitude
              );
            }

            item["distance"] = parseFloat(dist.toFixed(2));
            item["carbSum"] = item.carbSum.toFixed(2);
          });

          _this.setData({
            todayRecordList: list.reverse(),
            isRecordEmpty: list.length == 0
          });
        }
      });
  },

  // Start recording
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
          console.log;
          await db
            .collection("track")
            .doc(this.data.curID)
            .update({
              data: {
                // networkTypes: _.push(networkRes.networkType),
                // isFront: _.push(this.data.isFront),
                record: _.push({
                  points: new db.Geo.Point(locationFn.longitude, locationFn.latitude),
                  velos: locationFn.speed,
                  timestamps: new Date()
                })
              }
            });
        } catch (err) {
          console.error("网络类型获取或数据更新失败", err);
        }
      }
    });
  },
  // End recording
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
        this.onTrack();
        // this.setData({
        //   capacityModalHidden: false
        // });
      } else {
        Dialog.confirm({
          title: "提示",
          message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”"
        })
          .then(() => {
            // on confirm
            wx.openSetting().then(settingRes => {
              if (settingRes.authSetting["scope.userLocationBackground"]) {
                this.onTrack();
                // this.setData({
                //   capacityModalHidden: false
                // });
              }
            });
          })
          .catch(() => {
            // on cancel
          });
        // wx.showModal({
        //   title: "提示",
        //   content: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”"
        // }).then(modalRes => {
        //   if (modalRes.confirm) {
        //     wx.authorize({scope: 'scope.userLocationBackground'}).catch(res=>{console.error(res)})
        //     wx.openSetting().then(settingRes => {
        //       if (settingRes.authSetting["scope.userLocationBackground"]) {
        //         this.onTrack();
        //         // this.setData({
        //         //   capacityModalHidden: false
        //         // });
        //       }
        //     });
        //   }
        // });
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
      complete: async res => {
        wx.cloud.callFunction({
          name: "echo",
          data: {
            info: wx.cloud.CloudID(res.cloudID)
          }
        });

        const { result = null } =
          (await wx.cloud.callFunction({
            name: "echo",
            data: {
              info: wx.cloud.CloudID(res.cloudID)
            }
          })) || {};

        const stepList = result.info.data ? result.info.data.stepInfoList : null;

        const trackRes = await db.collection("track").add({
          data: {
            date: new Date(),
            record: [],
            // networkTypes: [],
            // isFront: [],
            brand: this.data.brand,
            model: this.data.model,
            system: this.data.system,
            version: this.data.version,
            platform: this.data.platform,
            transport: this.data.transportList[this.data.index],
            capacity: this.data.capacity,
            startSteps: stepList ? stepList[30].step : null
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
                    // networkTypes: _.push(networkRes.networkType),
                    // isFront: _.push(this.data.isFront),
                    record: _.push({
                      points: new db.Geo.Point(locationFn.longitude, locationFn.latitude),
                      velos: locationFn.speed,
                      timestamps: new Date()
                    })
                  }
                });
            } catch (err) {
              console.error("网络类型获取或数据更新失败", err);
            }
          }
        });
      }
    });
  },

  // End recording
  endTrack: function () {
    const _this = this;
    const db = wx.cloud.database();
    wx.getWeRunData({
      complete: async res => {
        const { result = null } =
          (await wx.cloud.callFunction({
            name: "echo",
            data: {
              // info 字段在云函数 event 对象中会被自动替换为相应的敏感数据
              info: wx.cloud.CloudID(res.cloudID)
            }
          })) || {};

        const stepList = result.info.data ? result.info.data.stepInfoList : null;

        db.collection("track")
          .doc(_this.data.curID)
          .get({
            success: function (res) {
              let dist = 0;
              for (let j in res.data.record) {
                if (j == 0) continue;
                dist += GetDistance(
                  res.data.record[j - 1].points.latitude,
                  res.data.record[j - 1].points.longitude,
                  res.data.record[j].points.latitude,
                  res.data.record[j].points.longitude
                );
              }
              let item = res.data;

              // Passenger number
              let passenger = 1; //parseInt(item["capacity"]) + 1;
              let saving = 0;

              // new logic
              // Initialization
              const result = new Map();
              for (let [key, value] of _this.data.speedBtwwon.entries()) {
                result.set(key, {
                  label: value.label,
                  count: 0,
                  totalTime: 0,
                  totalMeters: 0
                });
              }

              // Calculate the interval corresponding to each speed and count the quantity and time
              item.record.forEach(recordItem => {
                _this.data.speedBtwwon.forEach((item, key) => {
                  const { min, max } = item || {};
                  const { velos: speed = 0 } = recordItem || {};

                  if (speed >= min && speed <= max) {
                    const currentEntry = result.get(key);
                    currentEntry.count += 1;
                    currentEntry.totalTime += 1;
                    currentEntry.totalMeters += speed;
                    result.set(key, currentEntry);
                  }
                });
              });

              // New logic
              // 步行或骑行 Walk or cycle//
              const { totalMeters: totalMetersWalk = 0 } = result.get(0) || {};
              const { totalMeters: totalMetersCycling = 0 } = result.get(1) || {};
              const total = _this.roundToTwoKM(totalMetersWalk + totalMetersCycling);
              console.log(total, "----total----");

              const savingRate = [368.68, 184.34, 122.89, 92.17, 67.09];
              saving += total * savingRate[passenger - 1];

              // 公共交通 Public transportation
              const { totalMeters: totalMetersCity = 0 } = result.get(4) || {};
              const { totalMeters: totalMetersHighSpeed = 0 } = result.get(5) || {};

              const cityRate = 337.05;
              const highSpeedRate = 200.51;

              const cityTotal = _this.roundToTwoKM(totalMetersCity);
              const highSpeedTotal = _this.roundToTwoKM(totalMetersHighSpeed);

              saving += cityTotal * cityRate;
              saving += highSpeedTotal * highSpeedRate;
              const arr = ["步行或骑行", "步行或骑行", "燃油汽车", "燃油汽车", "公共交通", "公共交通"];

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

              console.log(result, "----result----");

              // 驾驶电动汽车 Electric vehicle
              if (_this.data.transport === "驾驶电动汽车" || _this.data.transport.includes("驾驶电动汽车")) {
                // transport = "驾驶电动汽车";
                // 市区 City//
                const { totalMeters: totalMetersCity = 0 } = result.get(2) || {};
                // 高速 Highway//
                const { totalMeters: totalMetersHighSpeed = 0 } = result.get(3) || {};

                const cityTotal = _this.roundToTwoKM(totalMetersCity);
                const highSpeedTotal = _this.roundToTwoKM(totalMetersHighSpeed);

                const savingCityRate = [308.68, 154.34, 102.89, 77.17, 61.74, 56.12];

                const savingHighSpeedRate = [170.87, 85.44, 56.95, 42.72, 34.17, 31.07];

                saving += cityTotal * savingCityRate[passenger - 1];
                saving += highSpeedTotal * savingHighSpeedRate[passenger - 1];
              }

              console.log(saving, "----saving----");

              db.collection("track")
                .doc(_this.data.curID)
                .update({
                  data: {
                    endTime: new Date(),
                    endSteps: stepList ? stepList[30].step : null,
                    distance: parseFloat(dist.toFixed(2)),
                    carbSum: saving,
                    transport: _this.data.transport,
                    purpose: _this.data.purpose,
                    calcTransport: transport
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
                    _this.reloadData();
                  }
                });
            }
          });
      }
    });
  },
  // Round to kilometers
  roundToTwoKM(num) {
    if (num <= 0) return 0;
    return Math.round((num / 1000) * 100) / 100;
  },


  // Travel mode selection
  bindPickerChange: function (e) {
    this.setData({
      endIndex: e.detail.value,
      transport: e.detail.value
    });
  },

  bindPurposeChange: function (e) {
    this.setData({
      purpose: e.detail.value
    });
  },

  bindCapacityChange: function (e) {
    this.setData({
      capacity: e.detail.value
    });
  },

  /**
   * 初始化本页面数据，此函数使用闭包，多次调用只会初始化一次
   */
  initData() {
    if (!this.initData.executed) {
      this.reloadData();

      this.initData.executed = true;
      console.log("home页面初始化成功！");
    } else {
      console.log("home页面已经初始化过了！");
    }
  },

  onLoad(options) {
    // 转发朋友圈链接，导航到登录页面
    if (options.isFromShareTimeline) {
      wx.navigateTo({
        url: `/pages/index/index?sharedFromID=${options.sharedFromID}`,
        success: () => {
          this.setData({
            isFromShareTimeline: false
          });
        }
      })
    } else {
      this.setData({
        isFromShareTimeline: false
      });
    }
  },

  onShow() {
    // 朋友圈进来则不显示
    if (this.data.isFromShareTimeline) {
      return;
    }

    // 更新颜色
    updateColor();

    // 检查登录状态
    updateUserData();
    onCheckSignIn({
      message : '请您登录',
      success : async () => {
        this.initData();
      }
    });

    logEvent("Home Page");
    const _this = this;
    // this.setData({
    //   isFront: true
    // });

    wx.setNavigationBarTitle({
      title: "碳行家｜行程记录"
    });

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
            wx.getSetting().then(res => {
              if (res.authSetting["scope.userLocationBackground"]) {
                // this.onTrack();
                // this.setData({
                //   capacityModalHidden: false
                // });
                wx.getLocation({
                  type: "gcj02",
                  success(loc) {
                    let latitude = loc.latitude.toFixed(2);
                    let longitude = loc.longitude.toFixed(2);
                    console.log("Location: ", longitude, latitude);
                    console.log(loc.speed, "speed");
                    // this.startTrackConfirm()
                    wx.request({
                      url: "https://geoapi.qweather.com/v2/city/lookup?key=df35576dc85c4dd19641b86b91b48190&location=" + longitude + "," + latitude,
                      success: async function (res) {
                        console.log('测试数据==',res.data.location[0]);
                        let city_id = res.data.location[0].id;
                        let city_name = res.data.location[0].adm2 + res.data.location[0].name;
                        wx.request({
                          url: "https://devapi.qweather.com/v7/air/now?key=df35576dc85c4dd19641b86b91b48190&location=" + city_id,
                          success: async function (res) {
                            let new_category = "";
                            let new_aqi = 0;
                            const airQuality = res.data.now.aqi;

                            // 温度/湿度获取
                            wx.request({
                              url:
                                "https://devapi.qweather.com/v7/weather/now?key=df35576dc85c4dd19641b86b91b48190&location=" +
                                longitude +
                                "," +
                                latitude,
                              success: async function (weather) {
                                if (!weather.data.now) return;

                                // now.setHours(0, 0, 0, 0);
                                // db.collection("weather").add({
                                //   data: {
                                //     longitude,
                                //     latitude,
                                //     date: new Date(),
                                //     ...(res.data.now || {})
                                //   }
                                // })

                                wx.cloud.callFunction({
                                  name: "addLocation",
                                  data: {
                                    sendParams: {
                                      openid: app.globalData.openID,
                                      city_name,
                                      latitude,
                                      longitude,
                                      weather: weather.data.now
                                    }
                                  },
                                  fail: err => {
                                    console.log("error==", err);
                                  }
                                });
                              },
                              fail: function (err) {
                                console.log(err);
                              }
                            });

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
                                ? "优" //
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
                    console.error(err);
                  }
                });
              }
            });
            // _this.startTrackConfirm()
          },
          fail: console.error
        });
      }
    });
  },

  onHide() {
    // this.setData({
    //   isFront: false
    // });
  },
  
  async reloadData() {
    const db = wx.cloud.database();
    const _ = db.command;
    const _this = this;
    this.updateWeeklyRanking();
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
            wx.getSetting().then(res => {
              if (res.authSetting["scope.userLocationBackground"]) {
                // this.onTrack();
                // this.setData({
                //   capacityModalHidden: false
                // });
                wx.getLocation({
                  type: "gcj02",
                  success(loc) {
                    let latitude = loc.latitude.toFixed(2);
                    let longitude = loc.longitude.toFixed(2);
                    console.log("Location: ", longitude, latitude);
                    console.log(loc.speed, "speed");
                    // this.startTrackConfirm()
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

                            wx.request({
                              url:
                                "https://devapi.qweather.com/v7/weather/now?key=df35576dc85c4dd19641b86b91b48190&location=" +
                                longitude +
                                "," +
                                latitude,
                              success: async function (weather) {
                                if (!weather.data.now) return;

                                wx.cloud.callFunction({
                                  name: "addLocation",
                                  data: {
                                    sendParams: {
                                      openid: app.globalData.openID,
                                      city_name,
                                      latitude,
                                      longitude,
                                      weather: weather.data.now
                                    }
                                  },
                                  fail: err => {
                                    console.log("error==", err);
                                  }
                                });
                              }
                            });

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
                                ? "优" //
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
                    console.error(err);
                  }
                });
              } else {
                Dialog.confirm({
                  title: "提示",
                  message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”"
                })
                  .then(() => {
                    // on confirm
                    wx.openSetting().then(settingRes => {
                      if (settingRes.authSetting["scope.userLocationBackground"]) {
                        _this.onTrack();
                        // this.setData({
                        //   capacityModalHidden: false
                        // });
                      }
                    });
                  })
                  .catch(() => {
                    // on cancel
                  });
                // wx.showModal({
                //   title: "提示",
                //   content: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”"
                // }).then(modalRes => {
                //   if (modalRes.confirm) {
                //     wx.authorize({scope: 'scope.userLocationBackground'}).catch(res=>{console.error(res)})
                //     wx.openSetting().then(settingRes => {
                //       if (settingRes.authSetting["scope.userLocationBackground"]) {
                //         this.onTrack();
                //         // this.setData({
                //         //   capacityModalHidden: false
                //         // });
                //       }
                //     });
                //   }
                // });
              }
            });
            _this.setList();
            let now = new Date();
            now.setHours(0, 0, 0, 0);
            // _this.startTrackConfirm()

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

            // Query the last unfinished tracking？
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
  },

  onhide() {
    if (!this.data.recordStatus) return;
    this.endTrack();
  },

  onShareTimeline(){
    logEvent('Share App')
    return{
      title:"我本周已省碳" + this.data.mysaving + "kg，你也来试试吧！",
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      query:`sharedFromID=${this.data.openID}&isFromShareTimeline=true`,
      success: function(res){
        console.log(res)
      },fail: function (res){console.log(res)}
    }
  },

  onShareAppMessage() {
    logEvent('Share App')
    return {
      title: "我本周已省碳" + this.data.mysaving + "kg，你也来试试吧！",
      path: "/pages/index/index?id=" + this.data.openID,
      imageUrl:
        "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function (res) {
        console.log(res.shareTickets[0]);
      },
      fail: function (res) {
        console.log("share failed");
      }
    };
  }
});
