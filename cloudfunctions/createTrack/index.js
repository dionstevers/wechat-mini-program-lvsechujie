const cloud = require("wx-server-sdk");

cloud.init();
const db = cloud.database();

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();

  const { _id } =
    (await db.collection("track").add({
      data: {
        record: [],
        _openid: OPENID,
        date: new Date(),
        brand: event.brand,
        model: event.model,
        system: event.system,
        version: event.version,
        platform: event.platform,
        capacity: event.capacity,
        startSteps: event.startSteps,
        transport: event.transport,
      }
    })) || {};

  return _id;
};
