const cloud = require("wx-server-sdk");

// Initialize cloud
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const { OPENID } = cloud.getWXContext();

const db = cloud.database();
const _ = db.command;

function getDistance(lat1, lng1, lat2, lng2) {
  // 将经纬度从度数转换为弧度
  const toRadians = degree => (degree * Math.PI) / 180.0;

  // 地球半径，单位为千米
  const EARTH_RADIUS = 6378.137;

  // 将输入的纬度和经度转换为弧度
  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);
  const deltaLat = radLat1 - radLat2;
  const deltaLng = toRadians(lng1) - toRadians(lng2);

  // 计算两点间的弧长
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) ** 2;
  const s = 2 * Math.asin(Math.sqrt(a));

  // 计算距离并四舍五入到小数点后4位
  const distance = (s * EARTH_RADIUS).toFixed(4);

  return parseFloat(distance);
}

function todayStartDate() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

async function findAbnormal(isTotal = false) {
  if (isTotal) {
    const now = todayStartDate();

    return await db
      .collection("track")
      .where({
        _openid: OPENID,
        purpose: db.command.exists(false),
        date: db.command.gt(now)
      })
      .orderBy("date", "desc")
      .limit(1)
      .get();
  }

  return await db
    .collection("track")
    .where({
      _openid: OPENID,
      purpose: db.command.exists(false)
    })
    .orderBy("date", "desc")
    .limit(1)
    .get();
}

exports.main = async () => {
  const now = todayStartDate();
  let isRecordEmpty = false;
  let showPoint = false;

  let { data: lastTrack } =
    (await db
      .collection("track")
      .where({ _openid: OPENID, date: db.command.gt(now) })
      .orderBy("date", "desc")
      .limit(1)
      .get()) || {};


      console.log(lastTrack, OPENID)

  if (!lastTrack.length) {
    const res = await findAbnormal();
    lastTrack = res.data
    isRecordEmpty = true
  } else {
    const abnormalRes = await findAbnormal(true);
    const abnormals = abnormalRes.data || [];
    showPoint = abnormals.length;
  }

  lastTrack.forEach(item => {
    if (item["date"]) item["date"] = item.date.getTime();
    if (item["endTime"]) item["endTime"] = item.endTime.getTime();
    let dist = 0;
    for (let j in item.record) {
      if (j == 0) continue;
      dist += getDistance(
        item.record[j - 1]["points"].latitude,
        item.record[j - 1]["points"].longitude,
        item.record[j]["points"].latitude,
        item.record[j]["points"].longitude
      );
    }
    item["distance"] = parseFloat(dist.toFixed(2));
    item["carbSum"] = (item.carbSum || 0).toFixed(2);
  });

  return { showPoint, isRecordEmpty, list: lastTrack };
};
