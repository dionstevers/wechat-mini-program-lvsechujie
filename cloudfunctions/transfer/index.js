// function to send cash to user using wechatpay api v3




// 

//input params：


// _openid : unique identifier of user
// money: the amount of money to send out, unit : cent
// batch_name: the name appears on the client side of this transaction
// batch_remark: the name appears on server side of this transaction 

// 


const cloud = require('wx-server-sdk');
const WechatPay = require('wechatpay-node-v3');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize cloud
cloud.init();

const appid = 'wx501c20d4e2802733'; 
const mchid = '1680661471'; // merchant ID
const serialNumber='14AD194FC3E19D5A880016589136D98B48A6B5BB'; // WeChat Pay serial number
const api_key = 'CarbonCleverDukeKunshanCHANGLAB3'

exports.main = async (event, context) => {
  const { money, _openid, batch_name, batch_remark} = event;

  // Initialize WechatPay
  const wechatPayInstance = new WechatPay({
    appid: appid,
    mchid: mchid,
    publicKey: fs.readFileSync('./platform_certificate.pem'),  // 平台公钥
    privateKey: fs.readFileSync('./apiclient_key.pem'), // 签名私钥
    serial_no:'14AD194FC3E19D5A880016589136D98B48A6B5BB',
    key:'CarbonCleverDukeKunshanCHANGLAB3'

  });

  const outBatchNo = `batch${Date.now()}`;
  const transferDetail = {
    out_detail_no: `detail${Date.now()}`,
    transfer_amount: money,
    transfer_remark: 'Test transfer',
    openid: _openid
  };

  const payload = {
    appid: appid,
    out_batch_no: outBatchNo,
    batch_name: batch_name,
    batch_remark: batch_remark,
    total_amount: money,
    total_num: 1,
    transfer_detail_list: [transferDetail]
  };
  const body = payload;
  const nonce_str = Math.random().toString(36).substr(2, 15);
  const timestamp = parseInt(+new Date() / 1000 + '').toString();
  const url = '/v3/transfer/batches';
  // const cert_url = '/v3/certificates'
  // // 获取签名
  const signature = wechatPayInstance.getSignature('POST', nonce_str,timestamp, url, body);

  // 获取头部authorization 参数
  const authorization = wechatPayInstance.getAuthorization(nonce_str, timestamp, signature);

  console.log(signature)
  try {
    const response = await axios.post(`https://api.mch.weixin.qq.com${url}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'Wechatpay-Serial':'4A85BE9F075D1F920E86899D7E9F2D42F4B017F1'
      },
    });

    return response.data;
  } catch (error) {
    return {
      error: error.response ? error.response.data : error.message
    };
  }
};
