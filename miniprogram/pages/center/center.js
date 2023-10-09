// pages/center/center.ts

import * as echarts from "../../asset/ec-canvas/echarts"
const app = getApp();

function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);
  var option = {
    backgroundColor: 'rgba(0, 0, 0, 0)' ,
    series: [{
      label: {
        normal: {
          fontSize: 14
        }
      },
      type: 'pie',
      center: ['50%', '50%'],
      radius: ['60%', '90%'],
      
      data: [{
        value: 55,
        name: '骑行'
      },{
        value: 10,
        name: '公交'
      }, {
        value: 20,
        name: '机动车'
      }]
    }]
  };

  chart.setOption(option);
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
      onInit: initChart
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
        functionTitle: '每日一题',
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
 
  initChart(){
    let chart;
    if (this.randerComponent) {
      
      this.randerComponent.init((canvas,width,height,dpr)=>{
        const getPixelRatio = () => {
        let dpr = 0;
          wx.getSystemInfo({
            success: function (res){
              dpr  = res.pixelRatio
              console.log('dpr =  ', dpr)
            },
            fail: function(){
              dpr = 2
            }
          })
          return dpr 
        }
        
        chart = echarts.init(canvas,null,{
          width:width,
          height:height,
          devicePixelRatio: getPixelRatio(),
        });
        setChartOption(chart);
        this.chart = chart;
        return chart
      })
    }
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
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
  
    const filteredItems = items.filter(([dateString, _]) => {
      const [year, month] = dateString.split('-').map(Number);
      return year === currentYear && month === currentMonth;
    });
  
    return filteredItems;
  },
  // 已注册用户登录
  // getUserInfo(){
  //   const db = wx.cloud.database();
  //   let _this = this;
  //   wx.cloud.callFunction({
  //     name: 'login',
  //     success: res => {
  //       _this.setData({
  //         openID: res.result.data._openid,
  //       })
  //       console.log('openID:', _this.data.openID)
  //       db.collection('userInfo').where({
  //         _openid: _this.data.openID,
  //       })
  //       .get({
  //         success: function (res) {
  //           console.log(_this.data.userInfo)
  //           console.log(res.data)
  //           if(res.data.length == 1){
  //             _this.setData({
  //               userInfo: res.data[0],
  //               list: res.data[0].loginlist,
  //               testGroup : res.data[0].testGroup
  //             })
  //             if (res.data[0].testGroup == 2) {
  //               _this.setData({
  //                 background : 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
  //               })
  //               wx.setTabBarStyle({
  //                 color: '#ffffff',
  //                 selectedColor: '#ffffff',
  //                 backgroundColor: '#D13A29',
  //                 borderStyle: 'white'
  //               })
                
  //               wx.setNavigationBarColor({
              
  //                 backgroundColor: "#D13A29",
  //                 frontColor: '#ffffff',
  //               })
                
  //             }
  //             app.globalData.userInfo = _this.data.userInfo;
  //             const datat = _this.selectWithinCurMonth(_this.data.list)
  //             console.log('the data is ', datat, 'the original is', _this.data.list)
  //             // selectwithinmonth有问题，ios端返回的是空的列表
  //             _this.initChart(datat)
              
  //             console.log(_this.data.userInfo)
  //             console.log("chart init success")
  //           }
  //         }
  //       })
  //     }
  //   })
  // },
  setUserinfo(){
      this.setData({
        openID: app.globalData.openID
      })
      if(app.globalData.userInfo!=null){
        this.setData({
          userInfo: app.globalData.userInfo
        })
        console.log('userinfo updated!!',this.data.userInfo)
        return 
      }
      
  },
  onlogin(e){
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },
  onSurvey(e) {
    wx.navigateTo({
      url: '/pages/aboutus/aboutus',
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
    this.setUserinfo()
    this.initChart()
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
    wx.setNavigationBarTitle({
      title: '碳行家｜个人中心'
    })
    this.randerComponent = this.selectComponent('#mychart-dom-area');
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
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    }) 
    return{
      title:"快来一起低碳出街~",
    }
  }

})