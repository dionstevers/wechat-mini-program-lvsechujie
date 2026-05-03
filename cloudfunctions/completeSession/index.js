// completeSession — Screen 8
// Calculates final coin total and yuan reward; marks session as complete.
// Called once when the reward screen loads.

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// Keep these in sync with miniprogram/config/reward.js. The constants are
// intentionally duplicated here because cloud functions cannot require()
// modules from the miniprogram folder.
const COINS_PER_YUAN     = 88
const COINS_TO_YUAN_RATE = 1 / COINS_PER_YUAN
const TOTAL_REWARD_YUAN  = 8
const TOTAL_COINS_CAP    = TOTAL_REWARD_YUAN * COINS_PER_YUAN  // 704

// Always-earned by anyone who reaches the reward step. Landing 继续, consent
// 同意, and entering the exit survey (via the 2-min timer or dev skip) are
// mandatory upstream gates, so we book them here without separate DB writes.
const COINS_LANDING    = 88
const COINS_CONSENT    = 50
const COINS_EXIT_ENTRY = 88

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const now = db.serverDate()

  try {
    const existing = await db.collection('experiment_participants')
      .where({ _openid: OPENID })
      .get()

    if (existing.data.length === 0) {
      return { success: false, error: 'No participant record found.' }
    }

    const participant = existing.data[0]

    // If already complete, just return the totals + payment status (so the
    // reward screen can come up in 'paid' state on reload).
    if (participant.session_complete) {
      return {
        success: true,
        coins_total: participant.coins_total,
        reward_yuan: participant.reward_yuan,
        already_complete: true,
        reward_paid: participant.reward_paid === true,
        reward_paid_timestamp: participant.reward_paid_timestamp || null,
        reward_transaction_id: participant.reward_transaction_id || null,
      }
    }

    const coins_registration = participant.coins_registration || 0
    const coins_entry_survey = participant.coins_entry_survey || 0
    const coins_exit_survey  = participant.coins_exit_survey  || 0
    const raw_total =
      COINS_LANDING +
      COINS_CONSENT +
      coins_registration +
      coins_entry_survey +
      COINS_EXIT_ENTRY +
      coins_exit_survey
    // Hard cap: even if upstream over-credited, never pay more than the
    // configured experiment budget.
    const coins_total = Math.min(raw_total, TOTAL_COINS_CAP)
    const reward_yuan = Math.round(coins_total * COINS_TO_YUAN_RATE * 100) / 100

    await db.collection('experiment_participants').doc(participant._id).update({
      data: {
        coins_total,
        reward_yuan,
        reward_collection_timestamp: now,
        session_complete: true,
        current_step: 'complete',
      },
    })

    return {
      success: true,
      coins_total,
      reward_yuan,
      reward_paid: false,
      reward_paid_timestamp: null,
      reward_transaction_id: null,
    }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
