const cloud = require("wx-server-sdk");

cloud.init();

const db = cloud.database();
const _ = db.command;
// const credit = 25; // Default increment of 25 points

exports.main = async (event) => {
  const { carbon , credit } = event;
  const { OPENID } = cloud.getWXContext();
  
  // Start a transaction
  const transaction = await db.startTransaction();

  try {
    // Retrieve the user's lottery document
    const res = await transaction.collection("lottery").where({ _openid: OPENID }).get();
    if (!res.data.length) {
      throw new Error("User not found in lottery collection");
    }
    
    const userId = res.data[0]._id;

    // Set the time to 4:00 AM
    const four = new Date();
    four.setHours(4, 0, 0, 0);

    // Retrieve track records since 4:00 AM
    const trackRes = await transaction
      .collection("track")
      .where({ _openid: OPENID, date: _.gt(four) })
      .get();
      
    const list = trackRes.data || [];

    // If there are track records, increment the user's credit
    if (list.length) {
      await transaction
        .collection("lottery")
        .doc(userId)
        .update({ data: { credit: _.inc(credit) } });
    }

    // Update the user's carbon sum
    await transaction
      .collection("userInfo")
      .doc(userId)
      .update({ data: { carbSum: _.inc(carbon) } });

    // Commit the transaction if all operations succeeded
    await transaction.commit();
    
    return { errMsg: "cloud.callFunction:ok" };

  } catch (err) {
    // Rollback the transaction on error
    await transaction.rollback();
    return { errMsg: "cloud.callFunction:fail", result: err.toString() };
  }
};
