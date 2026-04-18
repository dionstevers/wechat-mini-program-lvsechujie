// logDebriefing — Screen 7
// Logs debrief_shown_timestamp (on page load) and debrief_read_timestamp
// (when participant taps 领取奖励 after scrolling to bottom).
// event.event: 'shown' | 'read'

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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
    const updateData = {}

    if (event.event === 'shown') {
      updateData.debrief_shown_timestamp = now
      updateData.current_step = 'debriefing'
    } else if (event.event === 'read') {
      updateData.debrief_read_timestamp = now
      updateData.current_step = 'reward'
    } else {
      return { success: false, error: 'Unknown event type.' }
    }

    await db.collection('experiment_participants').doc(participant._id).update({ data: updateData })

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
