// pages/store/store.ts
Page({
  data: {
  random:'',
  trasn:0,
  status: ''
  },
  startspin:function(e){
  let that = this
  let num = 0
  
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
   that.setData({
     status: ''
   }
   )
   }
  },8)
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
   wx.showToast({
    title: name,
    icon: 'none',
    duration: 2000
   })
   clearInterval(b)
   }
  },10)
  },
 })