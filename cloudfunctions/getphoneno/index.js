const cloud = require('wx-server-sdk');
const request = require('request-promise');

// Initialize cloud environment
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;
  const openid = wxContext.OPENID;
  
  try {
    // Check if phone number already exists in the collection
    const phonenosCollection = db.collection('phonenos');
    const checkResult = await phonenosCollection.where({
      _openid: openid
    }).get();

    if (checkResult.data.length > 0) {
      // Phone number already exists
      return {
        phoneNumber: checkResult.data[0].phoneNumber,
        message: "Phone number already exists"
      };
    } else {
      // Phone number does not exist, get it from the API
      const accessToken = await getAccessToken();
      const phoneNumber = await getPhoneNumber(event.code, accessToken);

      // Upload phone number to the collection
      await phonenosCollection.add({
        data: {
          _openid: openid,
          phoneNumber: phoneNumber
        }
      });

      return {
        phoneNumber: phoneNumber,
        message: "Phone number retrieved and saved"
      };
    }
  } catch (error) {
    return {
      error: error.message
    };
  }
};

async function getAccessToken() {
  const appid = 'wx501c20d4e2802733';
  const secret = 'e458447bb33897097557a224523fd8dd';
  
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
  
  const response = await request({
    url: url,
    method: 'GET',
    json: true
  });
  
  return response.access_token;
}

async function getPhoneNumber(code, accessToken) {
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
  
  const response = await request({
    url: url,
    method: 'POST',
    json: true,
    body: {
      code: code
    }
  });
  
  if (response.errcode !== 0) {
    throw new Error(response.errmsg);
  }
  
  return response.phone_info.phoneNumber;
}
