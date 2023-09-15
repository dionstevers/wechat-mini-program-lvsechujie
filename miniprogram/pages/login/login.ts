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
    occupationArr: ["国家机关、党群组织、企业、事业单位负责人、工作人员", "专业技术人员（包括：科学研究人员；工程/农业/飞机和船舶/卫生/经济与金融专业技术人员；法律、社会和宗教/文学、艺术、体育/新闻出版、文化专业人员；教学人员）", "办事人员和有关人员（包括：行政业务办理人员；行政事务处理人员； 行政执法和仲裁人员；人民警察；消防和应急救援人员；保卫人员）", "社会生产服务和生活服务人员", "农、林、牧、渔业生产及辅助人员", "军人", "自由职业者", "个体经营户"],
    gradArr: ["小学以下", "小学", "初中", "高中", "职高/中专", "大专", "大学", "硕士", "博士"],
    transArr: ["步行/自行车", "电动自行车", "驾驶机动车（摩托车/小型汽车）", "公共交通（公交/出租车/网约车/轨道交通）"],
    carArr:["纯燃油车", "混合动力汽车", "插电式混合动力车", "增程式电动汽车","纯电动汽车"],
    car:null,
    occu: null,
    grad: null,
    trans:null,
    year: null,
    email:null,
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
  bindyearChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      year: e.detail.value
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
    var year= this.data.year;
    var occu = this.data.occu;
    var grad = this.data.grad;
    var trans = this.data.trans;
    var reg1 =  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if(nickname==null||email==null|| trans == null||year == null||occu == null||grad == null||(trans==2&&car == null)){
      console.log('信息填写不全')
      this.setData({
        car:null,
        trans:null,
        year:null,
        occu:null,
        grad:null,
        email:null
      })
      wx.showToast({
        title: "信息填写不全",
        icon: "error",
        duration: 2000,
        mask: true,
      })
      return 1;
    }
    console.log(reg1.test(email))
    if(reg1.test(email)==false){
      console.log('邮箱格式错误，请检查');
      wx.showToast({
        title: "邮箱格式错误",
        icon: "error",
        duration: 2000,
        mask: true,
      })
      this.setData({
        email:null
      })
      return 2;
    }
    if(car!=null||nickname!=null&&email != null&&trans != null &&year != null&&occu != null&&grad != null&&reg1.test(email)==true){
      console.log('all good');
      return 3;
    }
  },
  login(e) {
     
    console.log(e.detail.value)
    var _this = this
    var checkResult = _this.checkSubmit();
    
    if(checkResult==3){
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
              testGroup: Math.floor(Math.random()*3),
              attempts:0,
              avatar: path,
              basicInfo: e.detail.value
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
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
        }
      })
    }
    

  },
  onReady:function(){

  },
  
  
  onLoad() {
    var _this = this
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        _this.setData({
          openID: res.result.data._openid,
          //_id:res.result.data._id,

        })
        console.log('openID:', _this.data.openID)

      }
    })
  },
})
