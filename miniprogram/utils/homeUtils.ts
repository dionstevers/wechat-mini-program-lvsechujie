function GetDistance(lat1, lng1, lat2, lng2) {
  // 将经纬度从度数转换为弧度
  const toRadians = (degree) => (degree * Math.PI) / 180.0;

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
export {GetDistance}