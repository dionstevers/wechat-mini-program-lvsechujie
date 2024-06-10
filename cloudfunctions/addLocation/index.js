const cloud = require('wx-server-sdk');

// Initialize cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { sendParams } = event;
  const { openid } = sendParams
  try {
    // Start a transaction
    const transaction = await db.startTransaction();
    // Get user entry
    const userRes = await transaction.collection('geolocation').where({ _openid: openid }).get();
    // 如果用户不存在，就添加数据
    if (userRes.data.length === 0) {
      await transaction.collection('geolocation').add({
        data: {
          _openid: openid,
          date: new Date(),
          ...sendParams
        }
      })
    } else {
      await transaction.collection('geolocation').doc(userRes.data[0]._id).update({
        data: {
          _openid: openid,
          date: new Date(),
          ...sendParams
        }
      })
    }

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
