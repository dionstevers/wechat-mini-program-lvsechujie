// Screen 3 — Entry Survey
// Hosts the survey-engine component with the entry survey config.
// Calls assignCondition on mount so the final-block brief can swap copy
// for control participants (no video sentence). On completion, just
// navigates to news-feed — assignCondition is idempotent server-side, so
// the early call is the authoritative one.

const app = getApp()
const { ENTRY_SURVEY } = require('../../config/survey-entry.js')

// TEST-ONLY override — forces every participant into the chosen condition
// regardless of what assignCondition returns. Set to '' to re-enable the
// real random assignment. Remove before review submission.
const TEST_CONDITION_OVERRIDE = ''

Page({
  data: {
    surveyConfig: null,
    condition: '',
    initialCoins: 0,
  },

  onLoad() {
    // If the participant has already been assigned (e.g. mid-survey
    // re-entry), use the cached value and skip the cloud call.
    const cached = (app.globalData && app.globalData.condition) || ''
    if (cached) {
      this._bootSurvey(TEST_CONDITION_OVERRIDE || cached)
      return
    }
    wx.showLoading({ title: '请稍候...', mask: true })
    wx.cloud.callFunction({
      name: 'assignCondition',
      success: (res) => {
        wx.hideLoading()
        const result = (res && res.result) || {}
        if (!result.success) return this._showError()
        app.globalData.condition = TEST_CONDITION_OVERRIDE || result.condition
        app.globalData.articleCombination = result.article_combination
        app.globalData.articleOrder = result.article_order
        this._bootSurvey(app.globalData.condition)
      },
      fail: () => {
        wx.hideLoading()
        this._showError()
      },
    })
  },

  _bootSurvey(condition) {
    this.setData({
      surveyConfig: ENTRY_SURVEY,
      condition,
      initialCoins: app.globalData.totalCoins || 0,
    })
  },

  onSurveyComplete(e) {
    // Persist running coin total before navigating
    if (e && e.detail && typeof e.detail.totalCoins === 'number') {
      app.setTotalCoins(e.detail.totalCoins)
    }
    // Stash completion bonus — news-feed awards it 0.5s after user clicks 继续
    if (ENTRY_SURVEY.lastBlockCoins) {
      app.globalData.pendingCoinsAfterVideo = ENTRY_SURVEY.lastBlockCoins
    }
    wx.switchTab({ url: '/pages/news-feed/news-feed' })
  },

  _showError() {
    wx.showModal({ title: '出错了', content: '请检查网络连接后重试', showCancel: false })
  },
})
