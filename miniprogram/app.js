//app.js

// ─── DEV MODE ────────────────────────────────────────────────────────────────
// 'off'       → real cloud calls, no shortcuts. Use for production builds.
// 'empty'     → mock cloud calls, surveys are blank.
// 'prefilled' → mock cloud calls + every survey question pre-answered so tester
//               can click through.
const DEV_MODE_OPTION = 'off'

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
      env: 'cloudbase-d4ghbgqhq17d3a271',
      traceUser: !DEV_MODE,   // traceUser:true fetches openID — fails in tourist mode → 4x secinfo + timeout
    })

    if (DEV_MODE) {
      // Patch callFunction synchronously after init call — SDK does not replace
      // this method in its async completion callback, so the mock persists.
      // DEV: skip 'control' so testers always see a treatment video
      var CONDITIONS = ['treatment_neg', 'treatment_pos', 'no_text']
      var REWARD_CONFIG = require('./config/reward.js').REWARD_CONFIG
      var MOCKS = {
        saveConsent:        function() { return { success: true } },
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
          return {
            success: true,
            coins_total: coins,
            reward_yuan: +(coins * REWARD_CONFIG.coins_to_yuan_rate).toFixed(2),
            reward_paid: false,
            reward_paid_timestamp: null,
            reward_transaction_id: null,
          }
        },
        claimReward: function() {
          var inst = getApp()
          var coins = (inst && inst.globalData && inst.globalData.totalCoins) || 0
          return {
            success: true,
            reward_yuan: +(coins * REWARD_CONFIG.coins_to_yuan_rate).toFixed(2),
            transaction_id: 'DEV-' + Date.now(),
            dev: true,
          }
        },
        getParticipantState: function() {
          // Dev mode: in-session progress markers take precedence over the
          // static devScenario so the home / capsule button reLaunches the
          // app to the right page after the user has progressed.
          var inst = getApp()
          var g = (inst && inst.globalData) || {}
          if (g.rewardPaid) return _devStateForScenario('reward_paid_free_use')
          var scenario = g.devScenario || 'fresh'
          return _devStateForScenario(scenario)
        },
      }

      // Mirror the cloud-side scenario routing for dev mode (no DB).
      function _devStateForScenario(scenario) {
        var fresh = {
          success: true, exists: false, route: 'fresh', welcomeBack: '',
          coins_so_far: 0, reward_paid: false, reward_pay_in_flight: false,
          reward_yuan: 0, reward_paid_timestamp: null, reward_transaction_id: null,
          condition: null, article_combination: null, article_order: null,
        }
        if (scenario === 'fresh' || !scenario) return fresh
        var COINS_LANDING = 88, COINS_CONSENT = 50, COINS_EXIT_ENTRY = 88
        var base = { success: true, exists: true, reward_pay_in_flight: false, reward_yuan: 0,
          reward_paid_timestamp: null, reward_transaction_id: null,
          condition: 'control', article_combination: 'combo_A', article_order: 'combo_A_order_1' }
        switch (scenario) {
          case 'consented_no_entry':
            return Object.assign({}, base, { route: 'entry_survey', welcomeBack: '欢迎回来！请完成入门问卷',
              coins_so_far: COINS_LANDING + COINS_CONSENT, reward_paid: false })
          case 'entry_done_at_news_feed':
            return Object.assign({}, base, { route: 'news_feed', welcomeBack: '欢迎回来！约 2 分钟后将自动进入结束问卷',
              coins_so_far: COINS_LANDING + COINS_CONSENT + 50 + 200, reward_paid: false })
          case 'at_exit_survey':
            return Object.assign({}, base, { route: 'exit_survey', welcomeBack: '欢迎回来！请完成结束问卷',
              coins_so_far: COINS_LANDING + COINS_CONSENT + 50 + 200 + COINS_EXIT_ENTRY, reward_paid: false })
          case 'exit_done_no_debrief':
            return Object.assign({}, base, { route: 'debriefing', welcomeBack: '欢迎回来！请阅读说明并领取奖励',
              coins_so_far: COINS_LANDING + COINS_CONSENT + 50 + 200 + COINS_EXIT_ENTRY + 150, reward_paid: false })
          case 'debrief_done_no_reward':
            return Object.assign({}, base, { route: 'reward', welcomeBack: '欢迎回来！请领取您的奖励',
              coins_so_far: 626, reward_paid: false, reward_yuan: 7.11 })
          case 'reward_paid_free_use':
            return Object.assign({}, base, { route: 'news_feed_free', welcomeBack: '',
              coins_so_far: 704, reward_paid: true, reward_yuan: 8.00,
              reward_paid_timestamp: Date.now(), reward_transaction_id: 'DEV-' + Date.now() })
          case 'reward_pay_in_flight':
            return Object.assign({}, base, { route: 'reward', welcomeBack: '您的奖励正在发放，请稍候或重试',
              coins_so_far: 704, reward_paid: false, reward_pay_in_flight: true, reward_yuan: 8.00 })
          default:
            return fresh
        }
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
    // 2-minute clock that begins on first arrival at news-feed and triggers
    // the exit survey on expiry. Shared across home / news-feed / center
    // tabs so the countdown is consistent regardless of which tab is active.
    NEWS_TIMER_DURATION_MS: 2 * 60 * 1000,
    newsTimerStartTs: null,    // ms-since-epoch when the timer began (null = not started)
    exitSurveyFired: false,    // guard so only one tab's interval fires the redirect
    // Re-entry routing state — populated by getParticipantState in
    // pages/loading. Pages read these to render welcome banners and the
    // 已领取奖励 badge in 个人积分.
    welcomeBackBanner: '',
    rewardPaid: false,
    // True once the participant has clicked 领取奖励 at least once. Combined
    // with rewardPaid for "session closed" gating — once attempted, the
    // timer/video should never resurface, regardless of payout outcome.
    rewardAttempted: false,
    rewardYuan: 0,
    rewardPaidTimestamp: null,
    rewardTransactionId: null,
    // Hydrated from getParticipantState (`video_played`); pre-empts the
    // news-feed video overlay when the participant has already watched it.
    videoShown: false,
    // Dev-mode case the bootstrap router lands on without picker interaction.
    // Change to 'fresh' / 'consented_no_entry' / 'entry_done_at_news_feed' /
    // 'exit_done_no_debrief' / 'debrief_done_no_reward' / 'reward_paid_free_use' /
    // 'reward_pay_in_flight'.
    devScenario: 'fresh',
    // Recent trip records cache shared between home (行程记录) and center (个人积分).
    // Populated lazily by either page; pre-fetched on launch when not in dev mode.
    recentTracksCache: null,
    // Dev mode — read by consent page and custom-tab-bar for visual indicator
    devMode: DEV_MODE,
    devPrefillSurveys: DEV_PREFILL_SURVEYS,
    devModeOption: DEV_MODE_OPTION,
  }
})
