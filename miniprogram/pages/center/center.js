// pages/center/center.ts

import * as echarts from "../../ec-canvas/echarts"

const app = getApp();
 



function setChartOption(chart,chartdata,curDate){
   
  const option = {
      textStyle: {
    fontFamily: ['Times New Roman', 'Times', 'serif'],
  },
    animation: true,
    grid: {
      bottom: 10,
      top: 10,
      left:40,
      right:20
    },
   
    calendar : {
     
      dayLabel:{
        firstDay: 1 ,
        color: 'white',
        nameMap:'ZH'
      },
      range : curDate,
      top:'25',
      left:'center',
      orient:'vertical',
      width:'230rpx',
      yearLabel: false,
      monthLabel: false,
    
      itemStyle:{
        color:'rgba(180, 180, 180, 0)',
        borderColor:'rgba(255, 255, 254, 0.5)'
      },
      splitLine:{
        lineStyle:{
            color:'rgba(255，255，254, 0.5)' // This will change the border color
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
          shadowColor: 'rgba(0, 0, 0, 0.1)',
        },
        normal: {
          color: '',
          opacity:1,
          borderWidth:1,
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
    testGroup: 0,
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    ec:{  
      
    },
    userInfo: null,
    openID: '',
    functionList: [{
        functionSrc: '../../asset/img/camera.png',
        functionTitle: '低碳身边事',
        url: '../picUp/picUp'
      },
      {
        functionSrc: '../../asset/img/note.png',
        functionTitle: '每日打卡',
        url: '../journal/journal'
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
  dealer(){
    return
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
  selectWithinCurMonth(items) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Month value is zero-based, so adding 1 to get the current month
  
    const filteredItems = items.filter(([dateString, _]) => {
      const itemDate = new Date(dateString);
      const itemMonth = itemDate.getMonth() + 1;
  
      return itemMonth === currentMonth;
    });
  
    return filteredItems;
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
                list: res.data[0].loginlist,
                testGroup : res.data[0].testGroup
              })
              if (res.data[0].testGroup == 2) {
                _this.setData({
                  background : 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
                })
                wx.setTabBarStyle({
                  color: '#ffffff',
                  selectedColor: '#ffffff',
                  backgroundColor: '#D13A29',
                  borderStyle: 'white'
                })
                
                wx.setNavigationBarColor({
              
                  backgroundColor: "#D13A29",
                  frontColor: '#ffffff',
                })
                wx.setNavigationBarTitle({
                  title: '低碳强国',
                })
              }
              app.globalData.userInfo = _this.data.userInfo;
              _this.initChart(_this.selectWithinCurMonth(_this.data.list))
              console.log(_this.data.userInfo)
            }
          }
        })
      }
    })
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
    wx.pageScrollTo({
      scrollTop:0,
      duration: 0,
    })
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