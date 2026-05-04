// claimReward — Screen 8 reward disbursal.
//
// Flow:
//   1. Look up the participant by OPENID in experiment_participants.
//   2. If reward_paid is already true → return idempotent success (no API call).
//   3. Validate session_complete && reward_yuan > 0.
//   4. Set a soft mutex (reward_pay_in_flight) before calling out so rapid
//      double-taps short-circuit on the second attempt.
//   5. Invoke the sendCashReward cloud function (yaoyaola red-packet API),
//      passing only the OPENID resolved server-side (never trust the client).
//   6. On success: write reward_paid + reward_paid_timestamp + transaction_id.
//   7. On failure: clear the mutex, persist the last error, return error.
//
// The yaoyaola `type` parameter controls the payout product. We ship type: 1
// (red-packet variant); operator should confirm with the vendor before going
// live for real participants.

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const RED_PACKET_TYPE = 1

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const now = db.serverDate()

  let participant
  try {
    const res = await db
      .collection('experiment_participants')
      .where({ _openid: OPENID })
      .limit(1)
      .get()
    participant = res.data && res.data[0]
  } catch (err) {
    return { success: false, error: 'lookup_failed', detail: String(err) }
  }

  if (!participant) {
    return { success: false, error: 'no_participant' }
  }

  if (participant.reward_paid === true) {
    return {
      success: true,
      already_paid: true,
      reward_yuan: participant.reward_yuan,
      paid_at: participant.reward_paid_timestamp || null,
      transaction_id: participant.reward_transaction_id || null,
    }
  }

  if (participant.session_complete !== true) {
    return { success: false, error: 'session_not_complete' }
  }

  const rewardYuan = Number(participant.reward_yuan || 0)
  if (!(rewardYuan > 0)) {
    return { success: false, error: 'no_reward' }
  }

  // Soft mutex: only succeeds if the flag is currently falsy.
  let lockRes
  try {
    lockRes = await db
      .collection('experiment_participants')
      .where({
        _id: participant._id,
        reward_pay_in_flight: _.neq(true),
      })
      .update({
        data: {
          reward_pay_in_flight: true,
          reward_pay_started_timestamp: now,
          // Once a claim attempt acquires the lock, mark the session as
          // "claim attempted" so the bootstrap router never sends the
          // participant back to the reward page — even if the payout API
          // call fails. They can revisit later via center / a follow-up
          // message; the reward page is one-shot.
          reward_attempted: true,
        },
      })
  } catch (err) {
    return { success: false, error: 'lock_failed', detail: String(err) }
  }

  if (!lockRes || lockRes.stats.updated !== 1) {
    return { success: false, error: 'in_flight' }
  }

  // Convert yuan → fen for the API.
  const money = Math.round(rewardYuan * 100)

  let payResult
  let payError
  try {
    const callRes = await cloud.callFunction({
      name: 'sendCashReward',
      data: { u_openid: OPENID, type: RED_PACKET_TYPE, money },
    })
    payResult = callRes && callRes.result
  } catch (err) {
    payError = String(err)
  }

  const succeeded =
    !payError && payResult && payResult.success === true && !(payResult.data && payResult.data.code && payResult.data.code !== 0)

  if (!succeeded) {
    const errMsg =
      payError ||
      (payResult && (payResult.message || (payResult.data && payResult.data.msg))) ||
      'send_failed'
    try {
      await db.collection('experiment_participants').doc(participant._id).update({
        data: {
          reward_pay_in_flight: false,
          reward_pay_last_error: errMsg,
          reward_pay_last_error_timestamp: now,
        },
      })
    } catch (_e) {
      // Best-effort cleanup; swallow.
    }
    return { success: false, error: errMsg }
  }

  // Success: extract a transaction id if the vendor returned one.
  const transactionId =
    (payResult.data && (payResult.data.orderid || payResult.data.order_id || payResult.data.tradeNo)) ||
    null

  try {
    await db.collection('experiment_participants').doc(participant._id).update({
      data: {
        reward_paid: true,
        reward_paid_timestamp: now,
        reward_transaction_id: transactionId,
        reward_pay_in_flight: false,
        reward_pay_last_error: null,
      },
    })
  } catch (err) {
    // Payment went out but we failed to mark it paid — surface but do NOT
    // claim failure; the operator must reconcile manually.
    return {
      success: true,
      reward_yuan: rewardYuan,
      transaction_id: transactionId,
      warning: 'paid_but_db_update_failed',
      detail: String(err),
    }
  }

  return {
    success: true,
    reward_yuan: rewardYuan,
    transaction_id: transactionId,
  }
}
