// Screen 4+5 — Video Overlay + News Feed
// Loads treatment video (if assigned), then shows two article cards.
// Triggers exit survey after article read (≥5s) or 60s inactivity.

const app = getApp()
const { ARTICLES, ARTICLE_COMBINATIONS } = require('../../config/articles.js')
const { VIDEO_CONFIG } = require('../../config/videos.js')

// Article display ordering
const ORDER_MAP = {
  combo_A_order_1: ['article_1_pos', 'article_2_neg'],
  combo_A_order_2: ['article_2_neg', 'article_1_pos'],
  combo_B_order_1: ['article_1_neg', 'article_2_pos'],
  combo_B_order_2: ['article_2_pos', 'article_1_neg'],
}

Page({
  data: {
    showOverlay: false,
    showContinueBtn: false,
    videoSrc: '',
    displayArticles: [],
    feedActive: false,
  },

  _inactivityTimer: null,
  _overlayStartTimestamp: null,

  onLoad() {
    // Read condition and article order from globalData (set by entry-survey after assignCondition)
    const condition = app.globalData.condition || ''
    const articleOrder = app.globalData.articleOrder || ''

    // Build article display list
    const articleIds = ORDER_MAP[articleOrder] || []
    const displayArticles = articleIds.map(id => ARTICLES[id]).filter(Boolean)
    this.setData({ displayArticles })

    // Show video overlay for non-control conditions
    if (condition && condition !== 'control') {
      const videoConfig = VIDEO_CONFIG[condition]
      if (videoConfig && videoConfig.video_file) {
        this._overlayStartTimestamp = Date.now()
        this.setData({ showOverlay: true, videoSrc: videoConfig.video_file })
        this._logVideoStart()
        return
      }
    }

    // Control condition — activate feed immediately
    this._activateFeed()
  },

  onVideoEnded() {
    this.setData({ showContinueBtn: true })
  },

  onVideoError(e) {
    console.error('Video error', e)
    // On error, show continue button so participant isn't stuck
    this.setData({ showContinueBtn: true })
  },

  onContinue() {
    const endTs = Date.now()
    this._logVideoEnd(endTs, true)
    this.setData({ showOverlay: false, showContinueBtn: false })
    this._activateFeed()
  },

  _logVideoStart() {
    wx.cloud.callFunction({
      name: 'saveSurveyResponse',
      data: {
        surveyType: 'entry',
        responses: { video_overlay_start_timestamp: new Date(this._overlayStartTimestamp) },
        coinsEarned: 0,
        isFinal: false,
        timestamps: null,
      },
    })
  },

  _logVideoEnd(endTs, completed) {
    wx.cloud.callFunction({
      name: 'saveSurveyResponse',
      data: {
        surveyType: 'entry',
        responses: {
          video_overlay_end_timestamp: new Date(endTs),
          video_completed: completed,
        },
        coinsEarned: 0,
        isFinal: false,
        timestamps: null,
      },
    })
  },

  _activateFeed() {
    const feedActiveTs = Date.now()
    this.setData({ feedActive: true })

    // Log feed activation
    wx.cloud.callFunction({
      name: 'saveSurveyResponse',
      data: {
        surveyType: 'entry',
        responses: { feed_active_timestamp: new Date(feedActiveTs) },
        coinsEarned: 0,
        isFinal: false,
        timestamps: null,
      },
    })

    // Start 60s inactivity timer
    this._inactivityTimer = setTimeout(() => {
      this._triggerExitSurvey('inactivity_timeout')
    }, 60000)
  },

  onArticleTap(e) {
    if (!this.data.feedActive) return
    const articleId = e.currentTarget.dataset.articleId

    // Reset inactivity timer on any tap
    if (this._inactivityTimer) {
      clearTimeout(this._inactivityTimer)
      this._inactivityTimer = setTimeout(() => {
        this._triggerExitSurvey('inactivity_timeout')
      }, 60000)
    }

    // Log tap event
    wx.cloud.callFunction({
      name: 'logArticleEvent',
      data: { eventType: 'tap', articleId },
    })

    // Navigate to article viewer
    wx.navigateTo({ url: `/pages/article-viewer/article-viewer?id=${articleId}` })
  },

  onShow() {
    // Check if article_read trigger was set by article-viewer
    const trigger = wx.getStorageSync('article_read_trigger')
    if (trigger && this.data.feedActive) {
      wx.removeStorageSync('article_read_trigger')
      if (this._inactivityTimer) clearTimeout(this._inactivityTimer)
      this._triggerExitSurvey('article_read')
    }
  },

  onUnload() {
    if (this._inactivityTimer) clearTimeout(this._inactivityTimer)
  },

  _triggerExitSurvey(trigger) {
    wx.setStorageSync('exit_survey_trigger', trigger)
    wx.redirectTo({ url: '/pages/exit-survey/exit-survey' })
  },
})
