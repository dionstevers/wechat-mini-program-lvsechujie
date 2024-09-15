// pages/journal/journal.ts
import { updateColor } from "../../utils/colorschema";
import { getDistance, getLocation } from "../../utils/home.util";

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
        value: "长途出行",
        name: "长途出行"
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
    if (!this.data.endTransportList.length && !this.data.purposes.length) return wx.showToast({ title: "请至少选择一项" });

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
              curID: _this.data.currentItem._id,
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

          this.setData({ currentItem: null });
          this.findAbnormal();

          // 重载数据
          wx.cloud.callFunction({
            name: "updateUserInfo",
            data: {
              carbon: carbSum,
              // credit: 100 // 新逻辑，每次100，需要时解开
              credit: 25 // default increment
            }
          });
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
    updateColor();
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
  onShareAppMessage() {
    logEvent("Share App");
    return {
      title: "快来一起低碳出街~",
      path: `/pages/index/index?sharedFromID=${app.globalData.openID}`,
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
