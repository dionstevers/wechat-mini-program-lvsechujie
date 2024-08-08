const cloud = require("wx-server-sdk");

cloud.init();

const db = cloud.database();
const _ = db.command;

exports.main = async event => {

  await db
    .collection("track")
    .doc(event.curID)
    .update({ data: { record: db.command.push(event.recordItem) } });

  return true;
};
