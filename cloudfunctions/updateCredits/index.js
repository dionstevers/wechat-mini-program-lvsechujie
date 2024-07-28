const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();
const _ = db.command;

/**
 * This cloud function handles the updating of user credits based on their group and the amount of carbon they have saved.
 * The function calculates the credits to be added, checks and updates the daily credit limits, and updates the user's total credits and carbon savings.
 */

/**
 * Calculate the credit based on the user group and carbon saved.
 * @param {number} userGroup - The group to which the user belongs (0, 1, or 2).
 * 0 - info group
 * 1 - physical group
 * 2 - money group
 * @param {number} carbon - The amount of carbon saved.
 * @returns {number} The calculated credit.
 */
const getUserGroupCredit = (userGroup, carbon) => {
  let credit = 0;
 
  if (userGroup === 0 || userGroup === 1) {
    credit = 100;
  } else if (userGroup === 2) {
    // Directly translate carbon to credit for group 2
    credit = carbon;
  }

  return credit;
};

/**
 * Handle the daily credit logic for the user.
 * @param {object} transaction - The database transaction object.
 * @param {string} OPENID - The user's open ID.
 * @param {number} creditToAdd - The amount of credit to add.
 * @param {number} creditLimit - The daily credit limit for the user group.
 * @returns {object} The new credit value and whether the credit limit has been exceeded.
 */
const handleDailyCredit = async (transaction, OPENID, creditToAdd, creditLimit) => {
  const serverTimestamp = db.serverDate();

  const userCreditRes = await transaction.collection("dailyCredit").where({ _openid: OPENID }).get();

  if (userCreditRes.data.length === 0) {
    // Entry does not exist, create one and add the credit
    await transaction.collection("dailyCredit").add({
      data: {
        _openid: OPENID,
        credit: creditToAdd,
        timestamp: serverTimestamp
      }
    });
    return { credit: creditToAdd, exceeded: false };
  } else {
    const userCredit = userCreditRes.data[0];
    const currentCredit = userCredit.credit;
    const lastTimestamp = userCredit.timestamp;

    // Get server-side date for comparison
    const currentDate = new Date(serverTimestamp);
    const lastDate = new Date(lastTimestamp);

    if (lastDate.toDateString() !== currentDate.toDateString()) {
      // Entry exists but the timestamp is not the current day, overwrite the timestamp and credit
      await transaction.collection("dailyCredit").doc(userCredit._id).update({
        data: {
          credit: creditToAdd,
          timestamp: serverTimestamp
        }
      });
      return { credit: creditToAdd, exceeded: false };
    } else {
      // Entry exists and the timestamp is the current day, increase the credit
      const newCredit = Math.min(currentCredit + creditToAdd, creditLimit);
      await transaction.collection("dailyCredit").doc(userCredit._id).update({
        data: {
          credit: newCredit
        }
      });
      return { credit: newCredit, exceeded: newCredit === creditLimit };
    }
  }
};

/**
 * Main function to handle the updating of user credits and carbon savings.
 * @param {object} event - The event object containing the request parameters.
 * @param {object} context - The context object containing the user context.
 * @returns {object} The result of the function execution.
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { userGroup, carbon } = event;
  const creditLimit = userGroup === 2 ? 300 : 100;
  const creditToAdd = getUserGroupCredit(userGroup, carbon);

  const transaction = await db.startTransaction();
  try {
    const creditResult = await handleDailyCredit(transaction, OPENID, creditToAdd, creditLimit);

    if (creditResult.exceeded) {
      await transaction.rollback();
      return { errMsg: "cloud.callFunction:ok", result: { error: 'Credit limit exceeded for today' } };
    }

    // Update lottery
    const lotteryRes = await transaction.collection("lottery").where({ _openid: OPENID }).get();
    if (lotteryRes.data.length > 0) {
      const userId = lotteryRes.data[0]._id;
      await transaction.collection("lottery").doc(userId).update({
        data: { credit: _.inc(creditResult.credit) }
      });
    } else {
      await transaction.rollback();
      return { errMsg: "cloud.callFunction:ok", result: { error: 'User not found in lottery collection' } };
    }

    // Update user info
    const userInfoRes = await transaction.collection("userInfo").where({ _openid: OPENID }).get();
    if (userInfoRes.data.length > 0) {
      const userId = userInfoRes.data[0]._id;
      await transaction.collection("userInfo").doc(userId).update({
        data: { carbSum: _.inc(carbon) }
      });
    } else {
      await transaction.rollback();
      return { errMsg: "cloud.callFunction:ok", result: { error: 'User not found in userInfo collection' } };
    }

    await transaction.commit();
    return { errMsg: "cloud.callFunction:ok", result: 'Success' };

  } catch (err) {
    await transaction.rollback();
    return { errMsg: "cloud.callFunction:fail", result: err };
  }
};
