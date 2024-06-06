const cloud = require("wx-server-sdk");
const ipify = require("ipify");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  try {
    const ip = await ipify({ useIPv6: false });
    return { ip };
  } catch (error) {
    return { error: error.message };
  }
};
