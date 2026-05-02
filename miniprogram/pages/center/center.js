// Center page (个人积分) — shows current reward (coins) + recent trip records.
// No location prompt, no login modal, no chart canvas. Reads coins from the
// shared globalData pub/sub and trip records from local storage (written by
// the home page). No cloud round-trip — works in dev mode without a deployed
// cloud env.

const app = getApp();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 7;
const TRIP_STORAGE_KEY = "trip_records";

Page({
  data: {
    coins: 0,
    yuan: "0.00",
    tripRecords: [],
    loaded: false,
    totalTrips: 0,
    totalCarbG: 0,
    totalDurationMin: 0,
  },

  _unsubCoins: null,

  onLoad() {
    // Hydrate coins from globalData immediately.
    const coins = (app.globalData && app.globalData.totalCoins) || 0;
    this.setData({ coins, yuan: this._yuanFromCoins(coins) });
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    wx.setNavigationBarTitle({ title: "个人积分" });

    // Subscribe to coin updates so the counter stays live.
    if (typeof app.subscribeTotalCoins === "function") {
      this._unsubCoins = app.subscribeTotalCoins((coins) => {
        this.setData({ coins, yuan: this._yuanFromCoins(coins) });
      });
    }

    // Read trips from local storage. Synchronous, instant — no spinner needed.
    this._fetchRecords();
  },

  onHide() {
    if (typeof this._unsubCoins === "function") {
      this._unsubCoins();
      this._unsubCoins = null;
    }
  },

  onUnload() {
    if (typeof this._unsubCoins === "function") {
      this._unsubCoins();
      this._unsubCoins = null;
    }
  },

  // ── Helpers ───────────────────────────────────────────────────────────────

  _yuanFromCoins(coins) {
    // REWARD_CONFIG.coins_to_yuan_rate = 1 / 88. Inline to avoid extra import.
    return ((coins || 0) / 88).toFixed(2);
  },

  _fetchRecords() {
    // Local first — instant.
    try {
      const all = wx.getStorageSync(TRIP_STORAGE_KEY) || [];
      const list = all.filter(
        (r) => r.endTime && Date.now() - r.endTime < RECENT_DAYS * ONE_DAY_MS
      );
      this._applyRecords(list);
      if (app.globalData) {
        app.globalData.recentTracksCache = { ts: Date.now(), records: list };
      }
    } catch (e) {
      console.error("[center] read tracks failed", e);
      this.setData({ loaded: true });
    }

    // Production: enrich with cloud records.
    if (app.globalData && app.globalData.devMode) return;
    const openid = app.globalData && app.globalData.openID;
    let q = wx.cloud.database().collection("track");
    if (openid) q = q.where({ _openid: openid });
    q.orderBy("endTime", "desc")
      .limit(20)
      .get()
      .then((res) => {
        const cloudList = (res && res.data) || [];
        const localList = wx.getStorageSync(TRIP_STORAGE_KEY) || [];
        const seen = new Set();
        const merged = [...localList, ...cloudList]
          .filter((r) => {
            const key = r._id || `${r.date}_${r.endTime}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .filter(
            (r) => r.endTime && Date.now() - r.endTime < RECENT_DAYS * ONE_DAY_MS
          )
          .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
        this._applyRecords(merged);
        if (app.globalData) {
          app.globalData.recentTracksCache = { ts: Date.now(), records: merged };
        }
      })
      .catch((e) => console.warn("[center] cloud fetch failed", e));
  },

  _applyRecords(list) {
    let totalCarbG = 0;
    let totalDurationMs = 0;
    list.forEach((r) => {
      totalCarbG += Number(r.carbSum) || 0;
      if (r.endTime && r.date) totalDurationMs += r.endTime - r.date;
    });
    this.setData({
      tripRecords: list,
      totalTrips: list.length,
      totalCarbG,
      totalDurationMin: Math.round(totalDurationMs / 60000),
      loaded: true,
    });
  },
});
