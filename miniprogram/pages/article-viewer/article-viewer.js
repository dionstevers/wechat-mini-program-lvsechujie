// Screen 5a — Article Viewer
// Tracks open/close timestamps and reading time.
// Sets article_read_trigger in storage if reading time ≥ 5s.

const { ARTICLES } = require('../../config/articles.js')

const READ_THRESHOLD_MS = 5000 // 5 seconds

Page({
  data: {
    article: {},
    articleId: '',
  },

  _openTimestamp: null,

  onLoad(options) {
    const articleId = options.id
    const article = ARTICLES[articleId] || {}
    this.setData({ article, articleId })
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

    const durationMs = closeTs - openTs

    // Log to cloud
    wx.cloud.callFunction({
      name: 'logArticleEvent',
      data: {
        eventType: 'close',
        articleId: this.data.articleId,
        openTimestamp: openTs,
        closeTimestamp: closeTs,
      },
    })

    // Set exit trigger if reading time threshold met
    if (durationMs >= READ_THRESHOLD_MS) {
      wx.setStorageSync('article_read_trigger', true)
    }
  },
})
