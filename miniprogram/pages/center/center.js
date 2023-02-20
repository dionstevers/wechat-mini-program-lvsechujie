// pages/center/center.ts

import * as echarts from "../../ec-canvas/echarts"
const app = getApp();
 



function setChartOption(chart,chartdata,curDate){
   
  const option = {

    animation: true,
    grid: {
      bottom: 10,
      top: 10,
      left:40,
      right:20
    },
     
    calendar : {
      range : curDate,
      top:'25',
      left:'center',
      orient:'vertical',
      width:'230rpx',
      yearLabel: false,
      monthLabel: false,
      itemStyle:{
        color:'rgba(180, 180, 180, 0)',
        borderColor:'rgba(180, 180, 180, 0.3)'
      },
      splitLine:{
        lineStyle:{
            color:'rgba(180, 180, 180, 0.3)' // This will change the border color
        }  
      },
    },
    visualMap: {
      min: 1,
      max: 10,
      show: false,
      
      calculable: true,
      orient: 'horizontal',
      top: 'middle',
      left: 'center',
      bottom: 10,
      
      inRange: {
        
        color: ["#B7FFBF", "#95F985", "#4DED30", "#26D701", "#00C301", "#00AB08"],
      }
    },
    
    series: [{
      name: 'Punch Card',
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data:chartdata,
      
      label: {
        normal: {
          show: false
        }
      },
      itemStyle: {
         
        emphasis: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
        normal: {
          color: '',
          opacity:1,
          borderWidth: 3,
          borderColor: '#ccc'
      }
      }
    }]
  };

  chart.setOption(option,true);
  return chart;
}


Page({

  /**
   * 页面的初始数据
   */
  
  data: {
    
    ec:{  
      
    },
    userInfo: null,
    openID: '',
    functionList: [{
        functionSrc: '../../asset/img/note.png',
        functionTitle: '低碳快拍',
        // url: '../journal/journal'
        url: '../picUp/picUp'
      },
      {
        functionSrc: '../../asset/img/history.png',
        functionTitle: '出行历史',
        url: '../triphistory/triphistory'
      },
      {
        functionSrc: '../../asset/img/exchange.png',
        functionTitle: '积分中心',
        url: '../store/store'
      }
    ],
    CoinRatio: 0,
     
  },
  initChart(data){
    let chart;
     
    this.randerComponent.init((canvas,width,height,dpr)=>{
      chart = echarts.init(canvas,null,{
        width:width,
        height:height,
        devicePixelRatio: dpr,
      });
      setChartOption(chart,data,this.curDate());
      this.chart = chart;
      return chart
    })
  },
  curDate(){
     
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var curDate = year + "-" + month;
    
    return curDate;
  },
  onTapFunction(e) {
    let {
      url
    } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({
        url,
      })
    }

  },

  // 已注册用户登录
  getUserInfo(){
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
            if(res.data.length == 1){
              _this.setData({
                userInfo: res.data[0],
                list: res.data[0].loginlist
              })
              app.globalData.userInfo = _this.data.userInfo;
              _this.initChart(_this.data.list)
              console.log(_this.data.userInfo)
            }
          }
        })
      }
    })
    /*
    if (data){
       
      let userInfo = await db.collection('userInfo').doc(data._id).get()
      this.setData({
        userInfo: userInfo.data,
        list:userInfo.data.loginlist
      })
      app.globalData.userInfo = userInfo;
      console.log(this.data.userInfo)
    }
    */
  },
  onlogin(e){
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },
  onSurvey(e) {
    wx.navigateTo({
      url: '/pages/survey/survey',
    })

  },
  onPrivacy(e) {
    wx.navigateTo({
      url: '/pages/privacy/privacy',
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.randerComponent = this.selectComponent('#mychart-dom-area');
    this.getUserInfo();
    this.curDate()
    
    //this.getdata();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  

  // onPullDownRefresh: function () {
      
  // },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return{
      title:"快来一起低碳出街~"
    }
  }
})