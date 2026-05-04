// setDevState — dev-only participant-doc seeder.
// Accepts a scenario name and writes the field set so getParticipantState
// routes to the corresponding page on the next launch. Intended only for
// development / testing; the client-side dev panel gates the call behind
// app.globalData.devMode.
//
// SAFETY: in production builds the client never invokes this — the dev
// banner that surfaces the picker is hidden when DEV_MODE_OPTION is 'off'.
// As a belt-and-braces guard, this function refuses by default. To enable
// it during a deployed dev/staging session, flip ALLOW_DEV_WRITES below
// to true and redeploy. NEVER ship with this set to true in production.

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const ALLOW_DEV_WRITES = false

const COINS_REGISTRATION = 50
const COINS_ENTRY_SURVEY_DEFAULT = 200
const COINS_EXIT_SURVEY_DEFAULT  = 150

function buildScenarioPatch(scenario, now) {
  switch (scenario) {
    case 'fresh':
      return null  // delete branch handled in main
    case 'consented_no_registration':
      return {
        consent_given: true,
        consent_timestamp: now,
        current_step: 'registration',
        session_complete: false,
        registration_timestamp: null,
        coins_registration: 0,
        entry_survey_end_timestamp: null,
        exit_survey_end_timestamp: null,
        debrief_read_timestamp: null,
        reward_paid: false,
        reward_pay_in_flight: false,
      }
    case 'registered_no_entry':
      return {
        consent_given: true,
        consent_timestamp: now,
        registration_timestamp: now,
        name: 'DEV',
        phone: '13800138000',
        wechat_id: 'dev_tester',
        coins_registration: COINS_REGISTRATION,
        current_step: 'entry_survey',
        entry_survey_end_timestamp: null,
        exit_survey_end_timestamp: null,
        debrief_read_timestamp: null,
        reward_paid: false,
        reward_pay_in_flight: false,
      }
    case 'entry_done_at_news_feed':
      return {
        consent_given: true,
        consent_timestamp: now,
        registration_timestamp: now,
        name: 'DEV',
        phone: '13800138000',
        wechat_id: 'dev_tester',
        coins_registration: COINS_REGISTRATION,
        coins_entry_survey: COINS_ENTRY_SURVEY_DEFAULT,
        entry_survey_start_timestamp: now,
        entry_survey_end_timestamp: now,
        condition: 'control',
        article_combination: 'combo_A',
        article_order: 'combo_A_order_1',
        current_step: 'news_feed',
        exit_survey_end_timestamp: null,
        debrief_read_timestamp: null,
        reward_paid: false,
        reward_pay_in_flight: false,
      }
    case 'exit_done_no_debrief':
      return {
        consent_given: true,
        consent_timestamp: now,
        registration_timestamp: now,
        name: 'DEV',
        phone: '13800138000',
        wechat_id: 'dev_tester',
        coins_registration: COINS_REGISTRATION,
        coins_entry_survey: COINS_ENTRY_SURVEY_DEFAULT,
        coins_exit_survey: COINS_EXIT_SURVEY_DEFAULT,
        entry_survey_start_timestamp: now,
        entry_survey_end_timestamp: now,
        exit_survey_start_timestamp: now,
        exit_survey_end_timestamp: now,
        condition: 'control',
        article_combination: 'combo_A',
        article_order: 'combo_A_order_1',
        current_step: 'debriefing',
        debrief_read_timestamp: null,
        reward_paid: false,
        reward_pay_in_flight: false,
      }
    case 'debrief_done_no_reward':
      return {
        consent_given: true,
        consent_timestamp: now,
        registration_timestamp: now,
        name: 'DEV',
        phone: '13800138000',
        wechat_id: 'dev_tester',
        coins_registration: COINS_REGISTRATION,
        coins_entry_survey: COINS_ENTRY_SURVEY_DEFAULT,
        coins_exit_survey: COINS_EXIT_SURVEY_DEFAULT,
        entry_survey_start_timestamp: now,
        entry_survey_end_timestamp: now,
        exit_survey_start_timestamp: now,
        exit_survey_end_timestamp: now,
        debrief_shown_timestamp: now,
        debrief_read_timestamp: now,
        condition: 'control',
        article_combination: 'combo_A',
        article_order: 'combo_A_order_1',
        current_step: 'reward',
        session_complete: true,
        coins_total: 626,
        reward_yuan: 7.11,
        reward_paid: false,
        reward_pay_in_flight: false,
      }
    case 'reward_paid_free_use':
      return {
        consent_given: true,
        consent_timestamp: now,
        registration_timestamp: now,
        name: 'DEV',
        phone: '13800138000',
        wechat_id: 'dev_tester',
        coins_registration: COINS_REGISTRATION,
        coins_entry_survey: COINS_ENTRY_SURVEY_DEFAULT,
        coins_exit_survey: COINS_EXIT_SURVEY_DEFAULT,
        entry_survey_start_timestamp: now,
        entry_survey_end_timestamp: now,
        exit_survey_start_timestamp: now,
        exit_survey_end_timestamp: now,
        debrief_shown_timestamp: now,
        debrief_read_timestamp: now,
        condition: 'control',
        article_combination: 'combo_A',
        article_order: 'combo_A_order_1',
        current_step: 'complete',
        session_complete: true,
        coins_total: 704,
        reward_yuan: 8.00,
        reward_paid: true,
        reward_paid_timestamp: now,
        reward_transaction_id: 'DEV-' + Date.now(),
        reward_pay_in_flight: false,
      }
    case 'reward_pay_in_flight':
      return {
        consent_given: true,
        consent_timestamp: now,
        registration_timestamp: now,
        name: 'DEV',
        phone: '13800138000',
        wechat_id: 'dev_tester',
        coins_registration: COINS_REGISTRATION,
        coins_entry_survey: COINS_ENTRY_SURVEY_DEFAULT,
        coins_exit_survey: COINS_EXIT_SURVEY_DEFAULT,
        entry_survey_start_timestamp: now,
        entry_survey_end_timestamp: now,
        exit_survey_start_timestamp: now,
        exit_survey_end_timestamp: now,
        debrief_shown_timestamp: now,
        debrief_read_timestamp: now,
        condition: 'control',
        article_combination: 'combo_A',
        article_order: 'combo_A_order_1',
        current_step: 'reward',
        session_complete: true,
        coins_total: 704,
        reward_yuan: 8.00,
        reward_paid: false,
        reward_pay_in_flight: true,
        reward_pay_started_timestamp: now,
      }
    default:
      return null
  }
}

exports.main = async (event, context) => {
  if (!ALLOW_DEV_WRITES) {
    return { success: false, error: 'dev_writes_disabled' }
  }
  const { OPENID } = cloud.getWXContext()
  const { scenario } = event
  const now = db.serverDate()

  try {
    const existing = await db.collection('experiment_participants')
      .where({ _openid: OPENID })
      .limit(1)
      .get()

    if (scenario === 'fresh') {
      if (existing.data.length > 0) {
        await db.collection('experiment_participants').doc(existing.data[0]._id).remove()
      }
      return { success: true, scenario, route: 'fresh' }
    }

    const patch = buildScenarioPatch(scenario, now)
    if (!patch) {
      return { success: false, error: 'unknown_scenario', scenario }
    }

    if (existing.data.length === 0) {
      await db.collection('experiment_participants').add({
        data: { _openid: OPENID, ...patch },
      })
    } else {
      await db.collection('experiment_participants').doc(existing.data[0]._id).update({
        data: patch,
      })
    }

    return { success: true, scenario }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
