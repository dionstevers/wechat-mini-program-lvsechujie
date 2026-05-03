// Home page (行程记录) — simplified self-reported trip tracking.
// Location data collection is OFF: trips are timed locally and the user
// self-reports the transport mode + purpose.
//
// Storage:
// - In dev mode (no cloud env), records persist to wx.setStorageSync.
// - In production, records also write to db.collection('track').

import data from "./data";

const app = getApp();
const TRIP_STORAGE_KEY = "trip_records";
const TRIP_MAX_RECORDS = 100;

function isDevMode() {
  return !!(app.globalData && app.globalData.devMode);
}

function readLocalTrips() {
  try {
    return wx.getStorageSync(TRIP_STORAGE_KEY) || [];
  } catch (e) {
    return [];
  }
}

function writeLocalTrip(record) {
  const existing = readLocalTrips();
  const updated = [record, ...existing].slice(0, TRIP_MAX_RECORDS);
  wx.setStorageSync(TRIP_STORAGE_KEY, updated);
  return updated;
}

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
    wx.setNavigationBarTitle({ title: "行程记录" });
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
      _id: `${startTime}_${Math.random().toString(36).slice(2, 8)}`,
      transport: transports.join("、"),
      purpose: purposes.join("、"),
      calcTransport: transports[0] || "",
      date: startTime,
      endTime,
      carbSum,
    };

    try {
      writeLocalTrip(record);
      if (!isDevMode()) {
        // Best-effort cloud write in prod; failure already logged in dev mode.
        const db = wx.cloud.database();
        db.collection("track")
          .add({ data: record })
          .catch((e) => console.warn("[home] cloud save failed", e));
      }
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

  _refreshTodayRecords() {
    // Always render local first for instant paint.
    this._applyLocalRecords();
    if (isDevMode()) return;

    // Production: refresh from cloud and merge into the local view.
    const openid = app.globalData && app.globalData.openID;
    let q = wx.cloud.database().collection("track");
    if (openid) q = q.where({ _openid: openid });
    q.orderBy("endTime", "desc")
      .limit(20)
      .get()
      .then((res) => {
        const cloudList = (res && res.data) || [];
        const local = readLocalTrips();
        // Merge by _id, dedupe, sort by endTime desc.
        const seen = new Set();
        const merged = [...local, ...cloudList]
          .filter((r) => {
            const key = r._id || `${r.date}_${r.endTime}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
          .slice(0, 20);
        this.setData({ todayRecordList: merged, isRecordEmpty: merged.length === 0 });
        if (app.globalData) {
          app.globalData.recentTracksCache = { ts: Date.now(), records: merged };
        }
      })
      .catch((e) => console.warn("[home] cloud fetch failed, keeping local", e));
  },

  _applyLocalRecords() {
    try {
      const list = readLocalTrips().filter(
        (r) => r.endTime && Date.now() - r.endTime < 7 * ONE_DAY_MS
      );
      this.setData({ todayRecordList: list, isRecordEmpty: list.length === 0 });
      if (app.globalData) {
        app.globalData.recentTracksCache = { ts: Date.now(), records: list };
      }
    } catch (e) {
      console.error("[home] read tracks failed", e);
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
