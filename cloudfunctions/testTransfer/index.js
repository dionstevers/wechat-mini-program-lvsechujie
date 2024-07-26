const cloud = require('wx-server-sdk');
const WechatPay = require('wechatpay-node-v3');
const fs = require('fs');
const path = require('path');

// Initialize cloud
cloud.init();

const appid = 'wx501c20d4e2802733';
const mchid = '1680661471'; // Your merchant ID
const serialNumber = '5F2866F345F198FEC31F9FFE3C67C29A549A3BC1'; // Your WeChat Pay serial number

// Function to download the key file from WeChat Cloud Storage
async function downloadFile(cloudPath, localPath) {
  const res = await cloud.downloadFile({
    fileID: cloudPath,
  });
  fs.writeFileSync(localPath, res.fileContent);
}

exports.main = async (event, context) => {
  const { money, _openid } = event;

  const keyFilePath = path.join('/tmp', 'apiclient_key.pem');
  const certFilePath = path.join('/tmp', 'apiclient_cert.pem');

  // Replace these URLs with your actual download links
  const keyFileUrl = 'cloud://iluvcarb-0gzvs45g82b57f98.696c-iluvcarb-0gzvs45g82b57f98-1315168954/certificates/apiclient_key.pem';
  const certFileUrl = 'cloud://iluvcarb-0gzvs45g82b57f98.696c-iluvcarb-0gzvs45g82b57f98-1315168954/certificates/apiclient_cert.pem';

  // Download the keys from the provided URLs
  await downloadFile(keyFileUrl, keyFilePath);
  await downloadFile(certFileUrl, certFilePath);

  // Initialize WechatPay
  const wechatPayInstance = new WechatPay({
    appid: appid,
    mchid: mchid,
    privateKey: fs.readFileSync(keyFilePath),
    serialNumber: serialNumber,
    certs: {
      [serialNumber]: fs.readFileSync(certFilePath),
    },
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

  const nonce_str = Math.random().toString(36).substr(2, 15);
  const timestamp = parseInt(+new Date() / 1000 + '').toString();
  const url = '/v3/transfer/batches';

  // 获取签名
  const signature = wechatPayInstance.getSignature('POST', url, nonce_str, timestamp, payload);
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
