// getParticipantState — bootstrap routing.
// Reads the participant doc by OPENID and returns the resumption route,
// coin total earned so far, payout flags, and the experiment condition
// metadata. The mini-program calls this on cold start (in pages/loading)
// and uses the result to redirect to the right page.

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// Keep in sync with miniprogram/config/reward.js + completeSession constants.
const COINS_LANDING     = 88
const COINS_CONSENT     = 50
const COINS_EXIT_ENTRY  = 88
const TOTAL_COINS_CAP   = 8 * 88   // 704

function deriveRoute(p) {
  if (!p) return 'fresh'
  if (!p.consent_given) return 'fresh'
  if (!p.registration_timestamp) return 'registration'
  if (!p.entry_survey_end_timestamp) return 'entry_survey'
  if (!p.exit_survey_end_timestamp) return 'news_feed'
  if (!p.debrief_read_timestamp) return 'debriefing'
  // Once a claim has been attempted (success or failure), the session is
  // closed. Re-entry lands on the news-feed in finished state, never back
  // on the reward page. Operator handles failed payouts out-of-band.
  if (p.reward_paid || p.reward_attempted) return 'news_feed_free'
  return 'reward'
}

function deriveBanner(p, route) {
  switch (route) {
    case 'registration':
      return '欢迎回来！请完成注册以继续'
    case 'entry_survey':
      return '欢迎回来！请完成入门问卷'
    case 'news_feed': {
      // Re-entry to news-feed mid-flow. The client shows this modal
      // BEFORE the video overlay (treatment) or before the article feed
      // (control), so the copy explains what happens next.
      const isTreatment = p && p.condition && p.condition !== 'control'
      const watchedBefore = p && (p.video_overlay_end_timestamp || p.video_overlay_start_timestamp)
      if (isTreatment && watchedBefore) {
        return '欢迎回来！点击「知道了」后将再次播放视频，观看完毕后请继续阅读资讯，约 2 分钟后将自动进入结束问卷。'
      }
      return '欢迎回来！点击「知道了」后请继续阅读资讯，约 2 分钟后将自动进入结束问卷。'
    }
    case 'debriefing':
      return '欢迎回来！请阅读说明并领取奖励'
    case 'reward':
      if (p && p.reward_pay_in_flight) return '您的奖励正在发放，请稍候或重试'
      return '欢迎回来！请领取您的奖励'
    case 'news_feed_free':
    case 'fresh':
    default:
      return ''
  }
}

function deriveCoinsSoFar(p) {
  if (!p) return 0
  let total = 0
  // Landing 继续 + consent 同意 are mandatory upstream gates: anyone with a
  // record made it through both.
  total += COINS_LANDING
  total += COINS_CONSENT
  total += Number(p.coins_registration || 0)
  total += Number(p.coins_entry_survey || 0)
  // exit-entry +88 only awarded if they made it past the news-feed timer.
  if (p.exit_survey_end_timestamp || p.exit_survey_start_timestamp) {
    total += COINS_EXIT_ENTRY
  }
  total += Number(p.coins_exit_survey || 0)
  return Math.min(total, TOTAL_COINS_CAP)
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  try {
    const res = await db.collection('experiment_participants')
      .where({ _openid: OPENID })
      .limit(1)
      .get()

    if (!res.data || res.data.length === 0) {
      return {
        success: true,
        exists: false,
        route: 'fresh',
        welcomeBack: '',
        coins_so_far: 0,
        reward_paid: false,
      }
    }

    const p = res.data[0]
    const route = deriveRoute(p)
    return {
      success: true,
      exists: true,
      route,
      welcomeBack: deriveBanner(p, route),
      coins_so_far: deriveCoinsSoFar(p),
      reward_paid: !!p.reward_paid,
      reward_attempted: !!p.reward_attempted,
      reward_pay_in_flight: !!p.reward_pay_in_flight,
      reward_yuan: Number(p.reward_yuan || 0),
      reward_paid_timestamp: p.reward_paid_timestamp || null,
      reward_transaction_id: p.reward_transaction_id || null,
      condition: p.condition || null,
      article_combination: p.article_combination || null,
      article_order: p.article_order || null,
      // Surfaces whether the entry-flow video overlay has already been
      // played, so news-feed can suppress re-playing it on tab re-entry.
      video_played: !!(p.video_overlay_end_timestamp || p.video_overlay_start_timestamp),
    }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
