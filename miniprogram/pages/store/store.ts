// pages/store/store.ts
const appd =getApp()
Page({
  data: {
    testGroup: 0,
    background:'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    curAttempt:0,
    random: '',
    trasn: 0,
    status: false,
    cost: 20,
    userInfo: null,
    credit: 0,
    luckylist: [
      {
        time: "每次抽奖需消耗20积分",
      },
      {
        time:"五连抽必得20元（含以上）奖品"
      },
      {
        time: "奖品将于每月月底统一发放",
      },
      {
        time: "还等什么，快来抽奖吧！",
      },
    ],
  },
  angleGenerator(){
    var Max = 0;
    var Min = 0;
    const db = wx.cloud.database();
    const _ = db.command;
    var _this = this
    var angle = 0;
    const attempts = _this.data.curAttempt
    const prob = Math.floor(Math.random() * 100);
    var Rand = Math.random();
     
      
       
    //不保底最大奖 但是如果欧皇抽中 attempt变为0  5%概率抽到
    if(prob<=2){
      db.collection('userInfo').doc(_this.data.userInfo._id).update({
        data: {
         attempts : 0
        }
      })
      Max = 90;
      Min = 30;
      angle = Min + Math.floor(Rand * (Max-Min)); //舍去
    }
    // 第二有价值的奖品 5次抽奖保底20块  20%概率抽到
    if(prob>2&&prob<=15||attempts==5){
      db.collection('userInfo').doc(_this.data.userInfo._id).update({
        data: {
         attempts : 0
        }
      })
      Max = 150;
      Min = 90;
      angle = Min + Math.floor(Rand * (Max-Min)); //舍去
    }
    // 其次没有价值的奖品 (共两种) 35%概率抽到
    if(prob>15&&prob<=60){
      db.collection('userInfo').doc(_this.data.userInfo._id).update({
        data: {
         attempts : _.inc(1)
        }
      })
      Max = 270;
      Min = 150;
      angle = Min + Math.floor(Rand * (Max-Min)); //舍去
    }
    //最没有价值的奖品 （共两种） 40概率抽到
    if(prob>60&&prob<=100){
      db.collection('userInfo').doc(_this.data.userInfo._id).update({
        data: {
         attempts : _.inc(1)
        }
      })
      Max = 360;
      Min = 270;
      angle = Min + Math.floor(Rand * (Max-Min)); //舍去
    }
    
    console.log(angle);
    return angle;
  },
  startspin: function (e) {
    
    let that = this
    if (that.data.status == true ) {
      return;
    }
    let num = 0
    
    that.getUserInfo()
    if(that.data.credit<that.data.cost){
      wx.showToast({
        title: "积分不足",
        icon: 'error',
        duration: 2000,
      })
      return;
    }

      that.setData({
        // random-最终角度-从后端获得概率
        random: that.angleGenerator(),
        trasn: 0,
        status: true,
      })
   
      let a = setInterval(function () {
        that.setData({
          trasn: that.data.trasn + 5,
          status:true
        })
        //  累计转3圈
        if (360 <= that.data.trasn) {
          that.data.trasn = 0
          num = num + 1
        }
        //  3圈得到结果、重置timer
        if (num == 3) {
          that.currinl()
          clearInterval(a)
        }
      }, 6)
    
    

  },
  currinl: function (e) {
    
    let that = this
    let name = ''
    if (that.data.random == 30 || that.data.random == 90 || that.data.random == 150 || that.data.random == 210 || that.data.random == 330) {
      that.setData({
        random: that.data.random + 1
      })
    }
    if (that.data.random < 30 || 330 < that.data.random) {
      name = '当当买书5元优惠卷'
    } else if (that.data.random > 30 && that.data.random < 90) {
      name = '￥100京东E卡'
    } else if (that.data.random > 90 && that.data.random < 150) {
      name = '¥20京东E卡'
    } else if (that.data.random > 150 && that.data.random < 210) {
      name = '小米空气净化器100元优惠卷'
    } else if (that.data.random > 210 && that.data.random < 270) {
      name = "燃油宝50元优惠卷"
    } else {
      name = "低碳荞麦面10元优惠卷"
    }
    let b = setInterval(function () {
      that.setData({
        trasn: that.data.trasn + 5,
        status: true
      })
      const db = wx.cloud.database();
      const _ = db.command;
      if (that.data.random <= that.data.trasn) {
         
        db.collection('userInfo').doc(that.data.userInfo._id).update({
          data: {
            credit: _.inc(-20),
            prizelist: _.push(name)
          }
        })
        wx.showToast({
          title: "您获得了" + name,
          icon: 'success',
          duration: 2000,
        })
        

        // that.setData({
        //   status: 'false'
        // }
        // )
        that.getUserInfo()
        clearInterval(b)
      }

    }, 5)

  },

  getUserInfo() {
    //const data = wx.getStorageSync('userInfo');
    
    const db = wx.cloud.database();
    let _this = this;
     
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        _this.setData({
          openID: res.result.data._openid,
        })
        console.log('openID:', _this.data.openID)
        db.collection('userInfo').where({
          _openid: _this.data.openID,
        })
          .get({
            success: function (res) {
              console.log(_this.data.userInfo)
              console.log(res.data)
              if (res.data.length == 1) {
                _this.setData({
                  userInfo: res.data[0],
                  credit: res.data[0].credit,
                  curAttempt:res.data[0].attempts
                })
                console.log(_this.data.credit)
                if (_this.data.credit < _this.data.cost) {
                  console.log('credit',_this.data.credit)
                  console.log('cost',_this.data.cost)
                  _this.setData({
                    status: true
                  })
                  wx.showToast({
                    title: "可用积分不足",
                    icon: "error",
                    duration: 2000,
                    mask: true,
                  })
                }else{ _this.setData({
                  status: false
                })}
                console.log(_this.data.userInfo)
              }
            }
          })
      }
    })
  },


  toMyprize() {
    wx.navigateTo({
      url: '../myprize/myprize'
    })
  },
  onLoad() {
    this.setData({
      testGroup: appd.globalData.userInfo.testGroup
    })
  },
  onShow() {
    this.getUserInfo()
    wx.setNavigationBarTitle({
      title: '碳行家｜积分中心'
    })
  }
})