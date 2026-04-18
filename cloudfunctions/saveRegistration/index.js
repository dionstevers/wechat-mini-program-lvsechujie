// saveRegistration — Screen 2
// Saves name, phone, wechat_id; awards registration coins.

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const COINS_REGISTRATION = 10 // keep in sync with miniprogram/config/reward.js

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { name, phone, wechat_id } = event
  const now = db.serverDate()

  try {
    const existing = await db.collection('experiment_participants')
      .where({ _openid: OPENID })
      .get()

    if (existing.data.length === 0) {
      return { success: false, error: 'No consent record found for this participant.' }
    }

    const docId = existing.data[0]._id

    await db.collection('experiment_participants').doc(docId).update({
      data: {
        name,
        phone,
        wechat_id,
        registration_timestamp: now,
        coins_registration: COINS_REGISTRATION,
        current_step: 'entry_survey',
      },
    })

    return { success: true, coins_registration: COINS_REGISTRATION }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
