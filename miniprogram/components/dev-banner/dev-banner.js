const app = getApp()

Component({
  data: {
    devMode: false,
    devLabel: '',
    dimmed: false,
  },
  attached() {
    const on = !!(app && app.globalData && app.globalData.devMode)
    const opt = (app && app.globalData && app.globalData.devModeOption) || ''
    this.setData({
      devMode: on,
      devLabel: opt ? `DEV_MODE [${opt}]` : 'DEV_MODE',
    })
  },
  methods: {
    onTap() {
      this.setData({ dimmed: !this.data.dimmed })
    },

    onLongPress() {
      // Dev-only scenario picker — long-press the banner to jump the
      // bootstrap router to a specific re-entry state. Calls setDevState
      // (mocked in dev), then reLaunches into pages/loading so the
      // dispatcher routes based on the new state.
      const labels = [
        '全新（无记录）',
        '已同意，未注册',
        '已注册，未做入门问卷',
        '已完成入门，进入信息中心',
        '已完成结束问卷，未阅读说明',
        '已读说明，未领取奖励',
        '已发放奖励（自由模式）',
        '奖励发放卡住（in_flight 未清）',
      ]
      const scenarios = [
        'fresh',
        'consented_no_registration',
        'registered_no_entry',
        'entry_done_at_news_feed',
        'exit_done_no_debrief',
        'debrief_done_no_reward',
        'reward_paid_free_use',
        'reward_pay_in_flight',
      ]
      wx.showActionSheet({
        itemList: labels,
        success: (res) => {
          const scenario = scenarios[res.tapIndex]
          if (!scenario) return
          wx.cloud.callFunction({
            name: 'setDevState',
            data: { scenario },
            complete: () => {
              if (app.globalData) {
                // Reset transient flags so the dispatcher computes fresh.
                app.globalData.newsTimerStartTs = null
                app.globalData.exitSurveyFired = false
                app.globalData.videoShown = false
                app.globalData.welcomeBackBanner = ''
                app.globalData.totalCoins = 0
              }
              wx.reLaunch({ url: '/pages/loading/loading' })
            },
          })
        },
      })
    },
  },
})
