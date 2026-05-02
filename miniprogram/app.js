//app.js

// ─── DEV MODE ────────────────────────────────────────────────────────────────
// 'off'       → real cloud calls, no shortcuts. Use for production builds.
// 'empty'     → mock cloud calls + registration prefill, but surveys are blank.
// 'prefilled' → mock cloud calls + registration prefill + every survey question
//               pre-answered so tester can click through.
const DEV_MODE_OPTION = 'prefilled'

const DEV_MODE = DEV_MODE_OPTION !== 'off'
const DEV_PREFILL_SURVEYS = DEV_MODE_OPTION === 'prefilled'
// ─── END DEV MODE ─────────────────────────────────────────────────────────────

App({
  // ── Coin store: tiny pub/sub so the floating coin-overlay component can
  //    react to coin changes without polling. ────────────────────────────
  _coinListeners: [],
  setTotalCoins: function(n) {
    this.globalData.totalCoins = n
    for (var i = 0; i < this._coinListeners.length; i++) {
      try { this._coinListeners[i](n) } catch (e) { console.error(e) }
    }
  },
  addTotalCoins: function(delta) {
    this.setTotalCoins((this.globalData.totalCoins || 0) + (delta || 0))
  },
  subscribeTotalCoins: function(fn) {
    this._coinListeners.push(fn)
    var self = this
    return function() {
      self._coinListeners = self._coinListeners.filter(function(f) { return f !== fn })
    }
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    // Always call init — home.js and information.js call wx.cloud.database() at
    // module load time (tab bar pages preloaded at startup). database() requires
    // init to have been *called* (sync), not *completed* (async). In tourist mode
    // init fails server-side but the sync registration still happens.
    wx.cloud.init({
      env: 'iluvcarb-0gzvs45g82b57f98',
      traceUser: !DEV_MODE,   // traceUser:true fetches openID — fails in tourist mode → 4x secinfo + timeout
    })

    if (DEV_MODE) {
      // Patch callFunction synchronously after init call — SDK does not replace
      // this method in its async completion callback, so the mock persists.
      // DEV: skip 'control' so testers always see a treatment video
      var CONDITIONS = ['US_better_than_China', 'China_better_than_US', 'no_text']
      var REWARD_CONFIG = require('./config/reward.js').REWARD_CONFIG
      var MOCKS = {
        saveConsent:        function() { return { success: true } },
        saveRegistration:   function() { return { success: true, coins_registration: REWARD_CONFIG.coins_registration } },
        saveSurveyResponse: function() { return { success: true } },
        assignCondition:    function() {
          var combo = Math.random() < 0.5 ? 'combo_A' : 'combo_B'
          var order = combo + (Math.random() < 0.5 ? '_order_1' : '_order_2')
          return {
            success: true,
            condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
            article_combination: combo,
            article_order: order,
          }
        },
        logArticleEvent:    function() { return { success: true } },
        logDebriefing:      function() { return { success: true } },
        completeSession:    function() {
          var inst = getApp()
          var coins = (inst && inst.globalData && inst.globalData.totalCoins) || 0
          return { success: true, coins_total: coins, reward_yuan: +(coins * REWARD_CONFIG.coins_to_yuan_rate).toFixed(2) }
        },
      }

      wx.cloud.callFunction = function (opts) {
        var mockFn = MOCKS[opts.name]
        if (mockFn) {
          console.log('[DEV] mock cloud:', opts.name, opts.data)
          var result = mockFn(opts.data || {})
          var resolved = { result: result }
          setTimeout(function() {
            if (opts.success) opts.success(resolved)
            if (opts.complete) opts.complete(resolved)
          }, 200)
          return Promise.resolve(resolved)
        } else {
          console.warn('[DEV] unmocked cloud call:', opts.name)
          var errMsg = 'DEV_MODE: no mock for ' + opts.name
          var stub = { result: null, errMsg: errMsg }
          if (opts.fail) opts.fail({ errMsg: errMsg })
          if (opts.complete) opts.complete({})
          // Resolve (not reject) so unmocked calls don't crash awaiters during dev.
          return Promise.resolve(stub)
        }
      }
    }

    // Pre-fetch recent trip records so 行程记录 / 个人积分 render instantly when
    // the user first taps those tabs. Skipped in dev mode where the cloud env
    // is not deployed; trip data lives in local storage only.
    if (!DEV_MODE) {
      var self = this
      setTimeout(function () {
        try {
          var db = wx.cloud.database()
          db.collection('track')
            .orderBy('endTime', 'desc')
            .limit(20)
            .get()
            .then(function (res) {
              self.globalData.recentTracksCache = {
                ts: Date.now(),
                records: (res && res.data) || [],
              }
            })
            .catch(function (err) {
              console.warn('[app] track prefetch failed', err)
            })
        } catch (e) {
          console.warn('[app] track prefetch threw', e)
        }
      }, 0)
    }
  },

  onShow: function(e) {
    console.log('event', e)
    this.globalData.shareTicket = e.shareTicket
    console.log('the share ticket is ', e.shareTicket)
  },

  // 全局常量
  constData: {
    TOTAL_TEST_GROUP_COUNT: {
      PHYSICS: 1,
      MONEY: 2,
      INFOMATION: 3,
    },
    VERSION_STYLE_COLOR: {
      CYAN: {
        Bar: '#419f8c',
        background: '#97baaf'
      },
      RED: {
        Bar: '#B82B1D',
        background: 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)',
      }
    }
  },

  // 全局用户数据
  globalData: {
    userInfo: null,
    openID: null,
    backgroundColorStyle: 'CYAN',
    shareTicket: null,
    // Experiment flow
    condition: '',
    articleCombination: '',
    articleOrder: '',
    totalCoins: 0,
    // True after the participant has watched the treatment video on news-feed
    // once. Re-entering news-feed via the tab bar should skip the video.
    videoShown: false,
    // Recent trip records cache shared between home (行程记录) and center (个人积分).
    // Populated lazily by either page; pre-fetched on launch when not in dev mode.
    recentTracksCache: null,
    // Dev mode — read by consent page and custom-tab-bar for visual indicator
    devMode: DEV_MODE,
    devPrefillSurveys: DEV_PREFILL_SURVEYS,
    devModeOption: DEV_MODE_OPTION,
  }
})
