// logArticleEvent — Screen 5 / 5a
// Called when a participant taps an article (tap event) and when they
// leave the article viewer (close event).
// eventType: 'tap' | 'close'
// articleId: string (e.g. 'article_1_pos')
// openTimestamp: ms since epoch (for 'close' events)
// closeTimestamp: ms since epoch (for 'close' events)

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// Keep these in sync with miniprogram/config/reward.js (COINS_ARTICLE_READ)
// and pages/article-viewer/article-viewer.js (READ_THRESHOLD_MS).
const COINS_ARTICLE_READ = 88
const READ_THRESHOLD_MS  = 5000

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { eventType, articleId, openTimestamp, closeTimestamp } = event

  try {
    const existing = await db.collection('experiment_participants')
      .where({ _openid: OPENID })
      .get()

    if (existing.data.length === 0) {
      return { success: false, error: 'No participant record found.' }
    }

    const participant = existing.data[0]
    const updateData = {}

    if (eventType === 'tap') {
      // Increment tap count and record tap timestamp
      const tapCountField = `article_tap_count.${articleId}`
      const tapTsField = `article_tap_timestamps.${articleId}`
      updateData[tapCountField] = _.inc(1)
      updateData[tapTsField] = _.push(new Date())
    } else if (eventType === 'close') {
      // Record visit open/close pair and accumulate reading time
      const visitsField = `article_visits.${articleId}`
      const readingField = `reading_time_seconds.${articleId}`
      const durationMs = closeTimestamp - openTimestamp
      const durationSeconds = Math.round(durationMs / 1000)

      updateData[visitsField] = _.push({
        open: new Date(openTimestamp),
        close: new Date(closeTimestamp),
      })
      updateData[readingField] = _.inc(durationSeconds)

      // Award the article-read coin once any close event clears the read
      // threshold. Absolute set so subsequent closes overwrite the same 88
      // and never inflate the field.
      if (durationMs >= READ_THRESHOLD_MS) {
        updateData.coins_article_read = COINS_ARTICLE_READ
      }
    }

    await db.collection('experiment_participants').doc(participant._id).update({ data: updateData })

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
