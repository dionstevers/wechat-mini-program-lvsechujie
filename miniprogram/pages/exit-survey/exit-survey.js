// Screen 6 — Exit Survey
// Loads EXIT_SURVEY config and delegates to survey-engine component.
// Triggered when the global 2-minute news-feed timer expires (or by the
// dev-skip button on the news-feed page).
// On completion, navigates to debriefing.

const app = getApp()
const { EXIT_SURVEY } = require('../../config/survey-exit.js')

Page({
  data: {
    surveyConfig: null,
    condition: '',
    trigger: '',
    initialCoins: 0,
  },

  onLoad() {
    const trigger = wx.getStorageSync('exit_survey_trigger') || ''
    const condition = app.globalData.condition || ''
    this.setData({
      surveyConfig: EXIT_SURVEY,
      condition,
      trigger,
      initialCoins: app.globalData.totalCoins || 0,
    })
    // Mark the exit survey as started server-side so a mid-survey
    // re-entry routes back here instead of to the news-feed. Idempotent
    // — saveSurveyResponse spreads responses into the participant doc;
    // re-writes to the same field are no-ops semantically. Fire and
    // forget.
    wx.cloud.callFunction({
      name: 'saveSurveyResponse',
      data: {
        surveyType: 'exit',
        responses: { exit_survey_started_timestamp: new Date() },
        coinsEarned: 0,
        isFinal: false,
        timestamps: null,
      },
    })
  },

  onSurveyComplete(e) {
    if (e && e.detail && typeof e.detail.totalCoins === 'number') {
      app.setTotalCoins(e.detail.totalCoins)
    }
    wx.redirectTo({ url: '/pages/debriefing/debriefing' })
  },

  _showError() {
    wx.showModal({ title: '出错了', content: '请检查网络连接后重试', showCancel: false })
  },
})
