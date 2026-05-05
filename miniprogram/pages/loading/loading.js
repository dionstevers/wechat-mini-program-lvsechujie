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

// Banner copy painted on the destination page when the WeChat home
// capsule re-bootstraps the mini-program mid-flow. Surfaces feedback so
// the involuntary platform reLaunch reads as "please finish this step".
const MID_FLOW_HINT = {
  registration: '请先完成注册后再返回主页。',
  entry_survey: '请先完成入门问卷后再返回主页。',
  news_feed:    '请先在「信息中心」阅读资讯，约 2 分钟后将自动进入结束问卷。',
  exit_survey:  '请先完成结束问卷后再返回主页。',
  debriefing:   '请先阅读完研究说明后再返回主页。',
  reward:       '请先领取奖励后再返回主页。',
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
    // First bootstrap of the session vs a mid-flow re-bootstrap: WeChat's
    // platform home capsule reLaunches the mini-program back to this
    // page (it's pages[0] in app.json), so we use globalData persistence
    // to tell a true cold start from a home-capsule bounce.
    const firstBootstrap = !(app.globalData && app.globalData.hasBootstrapped)

    // Hydrate globalData so downstream pages see the resumed state.
    if (app.globalData) {
      if (typeof result.coins_so_far === 'number') {
        if (typeof app.setTotalCoins === 'function') app.setTotalCoins(result.coins_so_far)
        else app.globalData.totalCoins = result.coins_so_far
      }
      // First bootstrap → server-derived welcome-back copy. Re-bootstrap
      // (home-capsule tap mid-flow) → swap in a "please finish this
      // step" hint so the bounce reads as feedback instead of a glitch.
      app.globalData.welcomeBackBanner = firstBootstrap
        ? (result.welcomeBack || '')
        : (MID_FLOW_HINT[result.route] || '')
      app.globalData.rewardPaid = !!result.reward_paid
      app.globalData.rewardAttempted = !!result.reward_attempted
      app.globalData.rewardYuan = Number(result.reward_yuan || 0)
      app.globalData.rewardPaidTimestamp = result.reward_paid_timestamp || null
      app.globalData.rewardTransactionId = result.reward_transaction_id || null
      // Intentionally do NOT hydrate videoShown from the server-side
      // video_played flag — we want the video to replay on cold-launch
      // re-entry mid-flow. videoShown stays false on every fresh
      // bootstrap; only the rewardPaid / rewardAttempted finished flags
      // suppress the overlay long-term.
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
      app.globalData.hasBootstrapped = true
    }

    const route = ROUTE_TO_URL[result.route] || ROUTE_TO_URL.fresh
    const elapsed = Date.now() - startedAt
    // Skip the spinner delay on a home-capsule re-bootstrap so the user
    // doesn't see the loading screen — they didn't ask for one, the
    // platform forced one on them.
    const wait = firstBootstrap ? Math.max(0, MIN_LOADING_MS - elapsed) : 0
    setTimeout(() => {
      if (route.method === 'switchTab') {
        wx.switchTab({ url: route.url })
      } else {
        wx.redirectTo({ url: route.url })
      }
    }, wait)
  },
})
