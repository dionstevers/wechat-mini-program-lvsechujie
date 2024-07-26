const cloud = require('wx-server-sdk');
const WechatPay = require('wechatpay-node-v3');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize cloud
cloud.init();

const appid = 'wx501c20d4e2802733'; 
const mchid = '1680661471'; // merchant ID
const serialNumber = '5F2866F345F198FEC31F9FFE3C67C29A549A3BC1'; // WeChat Pay serial number
const api_key = 'CarbonCleverDukeKunshanCHANGLAB3'

exports.main = async (event, context) => {
  const { money, _openid } = event;

  // Initialize WechatPay
  const wechatPayInstance = new WechatPay({
    appid: appid,
    mchid: mchid,
    publicKey: fs.readFileSync('./apiclient_cert.pem'), 
    privateKey: fs.readFileSync('./apiclient_key.pem'),
    serial_no:serialNumber,
    key: api_key
  });

  const outBatchNo = `batch${Date.now()}`;
  const transferDetail = {
    out_detail_no: `detail${Date.now()}`,
    transfer_amount: money,
    transfer_remark: 'Test transfer',
    openid: _openid,
    user_name: '757b340b45ebef5467rter35gf464344v3542sdf4t6re4tb4f54ty45t4yyry45' // Example encrypted user name
  };

  const payload = {
    appid: appid,
    out_batch_no: outBatchNo,
    batch_name: 'Test Batch Transfer',
    batch_remark: 'Testing batch transfer API',
    total_amount: money,
    total_num: 1,
    transfer_detail_list: [transferDetail]
  };
  const body = payload;
  const nonce_str = Math.random().toString(36).substr(2, 15);
  const timestamp = parseInt(+new Date() / 1000 + '').toString();
  const url = '/v3/transfer/batches';

  // 获取签名
  const signature = wechatPayInstance.getSignature('POST', url,  timestamp, nonce_str,body);
  // 获取头部authorization 参数
  const authorization = wechatPayInstance.getAuthorization(nonce_str, timestamp, signature);


  try {
    const response = await axios.post(`https://api.mch.weixin.qq.com${url}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    return response.data;
  } catch (error) {
    return {
      error: error.response ? error.response.data : error.message
    };
  }
};
