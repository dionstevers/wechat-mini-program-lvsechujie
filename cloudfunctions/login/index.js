const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前云函数所在的环境
});

// 云函数入口函数
exports.main = async (event) => {
  // 输出接收到的小程序端传入的 event 参数，方便调试
  console.log(event);

  // 获取微信调用上下文，包括用户的 OPENID 和 APPID
  const { OPENID } = cloud.getWXContext();

  // 初始化数据库操作对象
  const db = cloud.database();

  // 构造要返回的数据对象，包含用户的 OPENID
  const data = {
    _openid: OPENID
  };

  // 返回包含用户 OPENID 的数据对象给小程序端
  return { data };
};