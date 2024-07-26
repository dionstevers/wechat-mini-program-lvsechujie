const cloud = require('wx-server-sdk');
const axios = require('axios');

// Initialize cloud
cloud.init();

exports.main = async (event, context) => {
  const { money, _openid, appid } = event;

  const out_batch_no = `batch${Date.now()}`;
  const transferDetail = {
    out_detail_no: `detail${Date.now()}`,
    transfer_amount: money,
    transfer_remark: 'Test transfer',
    openid: _openid,
    user_name: '757b340b45ebef5467rter35gf464344v3542sdf4t6re4tb4f54ty45t4yyry45' // Example encrypted user name
  };

  const payload = {
    appid: appid,
    out_batch_no: out_batch_no,
    batch_name: 'Test Batch Transfer',
    batch_remark: 'Testing batch transfer API',
    total_amount: money,
    total_num: 1,
    transfer_detail_list: [transferDetail]
  };

  const url = 'https://api.mch.weixin.qq.com/v3/transfer/batches';

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Wechatpay-Serial': 'YOUR_WECHATPAY_SERIAL' // Replace with your WeChat Pay serial
      }
    });

    return response.data;
  } catch (error) {
    return {
      error: error.response ? error.response.data : error.message
    };
  }
};
