const app = getApp()

function setColor(){
      if(!app.globalData.userInfo){
          return;
      }
      
      // 根据测试组不同，背景颜色不同 (强国组)
      if(app.globalData.userInfo.testGroup == 3){
        wx.setNavigationBarColor({
          backgroundColor: "#D13A29",
          frontColor: '#ffffff',
        })
        app.globalData.background= 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
      } 
}


export { setColor }