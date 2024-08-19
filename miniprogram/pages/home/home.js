import data from "./data";
import { requestSubs } from "../../utils/requestSubs";
import Dialog from "@vant/weapp/dialog/dialog";
import { logEvent } from "../../utils/log";
import { getWeekRange } from "../../utils/time";
import { updateUserData, onCheckSignIn } from "../../utils/login";
import { updateColor } from "../../utils/colorschema";
import { getLocation } from "../../utils/home.util";

const app = getApp();
const db = wx.cloud.database();

Page({
  data,
  setWeather() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: "gcj02",
        success: loc => {
          const latitude = loc.latitude.toFixed(2);
          const longitude = loc.longitude.toFixed(2);
          console.log("Location:", longitude, latitude);

          wx.cloud.callFunction({
            name: "setweather",
            data: { latitude, longitude },
            success: res => {
              const { cityName, aqi, category, weather } = res.result;
              this.setData({
                name: cityName,
                aqi,
                category,
                weather,
                latitude,
                longitude
              });
              resolve({
                openid: app.globalData.openID,
                cityName,
                latitude,
                longitude,
                weather
              });
            },
            fail: err => {
              console.error("Error calling cloud function:", err);
              reject(err);
            }
          });
        },
        fail: err => {
          console.error("Error getting location:", err);
          reject(err);
        }
      });
    });
  },

  // Travel mode selection

  bindPickerChange(e) {
    this.setData({ endIndex: e.detail.value, transport: e.detail.value });
  },
  // 出行目的选择事件
  bindPurposeChange(e) {
    this.setData({ purpose: e.detail.value });
  },
  onClickTrackCard() {
    wx.navigateTo({ url: "/pages/track/track" });
  },
  transporModalCancel() {
    this.resetSelector();
    this.setData({ transporModalHidden: true });
  },
  transporModalConfirm() {
    if (!this.data.endTransportList.length && !this.data.purposes.length) return wx.showToast({ title: "请至少选择一项" });
    this.resetSelector();
    this.setData({ transporModalHidden: true });
    this.endTrack();
  },
  resetSelector() {
    const reasetEndTransportList = this.data.endTransportList.map(item => ({ ...item, checked: false }));
    const reasetPurposesList = this.data.purposes.map(item => ({ ...item, checked: false }));
    this.setData({ endTransportList: reasetEndTransportList, purposes: reasetPurposesList });
  },
  // 记录前隐私调用准备 弹窗
  async checkSetting(autoStart) {
    const settingRes = await wx.getSetting();
    if (!settingRes.authSetting["scope.userLocationBackground"]) {
      await Dialog.confirm({ title: "提示", message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”" });
      await wx.openSetting();
    } else {
      autoStart && this.onTrack();

      // 如果需要使用，解开注释 未验证是否可运行，云函数setweather问题请联系yuandong处理
      wx.getLocation({
        type: "gcj02",
        success: async loc => {
          const latitude = loc.latitude.toFixed(2);
          const longitude = loc.longitude.toFixed(2);

          const { result: sendParams } = (await wx.cloud.callFunction({ name: "setweather", data: { longitude, latitude } })) || {};
          wx.cloud.callFunction({
            name: "addLocation",
            data: { sendParams },
            fail: err => console.log("error==", err)
          });
        }
      });
    }
  },
  // 刷新今日最新出行记录
  async refreshLastTrack() {
    // 今日出行记录
    const {
      result: { showPoint, isRecordEmpty, list }
    } = (await wx.cloud.callFunction({ name: "getLastTrack" })) || {};

    // 行程百分比分析
    const { result: showSchedules } = (await wx.cloud.callFunction({ name: "getTrackRange", data: { list } })) || {};
    this.setData({ showPoint, showSchedules, todayRecordList: list.reverse(), isRecordEmpty });
    return list;
  },
  // Start recording 记录值
  startTracking: function () {
    let cnt = 10;
    wx.startLocationUpdateBackground({
      success: res => console.log("开启后台定位", res),
      fail: err => console.error("开启后台定位失败", err)
    });
    wx.onLocationChange(async locationFn => {
      cnt++;
      // 此处可调节记录区间 单位->秒
      if (cnt >= 10) {
        cnt = 0;
        await wx.cloud.callFunction({
          name: "updateTrack",
          data: {
            curID: this.data.curID,
            recordItem: { timestamps: new Date(), velos: locationFn.speed, points: new db.Geo.Point(locationFn.longitude, locationFn.latitude) }
          }
        });
      }
    });
  },
  onClickEvent() {
    if (this.data.userInfo != null) {
      if (!this.data.recordStatus) {
        this.checkSetting(true);
        requestSubs();
      } else {
        wx.showModal({
          title: "提示",
          content: "要结束本次行程记录吗？",
          success: res => res.confirm && this.setData({ transporModalHidden: false })
        });
      }
    }
    onCheckSignIn({ message: "请先注册/登录并同意隐私条款" });
  },
  // Start recording
  onTrack() {
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
        const { result: trackId } =
          (await wx.cloud.callFunction({
            name: "createTrack",
            data: {
              brand: this.data.brand,
              model: this.data.model,
              system: this.data.system,
              version: this.data.version,
              platform: this.data.platform,
              capacity: this.data.capacity,
              startSteps: stepList ? stepList[30].step : null,
              transport: this.data.transportList[this.data.index]
            }
          })) || {};

        this.setData({ curID: trackId, isTracking: true });
        // 开始记录值
        this.startTracking();
      }
    });
  },
  // End recording
  endTrack() {
    const _this = this;
    // 该方法不支持Promise，仅支持回调
    wx.getWeRunData({
      complete: async res => {
        const { result: resp = null } = (await wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } })) || {};
        const stepList = resp.info.data ? resp.info.data.stepInfoList : null;

        const { latitude, longitude } = await getLocation();
        const {
          result: { carbSum, trackRes }
        } =
          (await wx.cloud.callFunction({
            name: "endTrack",
            data: {
              stepList,
              latitude,
              longitude,
              curID: _this.data.curID,
              purpose: _this.data.purpose,
              transport: _this.data.transport
            }
          })) || {};

        if (trackRes.stats.updated == 1) {
          console.log("行程记录成功！", trackRes);
          wx.showToast({ title: "行程记录成功!", icon: "success", duration: 2000 });
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

          // 重载数据
          _this.refreshLastTrack();
          wx.cloud.callFunction({ name: "updateUserInfo", data: { carbon: carbSum } });
        }
      }
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

  async reloadData() {
    // 系统信息
    const res = await wx.getSystemInfo();
    this.setData({ brand: res.brand, model: res.model, system: res.system, version: res.version, platform: res.platform });

    // 检查用户是否禁用后台设置
    this.checkSetting();

    // 渲染今日最新数据
    const track = await this.refreshLastTrack();
    const userInfoRes = await db.collection("userInfo").limit(1).where({ _openid: app.globalData.openID }).get();
    this.setData({
      curID: track[0]._id,
      isTracking: !track[0].endTime,
      index: userInfoRes.data[0].basicInfo.trans,
      defaultIndex: userInfoRes.data[0].basicInfo.trans
    });
  },
  onLoad(options) {
    // 转发朋友圈链接，导航到登录页面
    if (!options.isFromShareTimeline) return this.setData({ isFromShareTimeline: false });

    wx.navigateTo({
      url: `/pages/index/index?sharedFromID=${options.sharedFromID}`,
      success: () => this.setData({ isFromShareTimeline: false })
    });
  },
  onShow() {
    // 朋友圈进来则不显示
    if (this.data.isFromShareTimeline) return;

    // 更新颜色
    updateColor();
    // 检查登录状态
    updateUserData();
    logEvent("Home Page");
    this.updateWeeklyRanking();
    wx.setNavigationBarTitle({ title: "碳行家｜行程记录" });
    onCheckSignIn({ message: "请您登录", success: () => this.initData() });
    this.setWeather();
  },

  // Function to update the weekly ranking
  async updateWeeklyRanking() {
    const { firstDayOfWeek } = getWeekRange();
    try {
      const result = await wx.cloud.callFunction({
        name: "updateweeklyranking",
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
  // below are dedicated for sharing
  shareCommon() {
    return {
      title: "我本周已省碳" + this.data.mysaving + "kg，你也来试试吧！",
      imageUrl:
        "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313"
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
      path: `/pages/index/index?sharedFromID=${app.globalData.openID}`
    };
  }
});
