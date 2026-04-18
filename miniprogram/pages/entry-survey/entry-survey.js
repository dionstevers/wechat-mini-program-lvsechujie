// Screen 3 — Entry Survey
// Hosts the survey-engine component with the entry survey config.
// On completion, calls assignCondition then navigates to news-feed.

const app = getApp()
const { ENTRY_SURVEY } = require('../../config/survey-entry.js')

Page({
  data: {
    surveyConfig: null,
    condition: '',
  },

  onLoad() {
    this.setData({ surveyConfig: ENTRY_SURVEY })
  },

  onSurveyComplete() {
    // Entry survey submitted — now assign condition server-side
    wx.showLoading({ title: '请稍候...', mask: true })
    wx.cloud.callFunction({
      name: 'assignCondition',
      success: (res) => {
        wx.hideLoading()
        const result = res.result
        if (result.success) {
          // Store assignment in globalData for use on news-feed page
          app.globalData.condition = result.condition
          app.globalData.articleCombination = result.article_combination
          app.globalData.articleOrder = result.article_order
          wx.redirectTo({ url: '/pages/news-feed/news-feed' })
        } else {
          this._showError()
        }
      },
      fail: () => {
        wx.hideLoading()
        this._showError()
      },
    })
  },

  _showError() {
    wx.showModal({ title: '出错了', content: '请检查网络连接后重试', showCancel: false })
  },
})
