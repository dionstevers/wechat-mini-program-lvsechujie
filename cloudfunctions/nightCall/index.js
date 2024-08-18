// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境



async function sendNightCall(openid){
  
  try{
    const result = await cloud.openapi.subscribeMessage.send({
      touser:openid,
      page:'/pages/index/index',
      data: {
        thing2:{value: '在碳行家记录出行赚积分抽奖品啦！！！'},
        thing3: {value: '下拉聊天界面进入碳行家小程序，每天进行行程记录即可赢积分兑奖'}
      },
      templateId: 'e4UcMMrp4Vqxn__UBC8UOEaoSDfd5ua1s3WUpmUfdWE'
    })
    return result;
  }catch(err){
    throw err
  }
}
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID;
  return await sendNightCall(openid)
}