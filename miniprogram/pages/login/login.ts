// pages/login/login.ts
Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    _id: null,
    openID:null,
    userInfo:null,
    occupationArr:["学生","国家机关/社会团体","科研/综合技术服务业","卫生/医疗/保健业","教育/文化和广播电影电视业","交通运输仓储业","金融保险业","计算机IT业","房地产业","汽车业","通讯业","制造业","批发零售贸易业","商务/咨询服务业","旅游/餐饮/娱乐业","无业/自由职业"],
    gradArr: ["小学以下","小学","初中","高中","职高/中专","大专","大学","硕士","博士","博士以上"],
    foodArr:["从不","一周一到三次","一周三到五次","一周五到七次" ],
    food2Arr:["较低","低","中等","较高","高"],
    food:0,
    food2:0,
    occu:0,
    grad:0,
    year:0,
    info:'',
    sex:[
      {name:'0',value:'男',checked:'true'},
      {name:'1',value:'女'}
    ],
    choice:[
      {name:'0',value:'是',checked:'true'},
      {name:'1',value:'否'}
    ],
    isSex:"0",
    information:[],
    userSex:'',
    modalHidden:true
    
  },
  //单选按钮发生变化
  radioChange(e){
    console.log(e.detail.value);
    var sexName=this.data.isSex
    this.setData({
      isSex:e.detail.value
    })
  },
  
  bindgradChange: function(e){
    console.log(e.detail.value)
    this.setData({
      grad: e.detail.value
    })
  },
  bindOccuChange: function(e){
    console.log(e.detail.value)
    this.setData({
      occu: e.detail.value
    })
  },
  bindyearChange: function(e){
    console.log(e.detail.value)
    this.setData({
      year: e.detail.value
    })
  },
  bindfoodChange: function(e){
    console.log(e.detail.value)
    this.setData({
     food : e.detail.value
    })
  },
  bindfood2Change: function(e){
    console.log(e.detail.value)
    this.setData({
     food2 : e.detail.value
    })
  },
  //表单提交
  login(e){
    console.log(e.detail.value)
    
     
    var _this = this
    console.log(_this.data.openID)
    const db  =  wx.cloud.database();
    const _ = db.command;
    db.collection('userInfo').doc(_this.data._id).update({
      data:{
        basicInfo:e.detail.value,
      }
    }).then((res)=>{
      console.log(res)
    })
    db.collection('userInfo').doc(_this.data._id).get().then((res)=>{
      console.log(res.data)
      wx.setStorageSync('userInfo',res.data)
    })
    wx.showToast({
      title:"提交成功",
      icon:"success",
      duration:2000,
      mask:true,
      success: function(){
        setTimeout(function(){
          wx.navigateBack({
            delta:1
          })
        },1500)
      }
    })

  },

  onLoad() {
    var _this = this
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        _this.setData({
          openID: res.result.data._openid,
          _id:res.result.data._id,
          
        })
        console.log('openID:', _this.data.openID)
        
      }
    })
  },
})
 