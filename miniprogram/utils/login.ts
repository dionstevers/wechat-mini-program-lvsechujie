const app = getApp();

/**
 * 检查用户是否有注册账号
 * @param message 默认提示"请您登录"的信息标题
 * @param success 有账号的回调函数
 * @param fail 没有账号的回调函数
 * @param error 发生错误的回调函数
 */
async function onHandleSignIn({
    message,
    success, 
    failed, 
    error 
  }: { 
    message?: string,
    success?: () => void | Promise<void>, 
    failed?: () => void | Promise<void>, 
    error?: () => void | Promise<void> 
  } = {}) {
  // 当前已登录则无需访问数据库
  if (app.globalData.userInfo) {
    if (success) success();
  } else {
    const db = wx.cloud.database();
    try {
      // 尝试获取账号
      const res = await wx.cloud.callFunction({ name: 'login' });
      const openID = (res.result as { data?: any }).data._openid;
      // this.setData({ openID });
      getApp().globalData.openID = openID;

      const userInfoQuery = await db.collection('userInfo')
        .where({ _openid: openID })
        .get();
      
      // 成功获取账号
      if (userInfoQuery.data.length === 1) {
        app.globalData.userInfo = userInfoQuery.data[0];
        if (success) success();

      // 用户未注册账号
      } else if (userInfoQuery.data.length === 0) {
        wx.showModal({
          title: message ? message : '请您注册',
          content: '未注册用户将只能体验小程序部分功能，点击确定按钮注册以获得完整体验',
          success: (res) =>{
            if(res.confirm){
              wx.navigateTo({
                url:'/pages/index/index'
              })
            }
          }
        })
        if (failed) failed();

      // 用户错误拥有多个账号
      } else {
        if (error) error();
      }

      // 报错情况
    } catch(err) {
      console.log(err);
      if (error) error();
    }
  }

   
}

export { onHandleSignIn }