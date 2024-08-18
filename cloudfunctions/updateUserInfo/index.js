const cloud = require("wx-server-sdk");

cloud.init();

const db = cloud.database();
const _ = db.command;
const credit = 25; // 默认累加25积分

exports.main = async event => {
  const { carbon } = event ;
  const { OPENID } = cloud.getWXContext();
  const transaction = await db.startTransaction();
  try {
    const res = await transaction.collection("lottery").where({ _openid: OPENID }).get();
    const userId = res.data[0]._id;

    // 凌晨4点？
    const four = new Date();
    four.setHours(4, 0, 0, 0);

    const { data: list = [] } =
      (await transaction
        .collection("track")
        .where({ _openid: OPENID, date: _.gt(four) })
        .get()) || {};

    if (Array.isArray(list) && list.length) {
      transaction
        .collection("lottery")
        .doc(userId)
        .update({ data: { credit: _.inc(credit) } });
    }

    transaction
      .collection("userInfo")
      .doc(userId)
      .update({ data: { carbSum: _.inc(carbon) } });
  } catch (err) {
    await transaction.rollback();
    return { errMsg: "cloud.callFunction:fail", result: err };
  }
};
