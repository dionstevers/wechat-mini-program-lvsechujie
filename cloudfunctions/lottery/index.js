const cloud = require('wx-server-sdk');

// Initialize cloud
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;


exports.main = async (event, context) => {
  const { openid, lottery_probability_id, lottery_probability_name } = event;

  try {
    // Start a transaction
    const transaction = await db.startTransaction();

    
    // Get user entry
    const userRes = await transaction.collection('lottery').where({ _openid: openid }).get();
    if (userRes.data.length === 0) {
      throw new Error('User not found');
    }
    const user = userRes.data[0];
    const user_entry_id = user._id;
    const credit = user.credit;
    
    // Get lottery quantity
    const lotteryQuantityRes = await transaction.collection('config').where({key: "lotteryQuantity"}).get();
    const { data = [] } = lotteryQuantityRes || {}
    if (!data.length) {
      throw new Error('LotteryQuantity not found');
    }
    const [lotteryQuantity] = data
    const { value } = lotteryQuantity || {}
    if (credit < value) {
      throw new Error('Insufficient credits');
    }
    
    // Get lottery probability entry
    const lotteryProbabilityRes = await transaction.collection('lotteryProbability').where({ _id: lottery_probability_id }).get();

    if (lotteryProbabilityRes.data.length === 0) {
      throw new Error('LotteryProbability not found');
    }

    const lotteryProbability = lotteryProbabilityRes.data[0];
    const lotteryProbability_entry_id = lotteryProbability._id;

    // Update user credits
    await transaction.collection('lottery').doc(user_entry_id).update({
      data: {
        credit: _.inc(-value),
        prizes: _.push(lottery_probability_name)
      },
    });

    // Add to claimed prize
    await transaction.collection('claimedprize').add({
      data: {
        _openid: openid,
        lottery_probability_id: lotteryProbability_entry_id,
        date: new Date(),
      },
    });

    // Commit the transaction
    await transaction.commit();

    return {
      success: true,
      message: 'Lottery claimed successfully',
    };

  } catch (error) {
    console.error('Error claiming lottery:', error);
    await transaction.rollback();

    return {
      success: false,
      message: error.message,
    };
  }
};