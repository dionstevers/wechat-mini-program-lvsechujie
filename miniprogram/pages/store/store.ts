// pages/store/store.ts
Page({
  data: {
  random:'',
  trasn:0,
  status: '',
  cost: 200,
  userInfo:null,
  credit : 0,
  luckylist:[    
    {   
        time:7,
        nickName:"张三",
        reward:"2"
    },
    {   
        time:12,
        nickName: "李四",
        reward: "2"
    },
    {
        time:14,
        nickName: "王五",
        reward: "2"
    },
],
  },
  startspin:function(e){
  
  let that = this
  let num = 0
  that.getUserInfo()
  that.setData({
    // random-最终角度-从后端获得概率
   random:Math.floor(Math.random() * 360),
   trasn:0,
   status: 'forbid'
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
   that.currinl()
   clearInterval(a)
  
   }
  },6)
   
  },
  currinl:function(e){
  let that = this
  let name = ''
  if(that.data.random == 30 || that.data.random == 90 || that.data.random == 150 || that.data.random == 210 || that.data.random == 330){
   that.setData({
   random:that.data.random + 1
   })
  }
  if(that.data.random < 30 || 330 < that.data.random){
   name = '一等奖'
  }else if(that.data.random > 30 && that.data.random < 90){
   name = '二等奖'
  }else if(that.data.random > 90 && that.data.random < 150){
   name = '三等奖'
  }else if(that.data.random > 150 && that.data.random < 210){
   name = '四等奖'
  }else if(that.data.random > 210 && that.data.random < 270){
   name = "五等奖"
  }else{
   name = "六等奖"
  }
  let b = setInterval(function () {
   that.setData({
   trasn:that.data.trasn+2
   })
   if(that.data.random <= that.data.trasn){
  const data = wx.getStorageSync('userInfo')
  const db  =  wx.cloud.database();
  const _ = db.command;
     db.collection('userInfo').doc(data._id).update({
       data:{
         credit:_.inc(-200),
         prizelist: _.push([name])
       }
     })
    wx.showToast({
    title: "您获得了"+name,
    icon: 'success',
    duration: 2000,
   })
   
   
    that.setData({
      status: ''
    }
    )
   that.getUserInfo()
   clearInterval(b)
   }
   
  },5)
  
  },

  
  async getUserInfo(){
    const data = wx.getStorageSync('userInfo')
    if (data){
       
      const userInfo = await wx.cloud.database().collection('userInfo').doc(data._id).get()
      this.setData({
        userInfo: userInfo.data,
        credit: userInfo.data.credit
      })
      if(userInfo.data.credit<200){
        this.setData({
          status:'forbid'
        })
      }
      console.log(userInfo)
    }
    
  },
  toMyprize(){
    wx.navigateTo({
      url:'../myprize/myprize'
    })
  },
  onLoad(){
    wx.setNavigationBarTitle({
      title: '积分中心'
    })
  },
  onShow(){
    this.getUserInfo()
  }
 })