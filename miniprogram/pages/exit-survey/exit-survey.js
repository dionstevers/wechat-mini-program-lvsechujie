// Screen 6 — Exit Survey
// Loads EXIT_SURVEY config and delegates to survey-engine component.
// Triggered by article_read (≥5s reading) or inactivity_timeout (60s).
// On completion, navigates to debriefing.

const app = getApp()
const { EXIT_SURVEY } = require('../../config/survey-exit.js')

Page({
  data: {
    surveyConfig: null,
    condition: '',
    trigger: '',
  },

  onLoad() {
    const trigger = wx.getStorageSync('exit_survey_trigger') || ''
    const condition = app.globalData.condition || ''
    this.setData({ surveyConfig: EXIT_SURVEY, condition, trigger })
  },

  onSurveyComplete() {
    wx.redirectTo({ url: '/pages/debriefing/debriefing' })
  },

  _showError() {
    wx.showModal({ title: '出错了', content: '请检查网络连接后重试', showCancel: false })
  },
})
