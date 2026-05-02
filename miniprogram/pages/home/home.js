// Home page (行程记录) — simplified self-reported trip tracking.
// Location data collection is OFF: trips are timed locally and the user
// self-reports the transport mode + purpose. Records persist to
// db.collection('track') so the center page (个人积分) can show them too.

import data from "./data";

const app = getApp();
const db = wx.cloud.database();

// Approximate carbon-saving factor (g CO₂ per minute) per transport mode.
// Used only for display; not a precise calculation.
const CARB_FACTORS_G_PER_MIN = {
  "步行": 30,
  "自行车(共享单车)": 28,
  "电动自行车": 18,
  "公交车": 10,
  "地铁": 12,
  "高铁": 8,
  "燃油汽车": 0,
  "电动汽车": 5,
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function calcCarbSum(transports, durationMs) {
  if (!Array.isArray(transports) || transports.length === 0) return 0;
  const minutes = Math.max(1, Math.round(durationMs / 60000));
  // Average factor across selected transports.
  const total = transports.reduce(
    (acc, t) => acc + (CARB_FACTORS_G_PER_MIN[t] || 0),
    0
  );
  return Math.round((total / transports.length) * minutes);
}

Page({
  data,

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  onLoad() {
    this.setData({ isFromShareTimeline: false });
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    wx.setNavigationBarTitle({ title: "碳行家｜行程记录" });
    // Render from cache if available, then refresh in background.
    const cache = app.globalData && app.globalData.recentTracksCache;
    if (cache && cache.records) {
      this.setData({ todayRecordList: cache.records });
    }
    setTimeout(() => this._refreshTodayRecords(), 0);
  },

  onUnload() {
    if (this.data.myTimer) clearInterval(this.data.myTimer);
  },

  // ── Tab switching ─────────────────────────────────────────────────────────

  selectTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab });
  },

  // ── Tracking: start / stop primary button ─────────────────────────────────

  onClickEvent() {
    if (!this.data.isTracking) {
      // Start flow: open transport selector first.
      this.setData({ show: true });
    } else {
      // Stop flow: confirm, then ask for purpose before saving.
      wx.showModal({
        title: "提示",
        content: "要结束本次行程记录吗？",
        success: (res) => {
          if (!res.confirm) return;
          this.setData({ showPurposes: true });
        },
      });
    }
  },

  // ── Transport modal ───────────────────────────────────────────────────────

  onClickTransportation(e) {
    const arr = [...(this.data.transport || [])];
    const v = e.currentTarget.dataset.tp;
    const i = arr.indexOf(v);
    if (i !== -1) arr.splice(i, 1);
    else arr.push(v);
    this.setData({ transport: arr });
  },

  onTransportModalClose() {
    this.setData({ show: false, transport: [] });
  },

  onConfirmTransport() {
    if (!this.data.transport.length) {
      return wx.showToast({ icon: "none", title: "请选择出行方式" });
    }
    this.setData({ show: false });
    if (!this.data.isTracking) {
      this._startTracking();
    } else {
      // Returning to confirm — proceed to purpose.
      this.setData({ showPurposes: true });
    }
  },

  // ── Purpose modal ─────────────────────────────────────────────────────────

  onClickPurpose(e) {
    const arr = [...(this.data.purpose || [])];
    const v = e.currentTarget.dataset.purpose;
    const i = arr.indexOf(v);
    if (i !== -1) arr.splice(i, 1);
    else arr.push(v);
    this.setData({ purpose: arr });
  },

  onPurposeModalClose() {
    this.setData({ showPurposes: false, purpose: [] });
  },

  onConfirmPurpose() {
    if (!this.data.purpose.length) {
      return wx.showToast({ icon: "none", title: "请选择出行目的" });
    }
    this.setData({ showPurposes: false });
    this._endTracking();
  },

  // ── Tracking internal helpers ─────────────────────────────────────────────

  _startTracking() {
    if (this.data.myTimer) clearInterval(this.data.myTimer);
    const startTime = Date.now();
    const myTimer = setInterval(() => {
      this.setData({ duration: Date.now() - this.data.startTime });
    }, 1000);
    this.setData({
      isTracking: true,
      recordStatus: true,
      startTime,
      startNowTime: nowHHMM(),
      duration: 0,
      myTimer,
    });
  },

  async _endTracking() {
    const endTime = Date.now();
    const startTime = this.data.startTime || endTime;
    const duration = endTime - startTime;
    const transports = this.data.transport || [];
    const purposes = this.data.purpose || [];
    const carbSum = calcCarbSum(transports, duration);

    // Stop timer immediately so UI updates.
    if (this.data.myTimer) clearInterval(this.data.myTimer);
    this.setData({
      isTracking: false,
      recordStatus: false,
      myTimer: null,
      duration: 0,
      startTime: 0,
    });

    const record = {
      transport: transports.join("、"),
      purpose: purposes.join("、"),
      calcTransport: transports[0] || "",
      date: startTime,
      endTime,
      carbSum,
    };

    try {
      await db.collection("track").add({ data: record });
    } catch (e) {
      console.error("[home] save track failed", e);
      wx.showToast({ icon: "none", title: "保存失败，请重试" });
    }

    // Reset modal state, refresh list.
    this.setData({ transport: [], purpose: [] });
    wx.showToast({ title: "行程记录成功!", icon: "success", duration: 1500 });
    this._refreshTodayRecords();
  },

  // ── Records query ─────────────────────────────────────────────────────────

  async _refreshTodayRecords() {
    try {
      const openid = app.globalData && app.globalData.openID;
      let q = db.collection("track");
      if (openid) q = q.where({ _openid: openid });
      const res = await q.orderBy("endTime", "desc").limit(20).get();
      const list = (res.data || []).filter(
        (r) => r.endTime && Date.now() - r.endTime < 7 * ONE_DAY_MS
      );
      this.setData({ todayRecordList: list, isRecordEmpty: list.length === 0 });
      // Update shared cache so center page can render instantly.
      if (app.globalData) {
        app.globalData.recentTracksCache = { ts: Date.now(), records: list };
      }
    } catch (e) {
      console.error("[home] fetch tracks failed", e);
    }
  },

  // ── Share menu (kept for share-from-timeline compatibility) ───────────────

  shareCommon() {
    return { title: "碳行家｜低碳出街小助手" };
  },
  onShareTimeline() {
    return { ...this.shareCommon() };
  },
  onShareAppMessage() {
    return { ...this.shareCommon() };
  },
});
