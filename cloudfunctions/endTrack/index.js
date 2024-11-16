const cloud = require("wx-server-sdk");

// Initialize cloud
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

const speedBetween = [
  {
    label: "步行/跑步",
    min: 0,
    max: 2.78
  },
  {
    label: "骑行",
    min: 2.78,
    max: 5.56
  },
  {
    label: "汽车(市区)",
    min: 5.56,
    max: 13.89
  },
  {
    label: "汽车(高速公路)",
    min: 22.22,
    max: 33.33
  },
  {
    label: "公交车（市区）",
    min: 4.17,
    max: 8.33
  },
  {
    label: "公交车（长途）",
    min: 16.67,
    max: 25
  },
  {
    label: "地铁",
    min: 8.33,
    max: 16.67
  },
  {
    label: "高铁",
    min: 55.56,
    max: 111.11
  }
];

function roundToKM(num) {
  if (num <= 0) return 0;
  return Math.round((num / 1000) * 100) / 100;
}

// 计算速度区间的交通工具合集
function calcResultMap(track) {
  const result = new Map();
  for (let [key, value] of speedBetween.entries()) {
    result.set(key, { label: value.label, count: 0, totalTime: 0, totalMeters: 0 });
  }

  // Calculate the interval corresponding to each speed and count the quantity and time
  for (let i = 0; i < track?.record.length - 1; i++) {
    const recordItem = track?.record[i];
    const nextRecordItem = track?.record[i + 1];
    if (!recordItem || !nextRecordItem) break;

    const { points = {} } = recordItem || {};
    const [lat1, lon1] = points?.coordinates || [];

    const { points: nextPoints = {} } = nextRecordItem || {};
    const [lat2, lon2] = nextPoints?.coordinates || [];

    const speed = haversineDistance(lat1, lon1, lat2, lon2);

    speedBetween.forEach((item, key) => {
      const { min, max } = item || {};

      if (speed >= min && speed <= max) {
        const currentEntry = result.get(key);
        currentEntry.count += 1;
        currentEntry.totalTime += 1;
        currentEntry.totalMeters += speed;
        result.set(key, currentEntry);
      }
    });
  }

  return result;
}

// 转换公里数
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

//  获取公里数
function getDistKM(track) {
  let dist = 0;
  for (let j in track.record) {
    if (j == 0) continue;
    dist += getDistance(
      track.record[j - 1].points.latitude,
      track.record[j - 1].points.longitude,
      track.record[j].points.latitude,
      track.record[j].points.longitude
    );
  }

  return dist;
}

// 根据速度计算省碳量
function calcCarbon(result, clientTransport) {
  let carbSum = 0;
  // Passenger number
  const passenger = 1; //parseInt(item["capacity"]) + 1;

  // 步行或骑行 Walk or cycle//
  const { totalMeters: totalMetersWalk = 0 } = result.get(0) || {};
  const { totalMeters: totalMetersCycling = 0 } = result.get(1) || {};
  const total = roundToKM(totalMetersWalk + totalMetersCycling);

  const savingRate = [368.68, 184.34, 122.89, 92.17, 67.09];
  carbSum += total * savingRate[passenger - 1];

  // 公共交通 Public transportation
  const { totalMeters: totalMetersCity = 0 } = result.get(4) || {};
  const { totalMeters: totalMetersHighSpeed = 0 } = result.get(5) || {};

  const cityRate = 337.05;
  const highSpeedRate = 200.51;

  const cityTotal = roundToKM(totalMetersCity);
  const highSpeedTotal = roundToKM(totalMetersHighSpeed);

  carbSum += cityTotal * cityRate;
  carbSum += highSpeedTotal * highSpeedRate;

  // 地铁
  const { totalMeters: subwayTotalMeters = 0 } = result.get(6) || {};
  const subwayRate = 20;
  const subwayTotal = roundToKM(subwayTotalMeters);
  carbSum += subwayTotal * subwayRate;

  // 高铁
  const { totalMeters: trainTotalMeters = 0 } = result.get(7) || {};
  const trainRate = 8;
  const trainTotal = roundToKM(trainTotalMeters);
  carbSum += trainTotal * trainRate;

  const arr = ["步行或骑行", "步行或骑行", "燃油汽车", "燃油汽车", "公共交通", "公共交通", "地铁", "高铁"];

  let maxEntry = null;
  let maxMeters = -Infinity;

  let totalMeters = 0;
  for (const [key, value] of result.entries()) {
    totalMeters += value.totalMeters;
    if (value.totalMeters > maxMeters) {
      maxMeters = value.totalMeters;
      maxEntry = { key, value };
    }
  }
  let calcTransport = arr[maxEntry.key];

  // 驾驶电动汽车 Electric vehicle
  if (clientTransport === "驾驶电动汽车" || clientTransport.includes("驾驶电动汽车")) {
    // 市区 City
    const { totalMeters: totalMetersCity = 0 } = result.get(2) || {};
    // 高速 Highway
    const { totalMeters: totalMetersHighSpeed = 0 } = result.get(3) || {};

    const cityTotal = roundToKM(totalMetersCity);
    const highSpeedTotal = roundToKM(totalMetersHighSpeed);

    const savingCityRate = [308.68, 154.34, 102.89, 77.17, 61.74, 56.12];
    const savingHighSpeedRate = [170.87, 85.44, 56.95, 42.72, 34.17, 31.07];

    carbSum += cityTotal * savingCityRate[passenger - 1];
    carbSum += highSpeedTotal * savingHighSpeedRate[passenger - 1];
  }

  if (totalMeters === 0) {
    return {
      isFail: true,
      carbSum,
      calcTransport
    };
  }

  return {
    isFail: false,
    carbSum,
    calcTransport
  };
}

