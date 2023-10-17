// pages/store/store.ts
export{}
const app =getApp()
Page({
  data: {
    angle:0,
    attempts:0,
    _id: 0,
    testGroup: 0,
    openID: '',
    random: '',
    deg: 0,
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
    const prob = Math.floor(Math.random() * 100);
    //一等奖 2%概率抽到
    if(prob<=2){angle = this.getAngle(30,90)}
    // 第二有价值的奖品 20%概率抽到
    if(prob>2&&prob<=15){angle = this.getAngle(90,150)}
    // 其次没有价值的奖品 (共两种) 35%概率抽到
    if(prob>15&&prob<=60){angle = this.getAngle(150,270)}
    //最没有价值的奖品 （共两种） 40概率抽到
    if(prob>60&&prob<=100){  angle = this.getAngle(270,360)}
    console.log(angle);
    return angle;
  },
  getAngle(min: number,max: number){
    const angle = min + Math.floor(Math.random()*(max-min))
    return angle
  },
  startSpin: function () {
    if (this.data.spinning || this.data.credit < this.data.cost) {
      return;
    }
    let angle = this.angleGenerator();
    this.setData({
      deg: 0,
      angle: angle,
      spinning: true,
    });
    let circle = 0
    let a = setInterval(function () {
      let ndeg = this.data.deg + 5
      console.log('ndeg is :  ', ndeg)
      this.setData({
        deg: ndeg,
        status:true
      })
      //  累计转3圈
      if (360 <= this.data.deg) {
        this.data.deg = 0
        circle = circle + 1
      }
      //  3圈得到结果、重置timer
      if (circle == 3) {
        this.getResult()
        clearInterval(a)
      }
    }, 6)
  },
  getResult(){
    let that = this
    let b = setInterval(function(){
      let ndeg = that.data.deg + 5
      console.log('ndeg for b is :  ',ndeg)
      that.setData({
        deg :  ndeg,
        spinning: true
      })
      clearInterval(b)
    },5)
  },
  async getLotteryInfo(){
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
            attempts: snapshot.docs[0].attempts
          })
        },
        onError: (err) => {
          console.log(err)
        }
      })

    }catch(err){
      console.log(err)
    }
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