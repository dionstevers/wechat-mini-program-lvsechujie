// Loading page — bootstrap router.
// Calls getParticipantState on launch, hydrates app.globalData from the
// result, then redirects (or switches tab) to the page where the user
// should resume.

const app = getApp()

// Minimum time the loading screen stays up so the spinner doesn't blink.
const MIN_LOADING_MS = 1200

const ROUTE_TO_URL = {
  fresh:           { url: '/pages/landing/landing',                 method: 'redirect' },
  registration:    { url: '/pages/registration/registration',       method: 'redirect' },
  entry_survey:    { url: '/pages/entry-survey/entry-survey',       method: 'redirect' },
  news_feed:       { url: '/pages/news-feed/news-feed',             method: 'switchTab' },
  news_feed_free:  { url: '/pages/news-feed/news-feed',             method: 'switchTab' },
  exit_survey:     { url: '/pages/exit-survey/exit-survey',         method: 'redirect' },
  debriefing:      { url: '/pages/debriefing/debriefing',           method: 'redirect' },
  reward:          { url: '/pages/reward/reward',                   method: 'redirect' },
}

Page({
  onLoad() {
    const startedAt = Date.now()
    wx.cloud.callFunction({
      name: 'getParticipantState',
      success: (res) => {
        const r = (res && res.result) || {}
        this._handleResult(r, startedAt)
      },
      fail: (err) => {
        console.warn('[loading] getParticipantState failed, defaulting to landing', err)
        this._handleResult({ route: 'fresh' }, startedAt)
      },
    })
  },

  _handleResult(result, startedAt) {
    // Hydrate globalData so downstream pages see the resumed state.
    if (app.globalData) {
      if (typeof result.coins_so_far === 'number') {
        if (typeof app.setTotalCoins === 'function') app.setTotalCoins(result.coins_so_far)
        else app.globalData.totalCoins = result.coins_so_far
      }
      app.globalData.welcomeBackBanner = result.welcomeBack || ''
      app.globalData.experimentRoute = result.route || 'fresh'
      app.globalData.rewardPaid = !!result.reward_paid
      app.globalData.rewardAttempted = !!result.reward_attempted
      app.globalData.rewardYuan = Number(result.reward_yuan || 0)
      app.globalData.rewardPaidTimestamp = result.reward_paid_timestamp || null
      app.globalData.rewardTransactionId = result.reward_transaction_id || null
      app.globalData.videoShown = !!result.video_played
      if (result.condition) app.globalData.condition = result.condition
      if (result.article_combination) app.globalData.articleCombination = result.article_combination
      if (result.article_order) app.globalData.articleOrder = result.article_order
      // Once the session is closed (claim attempted), make the timer
      // self-hide regardless of payout outcome.
      if (result.route === 'news_feed_free') {
        app.globalData.newsTimerStartTs = null
        app.globalData.exitSurveyFired = true
      }
      // For news_feed (resumed entry done, exit not done), the news-feed
      // page starts the timer after the participant dismisses the welcome
      // modal — not here. Leaving newsTimerStartTs null on entry.
    }

    const route = ROUTE_TO_URL[result.route] || ROUTE_TO_URL.fresh
    const elapsed = Date.now() - startedAt
    const wait = Math.max(0, MIN_LOADING_MS - elapsed)
    setTimeout(() => {
      if (route.method === 'switchTab') {
        wx.switchTab({ url: route.url })
      } else {
        wx.redirectTo({ url: route.url })
      }
    }, wait)
  },
})
