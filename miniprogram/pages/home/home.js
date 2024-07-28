// pages/home/home.ts
// TODO: refactor the page, move the database operations to backend
import Dialog from "@vant/weapp/dialog/dialog";
import { logEvent } from "../../utils/log";
import { getWeekRange } from "../../utils/time";
import { updateUserData, onCheckSignIn } from "../../utils/login";
import { updateColor } from "../../utils/colorschema";
import { getDistance, roundToKM } from "../../utils/home.util";
import data from "./data";

const app = getApp();
const db = wx.cloud.database();

Page({
  data,
  transporModalCancel() {
    this.setData({ transporModalHidden: true });
    this.resetSelector();
  },
  transporModalConfirm() {
    this.setData({ transporModalHidden: true });
    this.resetSelector();
    this.endTrack();
  },

  // 重置选择表单
  resetSelector() {
    const reasetEndTransportList = this.data.endTransportList.map(item => ({ ...item, checked: false }));
    const reasetPurposesList = this.data.purposes.map(item => ({ ...item, checked: false }));
    this.setData({ endTransportList: reasetEndTransportList, purposes: reasetPurposesList });
  },


  // Update the carbon saving list
  async updateCarbon() {
    const _this = this;

    let now = new Date();
    now.setHours(0, 0, 0, 0);

    const res = await db
      .collection("track")
      .where({ _openid: app.globalData.openID, date: db.command.gt(now) })
      .orderBy("date", "desc") //时间倒序查询
      .limit(1) //查一条
      .get();

    // 计算省碳总量
    const carbon = this.calcCarbon(res);
    // 计算积分 累加25
    this.updateLottery();
    // 更新用户总省碳量
    this.updateUserInfo(carbon);



  },

  // 计算碳总量
  calcCarbon(res) {
    let carbon = 0;
    let list = res.data;
    list.forEach(item => {
      if (item["date"]) item["date"] = item.date.getTime();
      if (item["endTime"]) item["endTime"] = item.endTime.getTime();
      let dist = 0;
      for (let j in item.record) {
        if (j == 0) continue;
        dist += getDistance(
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

    return carbon;
  },



  // Update recording list 今日出行记录

  
  async setList() {
    let now = new Date();
    now.setHours(0, 0, 0, 0);
    const res = await db
      .collection("track")
      .where({ _openid: app.globalData.openID, date: db.command.gt(now) })
      .orderBy("date", "desc")
      .limit(1)
      .get();

    let list = res.data;
    let isRecordEmpty = false;

    if (!list.length) {
      const res = await this.findAbnormal();
      list = res.data;
      isRecordEmpty = true;
    } else {
      const abnormalRes = this.findAbnormal(true);
      const abnormals = abnormalRes.data || [];
      this.setData({ showPoint: !!abnormals.length });
    }

    // 获取检测记录并转换分钟
    const [{ result }] = list || [];

    if (result) {
      this.data.schedules[0].totalTime = this.transMinute(result[0].totalTime);
      this.data.schedules[1].totalTime = this.transMinute(result[1].totalTime);
      this.data.schedules[2].totalTime = this.transMinute(result[2].totalTime + result[3].totalTime);
      this.data.schedules[3].totalTime = this.transMinute(result[4].totalTime + result[5].totalTime);
      this.data.schedules[4].totalTime = this.transMinute(result[6].totalTime);
      this.data.schedules[5].totalTime = this.transMinute(result[7].totalTime);

      //  筛选有记录的值
      const filterSchedules = this.data.schedules.filter(item => !!item.totalTime);
      const total = filterSchedules.reduce((a, b) => a + b.totalTime, 0);
      const showSchedules = filterSchedules.map(item => ({
        ...item,
        percentage: ((item.totalTime / total) * 100).toFixed(2) + "%"
      }));
      this.setData({ showSchedules });
    }

    list.forEach(item => {
      if (item["date"]) item["date"] = item.date.getTime();
      if (item["endTime"]) item["endTime"] = item.endTime.getTime();
      let dist = 0;
      for (let j in item.record) {
        if (j == 0) continue;
        dist += getDistance(
          item.record[j - 1]["points"].latitude,
          item.record[j - 1]["points"].longitude,
          item.record[j]["points"].latitude,
          item.record[j]["points"].longitude
        );
      }
      item["distance"] = parseFloat(dist.toFixed(2));
      item["carbSum"] = (item.carbSum || 0).toFixed(2);
    });

    this.setData({ todayRecordList: list.reverse(), isRecordEmpty });
  },

  async findAbnormal(isTotal = false) {
    if (isTotal) {
      let now = new Date();
      now.setHours(0, 0, 0, 0);

      return await db
        .collection("track")
        .where({
          _openid: app.globalData.openID,
          purpose: db.command.exists(false),
          date: db.command.gt(now)
        })
        .orderBy("date", "desc")
        .limit(1)
        .get();
    }

    return await db
      .collection("track")
      .where({
        _openid: app.globalData.openID,
        purpose: db.command.exists(false)
      })
      .orderBy("date", "desc")
      .limit(1)
      .get();
  },

  transMinute(val) {
    if (val <= 0) return 0;
    return Number((val / 120).toFixed(2));
  },

  // Start recording 记录值
  keepTracking: function () {
    let cnt = 10;
    wx.startLocationUpdateBackground({
      success: res => console.log("开启后台定位", res),
      fail: err => console.log("开启后台定位失败", err)
    });

    wx.onLocationChange(async locationFn => {
      cnt++;

      // TODO 此处可调节记录区间 单位-秒
      if (cnt >= 10) {
        cnt = 0;
        try {
          await db.collection("track").doc(this.data.curID)
            .update({
              data: {
                record: db.command.push({
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
            if (!res.confirm) return;
            _this.setData({ transporModalHidden: false });
          }
        });
      }
    }
    onCheckSignIn({
      message : "请先注册/登录并同意隐私条款"
    });
  },
  // 记录前隐私调用准备 弹窗
  async startTrackConfirm() {
    const res = await wx.getSetting();

    if (res.authSetting["scope.userLocationBackground"]) {
      this.onTrack();
    } else {
      await Dialog.confirm({
        title: "提示",
        message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”"
      });

      const settingRes = await wx.openSetting();

      // 禁用不自动开始 解开以下代码则自动开始
      // if (settingRes.authSetting["scope.userLocationBackground"]) {
      // this.onTrack();
      // }
    }
  },

  onTrack: function () {
    this.setData({
      btnClass: "btn btn-start",
      recordStatus: true,
      startTime: +new Date(),
      myTimer: setInterval(() => {
        this.setData({ duration: +new Date() - this.data.startTime });
      }, 1000)
    });

    wx.getWeRunData({
      complete: async res => {
        wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } });

        const { result = null } = (await wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } })) || {};
        const stepList = result.info.data ? result.info.data.stepInfoList : null;

        // 初始化当前的track记录
        const trackRes = await db.collection("track").add({
          data: {
            record: [],
            date: new Date(),
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
        this.setData({ curID: trackRes._id, isTracking: true });

        // 开始记录值
        this.keepTracking();
      }
    });
  },

  // End recording
  endTrack() {
    const _this = this;

    wx.getWeRunData({
      complete: async res => {
        const { result: resp = null } = (await wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } })) || {};
        const stepList = resp.info.data ? resp.info.data.stepInfoList : null;
        const res1 = await db.collection("track").doc(_this.data.curID).get();

        let dist = 0;
        for (let j in res1.data.record) {
          if (j == 0) continue;
          dist += getDistance(
            res1.data.record[j - 1].points.latitude,
            res1.data.record[j - 1].points.longitude,
            res1.data.record[j].points.latitude,
            res1.data.record[j].points.longitude
          );
        }
        let item = res1.data;

        // Passenger number
        let passenger = 1; //parseInt(item["capacity"]) + 1;
        let saving = 0;

        // new logic
        // Initialization
        const result = new Map();
        for (let [key, value] of _this.data.speedBetween.entries()) {
          result.set(key, { label: value.label, count: 0, totalTime: 0, totalMeters: 0 });
        }

        // Calculate the interval corresponding to each speed and count the quantity and time
        item.record.forEach(recordItem => {
          _this.data.speedBetween.forEach((item, key) => {
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
        const total = roundToKM(totalMetersWalk + totalMetersCycling);
        console.log(total, "----total----");

        const savingRate = [368.68, 184.34, 122.89, 92.17, 67.09];
        saving += total * savingRate[passenger - 1];

        // 公共交通 Public transportation
        const { totalMeters: totalMetersCity = 0 } = result.get(4) || {};
        const { totalMeters: totalMetersHighSpeed = 0 } = result.get(5) || {};

        const cityRate = 337.05;
        const highSpeedRate = 200.51;

        const cityTotal = roundToKM(totalMetersCity);
        const highSpeedTotal = roundToKM(totalMetersHighSpeed);

        saving += cityTotal * cityRate;
        saving += highSpeedTotal * highSpeedRate;

        // 地铁
        const { totalMeters: subwayTotalMeters = 0 } = result.get(6) || {};
        const subwayRate = 20;
        const subwayTotal = roundToKM(subwayTotalMeters);
        saving += subwayTotal * subwayRate;

        // 高铁
        const { totalMeters: trainTotalMeters = 0 } = result.get(7) || {};
        const trainRate = 8;
        const trainTotal = roundToKM(trainTotalMeters);
        saving += trainTotal * trainRate;

        const arr = ["步行或骑行", "步行或骑行", "燃油汽车", "燃油汽车", "公共交通", "公共交通", "地铁", "高铁"];

        let maxEntry = null;
        let maxMeters = -Infinity;

        for (const [key, value] of result.entries()) {
          if (value.totalMeters > maxMeters) {
            maxMeters = value.totalMeters;
            maxEntry = { key, value };
          }
        }

        const transport = arr[maxEntry.key];

        // 驾驶电动汽车 Electric vehicle
        if (_this.data.transport === "驾驶电动汽车" || _this.data.transport.includes("驾驶电动汽车")) {
          // 市区 City//
          const { totalMeters: totalMetersCity = 0 } = result.get(2) || {};
          // 高速 Highway//
          const { totalMeters: totalMetersHighSpeed = 0 } = result.get(3) || {};

          const cityTotal = roundToKM(totalMetersCity);
          const highSpeedTotal = roundToKM(totalMetersHighSpeed);

          const savingCityRate = [308.68, 154.34, 102.89, 77.17, 61.74, 56.12];
          const savingHighSpeedRate = [170.87, 85.44, 56.95, 42.72, 34.17, 31.07];

          saving += cityTotal * savingCityRate[passenger - 1];
          saving += highSpeedTotal * savingHighSpeedRate[passenger - 1];
        }

        console.log(saving, "----saving----");

        // 获取天气
        const { weather = null } = (await _this.setWeather()) || {};

        const trackRes = await db
          .collection("track")
          .doc(_this.data.curID)
          .update({
            data: {
              endTime: new Date(),
              endSteps: stepList ? stepList[30].step : null,
              distance: parseFloat(dist.toFixed(2)),
              carbSum: saving,
              transport: _this.data.transport,
              purpose: _this.data.purpose,
              calcTransport: transport,
              // 温度
              weather,
              // 记录检测出来的值
              result: Object.fromEntries(result.entries())
            }
          });

        if (trackRes.stats.updated == 1) {
          console.log("行程记录成功！", trackRes);
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
          _this.updateCarbon();
          // const carbon  = _this.calcCarbon(res)
          _this.reloadData();
        }
      }
    });
  },
  // Travel mode selection 出行方式选择事件
  bindPickerChange(e) {
    this.setData({ endIndex: e.detail.value, transport: e.detail.value });
  },

  // 出行目的选择事件
  bindPurposeChange(e) {
    this.setData({ purpose: e.detail.value });
  },

  // 出行人数选择事件
  // bindCapacityChange(e) {
  //   this.setData({ capacity: e.detail.value });
  // },

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

 

  async reloadData() {
    const _ = db.command;
    const _this = this;
    // this.updateWeeklyRanking();

    const res = await wx.getSystemInfo();

    _this.setData({
      brand: res.brand,
      model: res.model,
      system: res.system,
      version: res.version,
      platform: res.platform
    });

    const settingRes = await wx.getSetting();
    if (settingRes.authSetting["scope.userLocationBackground"]) {
      const sendParams = await this.setWeather();
      // canceled geolocation function
      // wx.cloud.callFunction({
      //   name: "addLocation",
      //   data: { sendParams },
      //   fail: err => console.log("error==", err)
      // });
    } else {
      Dialog.confirm({
        title: "提示",
        message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”"
      }).then(() => {
        // on confirm
        wx.openSetting().then(settingRes => {
          if (settingRes.authSetting["scope.userLocationBackground"]) {
            _this.onTrack();
          }
        });
      });
    }

    _this.setList();
    let now = new Date();
    now.setHours(0, 0, 0, 0);

    const userInfoRes = await db.collection("userInfo").limit(1).where({ _openid: app.globalData.openID }).get();

    _this.setData({ defaultIndex: userInfoRes.data[0].basicInfo.trans, index: userInfoRes.data[0].basicInfo.trans });

    // Query the last unfinished tracking？
    const trackRes = await db
      .collection("track")
      .orderBy("date", "desc")
      .limit(1)
      .where({
        _openid: app.globalData.openID
      })
      .get();

    let prevTracking = _this.data.recordStatus;
    _this.setData({ isTracking: !trackRes.data[0].endTime, curID: trackRes.data[0]._id });
    if (!prevTracking && _this.data.recordStatus) _this.keepTracking();
  },








// @DEMI : code below are already refactored by Yuandong


 // 小程序初始化生命周期
 onLoad(options) {
  // 当程序切换到后台时触发
  // TODO 待确定是否可用？
  //wx.onAppHide(this.onHide);

  // 转发朋友圈链接，导航到登录页面
  if (options.isFromShareTimeline) {
    wx.navigateTo({
      url: `/pages/index/index?sharedFromID=${options.sharedFromID}`,
      success: () => this.setData({ isFromShareTimeline: false })
    });
  } else {
    this.setData({ isFromShareTimeline: false });
  }
},

  onShow() {
    // 朋友圈进来则不显示
    if (this.data.isFromShareTimeline) return;
 
    // 更新颜色
    updateColor();
    // update the carbon ranking
    
    // 检查登录状态
    updateUserData();
    onCheckSignIn({ message: "请您登录", success: () => this.initData() });
    logEvent("Home Page");
    wx.setNavigationBarTitle({ title: "碳行家｜行程记录" });
    this.updateWeeklyRanking();
  },



  // set geolocation, air quality index , and weather
  // cloud function call : getlocation, setweather 

  setWeather() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: "gcj02",
        success: (loc) => {
          const latitude = loc.latitude.toFixed(2);
          const longitude = loc.longitude.toFixed(2);
          console.log("Location:", longitude, latitude);
  
          wx.cloud.callFunction({
            name: 'setweather',
            data: { latitude, longitude },
            success: (res) => {
              const { cityName, aqi, category, weather } = res.result;
              this.setData({
                name: cityName,
                aqi,
                category,
                weather,
                latitude,
                longitude,
              });
              resolve({
                openid: app.globalData.openID,
                cityName,
                latitude,
                longitude,
                weather,
              });
            },
            fail: (err) => {
              console.error('Error calling cloud function:', err);
              reject(err);
            }
          });
        },
        fail: (err) => {
          console.error('Error getting location:', err);
          reject(err);
        }
      });
    });
  },
   // Function to update the weekly ranking
  async updateWeeklyRanking() {
    const { firstDayOfWeek } = getWeekRange();
    try {
      const result = await wx.cloud.callFunction({
        name: 'updateweeklyranking',
        data: { firstDayOfWeek }
      });
      const rankedUsers = result.result.rankedUsers;
  
      this.setData({ users: rankedUsers });
      const currentUser = rankedUsers.find(user => user._openid === app.globalData.openID);
      if (currentUser) {
        this.setData({ mysaving: currentUser.totalCarbSum, myranking: currentUser.rank });
      } else {
        this.setData({ mysaving: "<1", myranking: "未上榜" });
      }
      return rankedUsers;
    } catch (error) {
      console.error("Error updating weekly ranking:", error);
    }
  },
  
  // four functions below are dedicated for sharing 
  shareCommon() {
    return {
      title: "我本周已省碳" + this.data.mysaving + "kg，你也来试试吧！",
      imageUrl:
        "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function (res) {
        console.log(res);
      },
      fail: function (res) {
        console.log(res);
      }
    };
  },

  onShareTimeline() {
    logEvent("Share App");
    return {
      ...this.shareCommon(),
      query: `sharedFromID=${app.globalData.openID}&isFromShareTimeline=true`
    };
  },

  onShareAppMessage() {
    logEvent("Share App");
    return {
      ...this.shareCommon(),
      path:`/pages/index/index?sharedFromID=${app.globalData.openID}`,
    }
  },
  
  onClickTrackCard() {
    wx.navigateTo({ url: "/pages/track/track" });
  },



  //// @DEMI: these functions should be moved please see cloud function updateCredits

    // 更新lottery
    async updateLottery(credit) {
      const res = await db.collection("lottery").where({ _openid: app.globalData.openID }).get();
      const userId = res.data[0]._id;
  
      // 凌晨4点？ 
      const four = new Date();
      four.setHours(4, 0, 0, 0);
  
      const { data: list = [] } =
        (await db
          .collection("track")
          .where({ _openid: app.globalData.openID, date: db.command.gt(four) })
          .get()) || {};
  
      if (Array.isArray(list) && list.length) {
        db.collection("lottery")
          .doc(userId)
          // 累加25积分
          .update({ data: { credit: db.command.inc(credit) } });
      }
    },
  
    // 更新总省碳量
    async updateUserInfo(carbon) {
      const res = await db.collection("userInfo").where({ _openid: app.globalData.openID }).get();
      const userId = res.data[0]._id;
  
      db.collection("userInfo")
        .doc(userId)
        // 累加省碳
        .update({ data: { carbSum: db.command.inc(carbon) } });
    },
});

