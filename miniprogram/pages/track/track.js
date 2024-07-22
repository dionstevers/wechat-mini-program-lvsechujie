// pages/journal/journal.ts

import { getDistance, roundToKM } from "../../utils/home.util";

const db = wx.cloud.database();
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    endIndex: 0,
    transport: "步行",
    purpose: [],
    abnormals: [],
    todayRecordList: [],
    transporModalHidden: true,
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
    currentItem: null,
    speedBetween: [
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
      },
      {
        label: "地铁",
        min: 8.33,
        max: 16.67
      },
      {
        label: "高铁",
        min: 55.56,
        max: 111.11
      }
    ],
    purposes: [
      {
        value: "通勤",
        name: "通勤"
      },
      {
        value: "休闲娱乐",
        name: "休闲娱乐"
      },
      {
        value: "医疗健康",
        name: "医疗健康"
      },
      {
        value: "旅游",
        name: "旅游"
      },
      {
        value: "其他",
        name: "其他"
      }
    ]
  },

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

    this.setData({ todayRecordList: list.reverse() });
  },

  async findAbnormal() {
    const res = await db
      .collection("track")
      .where({
        _openid: app.globalData.openID,
        purpose: db.command.exists(false)
      })
      .orderBy("date", "desc")
      .get();

    const abnormals = res.data || [];

    abnormals.forEach(item => {
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

    this.setData({ abnormals });
  },

  onClickTrackCard(e) {
    const { currentTarget } = e || {};
    const { dataset } = currentTarget || {};
    const { item: currentItem } = dataset || {};

    this.setData({ currentItem });
    this.setData({ transporModalHidden: false });
  },

  // Travel mode selection 出行方式选择事件
  bindPickerChange(e) {
    this.setData({ endIndex: e.detail.value, transport: e.detail.value });
  },

  // 出行目的选择事件
  bindPurposeChange(e) {
    this.setData({ purpose: e.detail.value });
  },

  transporModalConfirm(e) {
    this.setData({ transporModalHidden: true });
    this.resetSelector();
    this.endTrack();
  },

  transporModalCancel() {
    this.setData({ transporModalHidden: true });
    this.resetSelector();
  },

  // 重置选择表单
  resetSelector() {
    const reasetEndTransportList = this.data.endTransportList.map(item => ({ ...item, checked: false }));
    const reasetPurposesList = this.data.purposes.map(item => ({ ...item, checked: false }));
    this.setData({ endTransportList: reasetEndTransportList, purposes: reasetPurposesList });
  },

  // End recording
  endTrack() {
    const _this = this;

    wx.getWeRunData({
      complete: async res => {
        const { result: resp = null } = (await wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } })) || {};
        const stepList = resp.info.data ? resp.info.data.stepInfoList : null;

        let dist = 0;
        for (let j in this.data.currentItem.record || []) {
          if (j == 0) continue;
          dist += getDistance(
            this.data.currentItem.record[j - 1].points.latitude,
            this.data.currentItem.record[j - 1].points.longitude,
            this.data.currentItem.record[j].points.latitude,
            this.data.currentItem.record[j].points.longitude
          );
        }
        let item = this.data.currentItem;

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

        const trackRes = await db
          .collection("track")
          .doc(_this.data.currentItem._id)
          .update({
            data: {
              endTime: new Date(),
              endSteps: stepList ? stepList[30].step : null,
              distance: parseFloat(dist.toFixed(2)),
              carbSum: saving,
              transport: _this.data.transport,
              purpose: _this.data.purpose,
              calcTransport: transport,
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

          this.setData({ currentItem: null });
          this.findAbnormal();
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.findAbnormal();
    this.setList();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 更新颜色
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});
