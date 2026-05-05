// Screen 4+5 — Video Overlay + News Feed
// Loads treatment video (if assigned), then shows two article cards. The
// 2-minute global timer (started here on first arrival, ticked by the
// shared exit-timer component) is what triggers the exit survey now —
// no inactivity timer, no article-read trigger.

const app = getApp()
const { ARTICLES, ARTICLE_COMBINATIONS } = require('../../config/articles.js')
const { VIDEO_CONFIG } = require('../../config/videos.js')
const { NEWS_FEED_CONFIG } = require('../../config/news-feed.js')
const { REWARD_CONFIG } = require('../../config/reward.js')
const { parseSegments } = require('../../utils/parse-segments.js')

// true  → full-screen black background (original)
// false → modal card over blurred news feed
const VIDEO_FULLSCREEN = false

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
    videoStarted: false,    // flips true on first <video> bindplay; fades out the loading hint
    videoSrc: '',
    displayArticles: [],
    feedActive: false,
    videoFullscreen: VIDEO_FULLSCREEN,
    feedTitle: NEWS_FEED_CONFIG.title,
    feedSubtitleSegs: parseSegments(NEWS_FEED_CONFIG.subtitle),
    exitEntryCoins: REWARD_CONFIG.coins_exit_entry || 0,
    articlePromptSegs: parseSegments(
      (NEWS_FEED_CONFIG.articlePrompt || '').replace('{{coins}}', REWARD_CONFIG.coins_exit_entry || 0)
    ),
    devMode: !!(app.globalData && app.globalData.devMode),
  },

  _overlayStartTimestamp: null,

  onLoad() {
    // Read condition and article order from globalData (set by entry-survey
    // after assignCondition).
    const condition = app.globalData.condition || ''
    const articleOrder = app.globalData.articleOrder || ''

    const articleIds = ORDER_MAP[articleOrder] || []
    const displayArticles = articleIds.map(id => ARTICLES[id]).filter(Boolean)
    this.setData({ displayArticles })

    // Re-entry path: surface the welcome-back modal FIRST (telling the
    // participant what's about to happen), then route into the video
    // overlay or directly into the feed once they tap 知道了.
    const banner = app.globalData && app.globalData.welcomeBackBanner
    if (banner && !this._welcomeShown) {
      this._welcomeShown = true
      wx.showModal({
        title: '欢迎回来',
        content: banner,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          if (app.globalData) app.globalData.welcomeBackBanner = ''
          this._showVideoOrFeed(condition)
        },
      })
      return
    }
    this._showVideoOrFeed(condition)
  },

  // Decide between video overlay vs going straight into the feed.
  // Treatment participants on a fresh app session see the video overlay;
  // control participants and post-claim free-use participants skip it.
  _showVideoOrFeed(condition) {
    const finished = !!(app.globalData && (app.globalData.rewardPaid || app.globalData.rewardAttempted))
    const alreadyShown = !!(app.globalData && app.globalData.videoShown) || finished
    if (!alreadyShown && condition && condition !== 'control') {
      const videoConfig = VIDEO_CONFIG[condition]
      if (videoConfig && videoConfig.video_file) {
        this._overlayStartTimestamp = Date.now()
        this.setData({ showOverlay: true, videoSrc: videoConfig.video_file })
        this._logVideoStart()
        return
      }
    }
    this._activateFeed()
  },

  onVideoPlay() {
    if (!this.data.videoStarted) this.setData({ videoStarted: true })
  },

  onVideoEnded() {
    this.setData({ showContinueBtn: true })
  },

  onVideoError(e) {
    console.error('Video error', e)
    this.setData({ showContinueBtn: true })
  },

  onContinue() {
    if (this._continued) return
    this._continued = true
    const endTs = Date.now()
    this._logVideoEnd(endTs, true)
    this.setData({ showOverlay: false, showContinueBtn: false })
    if (app.globalData) app.globalData.videoShown = true
    this._activateFeed()
    const pending = app.globalData.pendingCoinsAfterVideo || 0
    if (pending && typeof app.addTotalCoins === 'function') {
      app.globalData.pendingCoinsAfterVideo = 0
      setTimeout(() => app.addTotalCoins(pending), 500)
    }
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

    // Welcome modal already shown upstream in onLoad (before video). Just
    // start the 2-min countdown if the session is still open.
    if (
      app.globalData &&
      !app.globalData.newsTimerStartTs &&
      !app.globalData.rewardPaid &&
      !app.globalData.exitSurveyFired
    ) {
      app.globalData.newsTimerStartTs = Date.now()
    }

    // Log feed activation.
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
  },

  onArticleTap(e) {
    if (!this.data.feedActive) return
    const articleId = e.currentTarget.dataset.articleId

    wx.cloud.callFunction({
      name: 'logArticleEvent',
      data: { eventType: 'tap', articleId },
    })

    wx.navigateTo({ url: `/pages/article-viewer/article-viewer?id=${articleId}` })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onTapNav(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.navigateTo({ url })
  },
})
