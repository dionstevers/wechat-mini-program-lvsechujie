// pages/login/login.ts
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: defaultAvatarUrl,
    carSelected: false,
    _id: null,
    openID: null,
    userInfo: null,
    dobarr: ["18-23岁","24-29岁","30-39岁","40-49岁","50-59","60岁及以上"],
    occupationArr: ["学生","事业单位工作人员","党政机关工作人员", "国有企业员工", "外资企业雇员", "民营企业雇员", "私企或个体经营户", "体力工人", "自由职业者", "商业，服务从业者","退休"],
    gradArr: ["小学以下", "小学", "初中", "高中", "职高/中专", "大专", "大学", "硕士", "博士"],
    transArr: ["步行或骑行","公共交通","驾驶机动车"],
    carArr:["纯燃油车", "混合动力汽车", "插电式混合动力车", "增程式电动汽车","纯电动汽车"],
    car:null,
    occu: null,
    grad: null,
    trans:null,
    dob: null,
    email:'',
    nickname:null,
    info: '',
    sex: [
      { name: '0', value: '男', checked: 'true' },
      { name: '1', value: '女' },
      {name:'2', value:'保密'}
    ],
    choice: [
      { name: '0', value: '是', checked: 'true' },
      { name: '1', value: '否' }
    ],
    isSex: "0",
    information: [],
    userSex: '',
    modalHidden: false

  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail 
    this.setData({
      avatarUrl,
    })
  },
  modalConfirm(e){
    this.setData({
      modalHidden:true
    })
  },
  modalCancel(){
    wx.navigateBack({
      delta: 1
    })
  },
  //单选按钮发生变化
  radioChange(e) {
    console.log(e.detail.value);
    var sexName = this.data.isSex
    this.setData({
      isSex: e.detail.value
    })
  },

  bindgradChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      grad: e.detail.value
    })
  },
  bindcarChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      car: e.detail.value
    })
  },
  bindtransChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      trans: e.detail.value
    })
    if (e.detail.value==2) {
      this.setData({
        carSelected: true
      })
    }else{this.setData({
      carSelected: false
    })}
  },
  bindOccuChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      occu: e.detail.value
    })
  },
  bindDobChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      dob: e.detail.value
    })
  },

  bindemailchange: function(e){
    console.log(e.detail.value)
    this.setData({
      email:e.detail.value
    })
  },
  bindnamechange: function(e){
    console.log(e.detail.value)
    this.setData({
      nickname: e.detail.value
    })
  },
 
  //表单提交
  // 检验
  checkSubmit(){
    var email = this.data.email;
    var nickname = this.data.nickname;
    var car= this.data.car;
    var dob= this.data.dob;
    var occu = this.data.occu;
    var grad = this.data.grad;
    var trans = this.data.trans;
    var reg1 =  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    console.log(nickname)
    if(nickname == null){
      wx.showToast({
        title:"昵称未填写",
        icon:"error"
      })
      return 1 
    }
    if(dob == null){
      wx.showToast({
        title: '年龄未填写',
        icon:"error"
      })
      return 1
    }
    if(occu == null){
      wx.showToast({
        title: '职业未填写',
        icon:"error"
      })
      return 1
    }
    if(grad == null){
      wx.showToast({
        title: '学历未填写',
        icon:"error"
      })
      return 1
    }
    if(trans==null){
      wx.showToast({
        title: '出行方式未填写',
        icon:"error"
      })
      return 1
    }
    if(trans!=0&&car==null){
      wx.showToast({
        title: '能源形式未填写',
        icon:"error"
      })
      return 1 
    }
    if (email!='') {
      if(reg1.test(email)==false){
        console.log('邮箱格式错误，请检查');
        wx.showToast({
          title: "邮箱格式错误",
          icon: "error",
          duration: 2000,
          mask: true,
        })
        this.setData({
          email:''
        })
        return 1;
      }
    }
    return 2 
  },
  login(e) {
     
    console.log(e.detail.value)
    var _this = this
    var checkResult = _this.checkSubmit();
    
    if(checkResult==2){
      console.log(_this.data.openID)
      const db = wx.cloud.database();
      const _ = db.command;
      const avatar = _this.data.avatarUrl
      wx.cloud.uploadFile({
        cloudPath:'avatar/' + new Date().getTime() + '.jpeg',
        filePath: avatar,
        success: res =>{
          console.log('成功上传')
          console.log(res.fileID)
          const path = res.fileID
          db.collection('userInfo').add({
            data: {
              credit: 0,
              carbSum: 0,
              carblist: [],
              loginlist: [],
              prizelist: [],
              testGroup: Math.floor(Math.random()*5),
              attempts:0,
              avatar: path,
              basicInfo: e.detail.value,
              loginDate: new Date()
            }
          })
        }
      })
     
    
      wx.showToast({
        title: "提交成功",
        icon: "success",
        duration: 2000,
        mask: true,
        success: function () {
          setTimeout(function () {
            wx.navigateTo({
              url:"/pages/center/center"
            })
          }, 1500)
        }
      })
    }
    

  },
  onReady:function(){

  },
  
  
  onLoad() {
  },
})
