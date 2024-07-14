// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const ip = wxContext.CLIENTIP ? wxContext.CLIENTIP : wxContext.CLIENTIPV6;
  const openid = wxContext.OPENID;
  
  try {
    if (ip) {
      const res = await axios.get(
        "https://apis.map.qq.com/ws/location/v1/ip",
        {
          params: {
            ip: ip,
            key: "VRSBZ-H653A-3QTK7-C5XO4-D6PLK-QPFGC"
          }
        }
      )

      const geoData = res.data.result;
      const geolocationInfo = {
        openid: openid,
        ip: geoData.ip,
        lat: geoData.location.lat,
        lng: geoData.location.lng,
        nation: geoData.ad_info.nation,
        province: geoData.ad_info.province,
        city: geoData.ad_info.city,
        district: geoData.ad_info.district,
        adcode: geoData.ad_info.adcode,
        nation_code: geoData.ad_info.nation_code,
        timestamp: new Date().toISOString(),
      };

      // Initialize the database
      const db = cloud.database();

      // Check if a record with this openid already exists
      const checkRecord = await db.collection('location').where({
        openid: openid
      }).get();

      if (checkRecord.data.length === 0) {
        // If no record exists, create a new one
        await db.collection('location').add({
          data: geolocationInfo
        });

        // Logging response for debugging
        console.log('Geolocation Info:', geolocationInfo);

        return {
          statusCode: 200,
          data: geolocationInfo
        }
      } else {
        // If record exists, do not update or create a new one
        return {
          statusCode: 200,
          message: 'Record already exists, no update or creation done'
        }
      }
    }
  } catch (err) {
    console.log(err)
    return {
      statusCode: 500,
      error: err.message
    }
  }

  return {
    statusCode: 400,
    error: 'No IP found'
  }
}
