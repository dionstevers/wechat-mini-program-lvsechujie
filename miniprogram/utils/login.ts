const app = getApp();

async function onHandleSignIn() {
  const db = wx.cloud.database();
  try {
    const res = await wx.cloud.callFunction({ name: 'login' });
    const openID = (res.result as { data?: any }).data._openid;
    // this.setData({ openID });
    getApp().globalData.openID = openID;

    const userInfoQuery = await db.collection('userInfo')
      .where({ _openid: openID })
      .get();
      
    if (userInfoQuery.data.length === 1) {
      app.globalData.userInfo = userInfoQuery.data[0];
    } else{
      wx.showModal({
        title: '请您注册',
        content: '未注册用户将只能体验小程序部分功能，点击确定按钮注册以获得完整体验',
        success: (res) =>{
          if(res.confirm){
            wx.navigateTo({
              url:'/pages/index/index'
            })
          } else if (res.cancel){
            wx.showModal({
              title: '请您三思',
              content:'未注册用户将只能体验小程序部分功能，点击确定按钮注册以获得完整体验',
              success: (res)=>{
                if(res.confirm){
                  wx.navigateTo({
                    url:'/pages/index/index'
                  })
                }
              }
            })
          }

        }
      })
    }
  } catch(err) {
    console.log(err)
  } 
  // finally {
  //   this.isFetchingUserInfo = false;
  // }
}


export { onHandleSignIn }