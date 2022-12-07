// pages/center/center.ts

import * as echarts from "../../ec-canvas/echarts"
const app = getApp();
 

 

function setChartOption(chart,chartdata){
   
  const option = {

    animation: true,
    grid: {
      bottom: 10,
      top: 10,
      left:40,
      right:20
    },
    
    calendar : {
      range : '2022-12',
      top:'25',
      left:'center',
      orient:'vertical',
      width:'230rpx',
      yearLabel: false,
      monthLabel: false,
       
      
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
          shadowColor: 'rgba(0, 0, 0, 0.5)'
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
    functionList: [{
        functionSrc: '../../asset/img/note.png',
        functionTitle: '低碳日记',
        url: '../journal/journal'
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
      setChartOption(chart,data);
      this.chart = chart;
      return chart
    })
  },
  // 为啥get行 getdata不行
   
  async getdata(){
    let data = wx.getStorageSync('userInfo')
    let info;
    if (data){
       
      let userInfo = await wx.cloud.database().collection('userInfo').doc(data._id).get()
      info = userInfo.data.loginlist
      this.initChart(info)
    }
    
    
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
  async getUserInfo(){
    const data = wx.getStorageSync('userInfo')
    if (data){
       
      let userInfo = await wx.cloud.database().collection('userInfo').doc(data._id).get()
      this.setData({
        userInfo: userInfo.data,
        list:userInfo.data.loginlist
      })
      app.globalData.userInfo = userInfo;
      console.log(userInfo)
    }
    
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
    this.getUserInfo();
    this.randerComponent = this.selectComponent('#mychart-dom-area')
    this.getdata();
      
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

  }
})