const cloud = require('wx-server-sdk');

// Initialize cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { openid, merch_id, merch_name, price } = event;
  
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

    if (credit < price) {
      throw new Error('Insufficient credits');
    }

    // Get merch entry
    const merchRes = await transaction.collection('merch').where({ merch_id }).get();
    if (merchRes.data.length === 0) {
      throw new Error('Merch not found');
    }
    const merch = merchRes.data[0];
    const merch_entry_id = merch._id;
    const quantity = merch.quantity;

    if (quantity < 1) {
      throw new Error('Merch out of stock');
    }

    // Update merch quantity
    await transaction.collection('merch').doc(merch_entry_id).update({
      data: {
        quantity: _.inc(-1),
      },
    });

    // Update user credits
    await transaction.collection('lottery').doc(user_entry_id).update({
      data: {
        credit: _.inc(-price),
        prizes: _.push(merch_name)
      },
    });

    // Add to claimed prize
    await transaction.collection('claimedprize').add({
      data: {
        _openid: openid,
        merch_id: merch_entry_id,
        date: new Date(),
      },
    });

    // Commit the transaction
    await transaction.commit();

    return {
      success: true,
      message: 'Merch claimed successfully',
    };

  } catch (error) {
    console.error('Error claiming merch:', error);

    // Rollback the transaction if any error occurs
    await transaction.rollback();

    return {
      success: false,
      message: error.message,
    };
  }
};