// 计算耗时和公里数算出大概速度
function calculateMetersPerLabel(startTime, endTime, kilometers) {
  // 将开始时间和结束时间转换为毫秒数
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  // 计算时间差，转换为秒
  const timeDiffInSeconds = (end - start) / 1000;
  // 将公里转换为米
  const meters = kilometers * 1000;
  // 计算每秒的米数
  const speedMetersPerSecond = meters / timeDiffInSeconds;

  // 遍历 speedBetween 数组，检查速度是否在每个区间之间
  for (let i = 0; i < speedBetween.length; i++) {
    const { label, min, max } = speedBetween[i];
    if (speedMetersPerSecond >= min && speedMetersPerSecond <= max) {
      return label; // 返回匹配的标签
    }
  }
  return "未知速度"; // 如果没有匹配的区间
}

// 计算速度
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径，单位为公里

  // 将经纬度从度转换为弧度
  const rlat1 = lat1 * (Math.PI / 180); // 纬度1
  const rlat2 = lat2 * (Math.PI / 180); // 纬度2
  const difflat = (lat2 - lat1) * (Math.PI / 180); // 纬度差
  const difflon = (lon2 - lon1) * (Math.PI / 180); // 经度差

  // 哈弗赛因公式
  const a = Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // 计算距离
  const d = R * c; // 结果单位为公里
  return d;
}

exports.main = async event => {
  const { data: track } = await db.collection("track").doc(event.curID).get();

  // 计算各个速度区间交通工具
  const result = calcResultMap(track);

  // 计算省碳值
  let { isFail, carbSum, calcTransport } = calcCarbon(result, event.transport);

  // 获取所用距离KM
  const dist = getDistKM(track);

  if (isFail) {
    calcTransport = calculateMetersPerLabel(track.date, new Date(), parseFloat(dist.toFixed(2)));
  }

  // 获取天气
  const { result: weather = null } = await cloud.callFunction({ name: "setweather", data: { latitude: event.latitude, longitude: event.longitude } });

  const trackRes = await db
    .collection("track")
    .doc(event.curID)
    .update({
      data: {
        endTime: new Date(),
        endSteps: event.stepList ? event.stepList[30].step : null,
        weather, // 温度
        carbSum, //省碳值
        purpose: event.purpose, //出行目的
        transport: event.transport, //用户选择的交通工具
        calcTransport, //计算出来的交通工具
        distance: parseFloat(dist.toFixed(2)), //行动距离km
        result: Object.fromEntries(result.entries()) // 记录检测出来的值
      }
    });

  return { carbSum, trackRes };
};
