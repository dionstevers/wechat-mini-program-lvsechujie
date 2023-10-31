const cloud = require('wx-server-sdk')

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
  const {
    OPENID
  } = cloud.getWXContext()

  const track = db.collection('track')
  var yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const _ = db.command
  const res_track = await track.where({
    _openid: OPENID,
    date: _.gt(yesterday),
    endTime: _.exists(false)
  }).get()
  const lottery = db.collection('lottery')

  for (const data in res_track.data) {
    track.doc(data._id).update({
      data: {
        endTime: new Date()
      },
    })
    const user_credit = await lottery.where({
      _openid: OPENID
    }).get()
    var user_id = user_credit.data[0]._id
    if (!user_credit.data[0].recorded) {
      lottery.doc(user_id).update({
        data: {
          credit: _.inc(20),
          recorded: true
        }
      })
    }
  }


  const res = await lottery.where({
    recorded: true
  }).get()

  for (const data in res.data) {
    userInfo.doc(data._id).update({
      data: {
        record: false
      },
    })
  }
}