// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 * 
 * event 参数包含小程序端调用传入的 data
 * 
 */
exports.main = async (event) => {
  console.log(event)
   

  // 可执行其他自定义逻辑
  // console.log 的内容可以在云开发云函数调用日志查看

  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）等信息
  const { nickName, avatarUrl, basicInfo} = event
  
  const { OPENID } = cloud.getWXContext()
  // 如果数据库存在当前用户信息--登录
  // 初始化集合
  const db = cloud.database()
  // 指定集合
  const userInfo = db.collection('userInfo')
  // 查询是否注册
  const { data } = await userInfo.where({
    _openid:OPENID
  }).get()
  if(data.length === 0){
    const {_id} = await userInfo.add({
      data : {
         nickName: nickName,
         avatarUrl: avatarUrl,
         _openid : OPENID,
         credit : 0,
         loginlist: [],
         basicInfo:basicInfo,
      }
    })
    // 接收_id快速返回该id数据
    const user = await userInfo.doc(_id).get()
    return {
      data: user.data
    }
  } else{
    return{
      data:data[0]
    }
  }
  // 新增数据
 
   
}