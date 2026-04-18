//app.js

// ─── DEV MODE ────────────────────────────────────────────────────────────────
// Set to true to bypass all cloud function calls with mock responses.
// Set to false (or delete this block) before launching the real version.
const DEV_MODE = true
// ─── END DEV MODE ─────────────────────────────────────────────────────────────

App({
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
      var CONDITIONS = ['US_better_than_China', 'China_better_than_US', 'no_text', 'control']
      var MOCKS = {
        saveConsent:        function() { return { success: true } },
        saveRegistration:   function() { return { success: true, coins_registration: 10 } },
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
        completeSession:    function() { return { success: true, coins_total: 120, reward_yuan: 6.00 } },
      }

      wx.cloud.callFunction = function (opts) {
        var mockFn = MOCKS[opts.name]
        if (mockFn) {
          console.log('[DEV] mock cloud:', opts.name, opts.data)
          var result = mockFn(opts.data || {})
          setTimeout(function() {
            if (opts.success) opts.success({ result: result })
            if (opts.complete) opts.complete({ result: result })
          }, 200)
        } else {
          console.warn('[DEV] unmocked cloud call:', opts.name)
          if (opts.fail) opts.fail({ errMsg: 'DEV_MODE: no mock for ' + opts.name })
          if (opts.complete) opts.complete({})
        }
      }
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
    // Dev mode — read by consent page and custom-tab-bar for visual indicator
    devMode: DEV_MODE,
  }
})
