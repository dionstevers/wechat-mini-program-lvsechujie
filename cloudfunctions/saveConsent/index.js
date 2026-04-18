// saveConsent — Screen 1
// Creates or updates the experiment_participants record with consent decision.
// Called before any other data is stored.

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { consent_given } = event
  const now = db.serverDate()

  try {
    // Check if a record already exists for this participant
    const existing = await db.collection('experiment_participants')
      .where({ _openid: OPENID })
      .get()

    if (!consent_given) {
      // Participant declined — do not create a record
      return { success: true, consent_given: false }
    }

    if (existing.data.length > 0) {
      // Participant returned to consent screen (e.g. after app restart)
      // Update consent fields and reset step to consent
      await db.collection('experiment_participants')
        .doc(existing.data[0]._id)
        .update({
          data: {
            consent_given: true,
            consent_timestamp: now,
            current_step: 'registration',
          },
        })
      return { success: true, consent_given: true, participant_id: existing.data[0]._id }
    }

    // Create new participant record
    const result = await db.collection('experiment_participants').add({
      data: {
        _openid: OPENID,
        consent_given: true,
        consent_timestamp: now,
        current_step: 'registration',
        session_complete: false,
      },
    })

    return { success: true, consent_given: true, participant_id: result._id }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
