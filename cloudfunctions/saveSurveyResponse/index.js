// saveSurveyResponse — Screens 3 and 6
// Saves survey responses incrementally (one block at a time) and awards coins.
// surveyType: 'entry' | 'exit'
// responses: { field: value, ... } for the submitted block
// coinsEarned: integer coins earned for this block

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { surveyType, responses, coinsEarned, isFinal, timestamps } = event
  // isFinal: boolean — true when this is the last block submission
  // timestamps: optional { start, end } for final submission only
  // responses: flat object of field→value pairs
  const now = db.serverDate()

  try {
    const existing = await db.collection('experiment_participants')
      .where({ _openid: OPENID })
      .get()

    if (existing.data.length === 0) {
      return { success: false, error: 'No participant record found.' }
    }

    const participant = existing.data[0]
    const updateData = { ...responses }

    // Accumulate coins for this survey type
    const coinField = surveyType === 'entry' ? 'coins_entry_survey' : 'coins_exit_survey'
    updateData[coinField] = _.inc(coinsEarned)

    if (isFinal && timestamps) {
      const { start, end } = timestamps
      const durationSeconds = Math.round((end - start) / 1000)
      const speedFlag = durationSeconds < 120

      if (surveyType === 'entry') {
        updateData.entry_survey_start_timestamp = new Date(start)
        updateData.entry_survey_end_timestamp = new Date(end)
        updateData.entry_survey_duration_seconds = durationSeconds
        updateData.speed_flag_entry = speedFlag
        updateData.current_step = 'news_feed'
      } else {
        updateData.exit_survey_start_timestamp = new Date(start)
        updateData.exit_survey_end_timestamp = new Date(end)
        updateData.exit_survey_duration_seconds = durationSeconds
        updateData.speed_flag_exit = speedFlag
        updateData.current_step = 'debriefing'
      }
    }

    // Derive attention check pass if response is present
    if (responses.attention_check_response !== undefined) {
      updateData.attention_check_pass = responses.attention_check_response === 4
    }

    await db.collection('experiment_participants').doc(participant._id).update({ data: updateData })

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
