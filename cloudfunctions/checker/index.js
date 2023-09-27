const cloud = require('wx-server-sdk')
const { createNativeSUMap } = require('XrFrame/kanata/lib/index')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 * 
 * event 参数包含小程序端调用传入的 data
 * 
 */
exports.main = async (event) => {
  console.log(event)

  const db = cloud.database()

  const userInfo = db.collection('userInfo')

  const res = await userInfo.where({
    read_message: False
  }).get()
  for (const data in res.data) {
    userInfo.doc(data._id).update({
      data: {
        credit: data.credit - 10
      },
    })
  }
}