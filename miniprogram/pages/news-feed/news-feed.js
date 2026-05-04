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

    // Show video overlay for non-control conditions, but only the first time
    // the news-feed is opened in this session.
    const alreadyShown = !!(app.globalData && app.globalData.videoShown)
    if (!alreadyShown && condition && condition !== 'control') {
      const videoConfig = VIDEO_CONFIG[condition]
      if (videoConfig && videoConfig.video_file) {
        this._overlayStartTimestamp = Date.now()
        this.setData({ showOverlay: true, videoSrc: videoConfig.video_file })
        this._logVideoStart()
        return
      }
    }

    // Control condition or video already seen — activate feed immediately.
    this._activateFeed()
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

    // If a welcome-back message is queued (re-entry), gate the timer on
    // the participant tapping 知道了. Otherwise (first visit) start it now.
    const banner = app.globalData && app.globalData.welcomeBackBanner
    if (banner && !this._welcomeShown) {
      this._welcomeShown = true
      wx.showModal({
        title: '欢迎回来',
        content: banner,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          if (app.globalData) {
            app.globalData.welcomeBackBanner = ''
            if (!app.globalData.newsTimerStartTs) {
              app.globalData.newsTimerStartTs = Date.now()
            }
          }
        },
      })
    } else if (app.globalData && !app.globalData.newsTimerStartTs) {
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
