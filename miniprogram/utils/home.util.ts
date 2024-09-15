export function getDistance(lat1, lng1, lat2, lng2) {
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

export function roundToKM(num) {
  if (num <= 0) return 0;
  return Math.round((num / 1000) * 100) / 100;
}

export function todayStartDate() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: "gcj02",
      success: loc => {
        const latitude = loc.latitude.toFixed(2);
        const longitude = loc.longitude.toFixed(2);
        resolve({ latitude, longitude });
      },
      fail: err => {
        console.error("Error getting location:", err);
        reject(err);
      }
    });
  });
}

/**
 * @description: 根据省碳量计算积分
 * @return {*}
 */
export async function calcCredit(carbon: number) {
  if (!carbon) return { can: false, credit: 0 };

  let credit = 0;
  if (carbon >= 200) {
    // 200g以上-300分
    credit = 300;
  } else if (carbon >= 100) {
    // 100g以上-200分
    credit = 200;
  } else if (carbon >= 50) {
    // 50g以上-150分
    credit = 150;
  } else if (carbon >= 30) {
    // 30g以上-100分
    credit = 100;
  } else if (carbon >= 10) {
    // 10g以上-50分
    credit = 50;
  }

  const { result } = wx.cloud.callFunction({
    name: "getDailyCredit",
    data: {
      credit,
      type: 1
    }
  });

  const { can } = result || {};
  if (!can) credit = 0;

  return {
    can,
    credit
  };
}

/**
 * @description: 根据每日上限记录省碳量
 * @return {*}
 */
export async function calcDayCredit(carbon: number) {
  if (!carbon) return { can: false, credit: 0 };
  let credit = 100;

  const { result } = wx.cloud.callFunction({
    name: "getDailyCredit",
    data: {
      credit,
      type: 2
    }
  });

  const { can } = result || {};
  if (!can) credit = 0;

  return {
    can,
    credit
  };
}
