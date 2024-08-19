const cloud = require("wx-server-sdk");

// Initialize cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { sendParams } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // Start a transaction
    const transaction = await db.startTransaction();
    // Get user entry
    // const userRes = await transaction
    //   .collection("geolocation")
    //   .where({
    //     _openid: OPENID
    //   })
    //   .get();

    await transaction.collection("geolocation").add({
      data: {
        _openid: OPENID,
        date: new Date(),
        ...sendParams
      }
    });

    // Commit the transaction
    await transaction.commit();

    return {
      success: true,
      message: "Merch claimed successfully"
    };
  } catch (error) {
    console.error("Error claiming merch:", error);

    // Rollback the transaction if any error occurs
    await transaction.rollback();

    return {
      success: false,
      message: error.message
    };
  }
};
