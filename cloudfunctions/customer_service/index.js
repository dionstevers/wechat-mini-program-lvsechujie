// 云函数入口文件

// this function handles all notification sent from server side 
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境


function formatDateTime(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


async function sendCustomerServiceMessage(data){
  const time = data.time.$date
  
  const date = formatDateTime(time)
  try{
    const result = await cloud.openapi.subscribeMessage.send({
      touser:data.sender,
      page:'/pages/index/index',
      data: {
        date6: {value: date},
        thing1: {value: data.message},
        thing2:{value: data.response},
        thing3: {value: '处理完成'},
        name4: {value: '碳行家团队'}
      },
      templateId: 'wMLq-UxGYlMV9gp9UjaV3y4mjXtzerIVkMswu9BPNwM'
    })
    return result;
  }catch(err){
    throw err
  }
}


// 云函数入口函数
exports.main = async (event, context) => {
  
  var data = event.data.doc;
  return await sendCustomerServiceMessage(data);
  
}