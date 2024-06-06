// Import the required modules
const cloud = require('wx-server-sdk');
const crypto = require('crypto');
const axios = require('axios');

cloud.init();

function hexMD5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

exports.main = async (event, context) => {
  const { u_openid, type, money } = event;

  if (!u_openid) {
    console.log('User openid is required');
    return {
      success: false,
      message: 'User openid is required'
    };
  }

  const apikey = 'carbclever';
  const uid = '10815051';
  const orderid = `${Date.now()}${u_openid}`;
  const reqtick = Math.floor(Date.now() / 1000); // Convert to seconds
  const openid = u_openid;
  const sig = hexMD5(`${uid}${type}${orderid}${money}${reqtick}${openid}${apikey}`);

  // Create query parameters string
  const queryParams = new URLSearchParams({
    uid,
    type,
    orderid,
    money,
    reqtick,
    openid,
    sign: sig,
    title: '现金发奖',
    sendname: '碳行家',
    wishing: '心想事成'
  }).toString();

  const url = `https://mp001.yaoyaola.net/exapi/SendRedPackToOpenid?${queryParams}`;

  console.log('Sending request to URL:', url);

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};
