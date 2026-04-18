// assignCondition — called at end of entry survey submission
// Randomly assigns: treatment condition (4 options) + article combination (A/B)
// + article order (2 options). All assignments are independent.
// Each participant is assigned exactly once; subsequent calls are no-ops.

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const CONDITIONS = ['US_better_than_China', 'China_better_than_US', 'no_text', 'control']
const COMBINATIONS = ['combo_A', 'combo_B']

// Article display orders per combination
const ARTICLE_ORDERS = {
  combo_A: ['combo_A_order_1', 'combo_A_order_2'],
  combo_B: ['combo_B_order_1', 'combo_B_order_2'],
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

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

    // Idempotent — if already assigned, return existing assignment
    if (participant.condition) {
      return {
        success: true,
        condition: participant.condition,
        article_combination: participant.article_combination,
        article_order: participant.article_order,
        already_assigned: true,
      }
    }

    const condition = randomChoice(CONDITIONS)
    const article_combination = randomChoice(COMBINATIONS)
    const article_order = randomChoice(ARTICLE_ORDERS[article_combination])

    await db.collection('experiment_participants').doc(participant._id).update({
      data: {
        condition,
        condition_assigned_timestamp: now,
        article_combination,
        article_order,
        current_step: 'news_feed',
      },
    })

    return { success: true, condition, article_combination, article_order }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
