// Screen 5a — Article Viewer
// Tracks open/close timestamps and reading time. Reading no longer awards
// coins or triggers the exit survey — the global 2-minute news-feed timer
// owns those concerns now.

const { ARTICLES } = require('../../config/articles.js')
const { ARTICLES_EN } = require('../../config/articles-en.js')

const app = getApp()

Page({
  data: {
    article: {},
    articleId: '',
    devMode: false,
    articleEn: null,
  },

  _openTimestamp: null,

  onLoad(options) {
    const articleId = options.id
    const article = ARTICLES[articleId] || {}
    const devMode = !!(app && app.globalData && app.globalData.devMode)
    const articleEn = devMode ? (ARTICLES_EN[articleId] || null) : null
    this.setData({ article, articleId, devMode, articleEn })
    this._openTimestamp = Date.now()
  },

  onUnload() {
    this._recordClose()
  },

  onHide() {
    // Also capture when navigating back (onHide fires before onUnload)
    this._recordClose()
  },

  _closeRecorded: false,

  _recordClose() {
    if (this._closeRecorded) return
    this._closeRecorded = true

    const closeTs = Date.now()
    const openTs = this._openTimestamp
    if (!openTs) return

    // Cloud-side reading-time accumulator stays for analytics.
    wx.cloud.callFunction({
      name: 'logArticleEvent',
      data: {
        eventType: 'close',
        articleId: this.data.articleId,
        openTimestamp: openTs,
        closeTimestamp: closeTs,
      },
    })
  },
})
