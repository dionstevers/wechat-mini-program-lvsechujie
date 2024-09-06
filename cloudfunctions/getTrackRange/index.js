const cloud = require("wx-server-sdk");

// Initialize cloud
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const { OPENID } = cloud.getWXContext();

const schedules = [
  { label: "步行", color: "walk", totalTime: 0 },
  { label: "骑行", color: "cycling", totalTime: 0 },
  { label: "开车", color: "drive", totalTime: 0 },
  { label: "公交", color: "bus", totalTime: 0 },
  { label: "地铁", color: "subway", totalTime: 0 },
  { label: "高铁", color: "train", totalTime: 0 }
];

// 转分钟
function transMinute(val) {
  if (val <= 0) return 0;
  // 多给10秒，和记录同步
  return Number(((val * 10) / 120).toFixed(2));
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

exports.main = async event => {
  let list = event.list || [];
  let showSchedules = [];

  const [{ result }] = list.length ? list : [{}];
  if (result) {
    schedules[0].totalTime = transMinute(result[0].totalTime);
    schedules[1].totalTime = transMinute(result[1].totalTime);
    schedules[2].totalTime = transMinute(result[2].totalTime + result[3].totalTime);
    schedules[3].totalTime = transMinute(result[4].totalTime + result[5].totalTime);
    schedules[4].totalTime = transMinute(result[6].totalTime);
    schedules[5].totalTime = transMinute(result[7].totalTime);

    //  筛选有记录的值
    const filterSchedules = schedules.filter(item => !!item.totalTime);
    const total = filterSchedules.reduce((a, b) => a + b.totalTime, 0);
    showSchedules = filterSchedules.map(item => ({
      ...item,
      percentage: ((item.totalTime / total) * 100).toFixed(2) + "%"
    }));
  }

  return showSchedules;
};
