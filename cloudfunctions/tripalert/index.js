const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command
exports.main = async (event, context) => {
  var now = new Date()
  //now = new Date(new Date().setDate(new Date().getDate()-15))
  now.setHours(0, 0, 0, 0)
  const res = await db.collection('trace').where({
      transport: _.exists(true),
      endTime: _.exists(false),
      date: _.gt(now)
    })
    .get()
  for (var i = 0; i < res.data.length; i++) {
    console.log(res.data[i]._id)
    if (res.data[i].points.length < 30) continue
    var dist = 0
    for (var j = res.data[i].points.length - 29; j < res.data[i].points.length; j++) {
      dist += GetDistance(res.data[i].points[j - 1].latitude, res.data[i].points[j - 1].longitude, res.data[i].points[j].latitude, res.data[i].points[j].longitude)
    }
    console.log(dist)
    if (dist > 1e-15 || res.data[i].isNoticed) continue
    db.collection('trace').doc(res.data[i]._id).update({
      data: {
        isNoticed: true
      },
      fail: err => {
        icon: 'none',
        console.error('database failure', err)
      }
    })
    try {
      const result = await cloud.openapi.subscribeMessage.send({
        touser: res.data[i]._openid,
        page: 'pages/trace/trace',
        lang: 'zh_CN',
        data: {
          thing1: {
            value: '程序检测到您已连续五分钟未移动'
          },
          thing3: {
            value: '若行程已结束，请点击“结束记录行程”'
          }
        },
        templateId: 'TMmOMnmX_9L5m1G4oPhsygORiRM73_Uq4senr1qoqEc'
      })
      return result
    } catch (err) {
      return err
    }
  }
}
async function GetDistance(lat1, lng1, lat2, lng2) {
  var radLat1 = lat1 * Math.PI / 180.0;
  var radLat2 = lat2 * Math.PI / 180.0;
  var a = radLat1 - radLat2;
  var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
  s = s * 6378.137; // EARTH_RADIUS;
  s = Math.round(s * 10000) / 10000;
  return s;
}