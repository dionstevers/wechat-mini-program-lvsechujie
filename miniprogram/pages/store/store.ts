// pages/store/store.ts
const app = getApp()
export{}
Page({
  data: {
    prize: 0,
    prizes: [],
    angle:0,
    attempts:0,
    _id: 0,
    testGroup: 0,
    openID: '',
    random: '',
    trasn: 0,
    spinning: false,
    cost: 20,
    userInfo: null,
    credit: 0,
    luckylist: [
      {time: "每次抽奖需消耗20积分"},
      {time:"五连抽必得20元（含以上）奖品"},
      {time: "奖品将于每月月底统一发放",},
      {time: "还等什么，快来抽奖吧！",}],
  },
  async angleGenerator(){
    var angle = 0;
    var prize = 0;
    const prob = Math.floor(Math.random() * 100);
    const random = Math.random()
    //一等奖 2%概率抽到
    if(prob<=2){
      angle = Math.floor(40 + random*(40))
      prize = 1
    }
    // 第二有价值的奖品 10%概率抽到
    if(prob>2&&prob<=12){
      angle = Math.floor(100 + random*(40));
      prize = 2
    }
    // 20% 概率
    if(prob>12&&prob<=32){angle =Math.floor(160 + random*(40)); prize = 3}
    // 20% 概率
    if(prob>32&&prob<=52){angle = Math.floor(220+ random*(40)); prize = 4}
    // 24
    if(prob>52&&prob<=76){  angle = Math.floor(280 + Math.random()*(40)); prize = 5}
    else{
      angle = Math.floor(340 + Math.random()*(20));
      prize = 6
    }
    this.setData({
      angle: angle,
      prize: prize
    });
  },
  async startSpin(){
    let that = this
    if(that.data.credit<that.data.cost){
      wx.showToast({
        title:'积分不足',
        icon: 'error'
      })
      return;
    }
    if(that.data.spinning){
      return
    }
    if(!that.data.spinning){
      that.setData({
        spinning: true
      })
    }
    let num = 0
    that.angleGenerator()
    that.setData({
      // random-最终角度-从后端获得概率
     trasn:0,
     spinning: true
    })
    let a = setInterval(function () {
     that.setData({
     trasn:that.data.trasn+5
     })
    //  累计转3圈
     if(360 <= that.data.trasn){
     that.data.trasn = 0
     num = num + 1
     }
    //  3圈得到结果、重置timer
     if(num == 3){
      let b = setInterval( async function () {
        that.setData({
        trasn:that.data.trasn+2
        })
        if(that.data.angle <= that.data.trasn){
        try{
          wx.showToast({
            title: '恭喜中奖!',
            icon: 'none',
            duration: 2000
           })
          clearInterval(b)
          const db = wx.cloud.database()
          const _ = db.command
          const prizeList = ['placeholder','一等奖','二等奖','三等奖','四等奖','五等奖','六等奖']
          await db.collection('lottery').doc(that.data._id).update({
            data:{
              credit: _.inc(-that.data.cost),
              prizes: _.push([prizeList[that.data.prize]]),
              attempt: _.inc(1)
            }
          })
          that.setData({
            trasn: 0,
            spinning: false
          })
        }catch(err){
          console.log(err)
        }}
       },8)
       
     clearInterval(a)}
    },8)
    },
  async getLotteryInfo(){
    wx.showToast({
      title: '数据更新中',
      icon: 'loading',
      mask: true,
      duration: 10000
    })
    const db = wx.cloud.database()
    try{
     db.collection('lottery').where({
        _openid:this.data.openID
      }).watch({
        onChange: (snapshot)=>{
          console.log('docs\'s changed events', snapshot.docChanges[0])
          console.log('query result snapshot after the event', snapshot.docs[0])
          this.setData({
            credit : snapshot.docs[0].credit,
            _id: snapshot.docs[0]._id,
            attempts: snapshot.docs[0].attempts,
            prizes:snapshot.docs[0].prizes
          })
          wx.hideToast()
        },
        onError: (err) => {
          console.log(err)
        }
      })

    }catch(err){
      console.log(err)
    }
  },
  toMyprize(){
    var prizelist = JSON.stringify(this.data.prizes)
    wx.navigateTo({
      url: '/pages/myprize/myprize?prizelist=' + prizelist
    })
  },
  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo,
      testGroup: app.globalData.userInfo.testGroup,
      openID:app.globalData.openID
    })
    this.getLotteryInfo()
  },

  onShow() {
  }
})