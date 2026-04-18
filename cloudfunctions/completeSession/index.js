// completeSession — Screen 8
// Calculates final coin total and yuan reward; marks session as complete.
// Called once when the reward screen loads.

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const COINS_TO_YUAN_RATE = 0.05 // keep in sync with miniprogram/config/reward.js

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

    // If already complete, just return the totals
    if (participant.session_complete) {
      return {
        success: true,
        coins_total: participant.coins_total,
        reward_yuan: participant.reward_yuan,
        already_complete: true,
      }
    }

    const coins_registration = participant.coins_registration || 0
    const coins_entry_survey = participant.coins_entry_survey || 0
    const coins_exit_survey = participant.coins_exit_survey || 0
    const coins_total = coins_registration + coins_entry_survey + coins_exit_survey
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

    return { success: true, coins_total, reward_yuan }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
