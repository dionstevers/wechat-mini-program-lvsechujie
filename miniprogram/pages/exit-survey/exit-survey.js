// Screen 6 — Exit Survey
// Loads EXIT_SURVEY config and delegates to survey-engine component.
// Triggered when the global 2-minute news-feed timer expires (or by the
// dev-skip button on the news-feed page).
// On completion, navigates to debriefing.

const app = getApp()
const { EXIT_SURVEY } = require('../../config/survey-exit.js')
const { onHomeNudge } = require('../../utils/home-nudge.js')

Page({
  data: {
    surveyConfig: null,
    condition: '',
    trigger: '',
    initialCoins: 0,
  },

  onLoad() {
    if (wx.hideHomeButton) wx.hideHomeButton()
    const trigger = wx.getStorageSync('exit_survey_trigger') || ''
    const condition = app.globalData.condition || ''
    this.setData({
      surveyConfig: EXIT_SURVEY,
      condition,
      trigger,
      initialCoins: app.globalData.totalCoins || 0,
    })
  },

  onHomeNudge,

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
