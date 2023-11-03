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
  const db = wx.cloud.database()
  const _ = db.command
  var cycling = 0
  var pub_transit = 0
  var driving = 0
  wx.cloud.callFunction({
    name: 'login',
    success: id_res => {
      db.collection('track').where({
        _openid: id_res.result.data._openid,
      })
      .orderBy('date', 'desc')
      .get({
        success: function (res) {
          let list = res.data
          console.log(id_res.result.data._openid)
          console.log('get list:', list);
          list.forEach(item => {
            if (item['transport'] == "步行/自行车" || item['transport'] == "电动自行车" || item['transport'] == "步行或骑行") cycling += 1
            else if (item['transport'] == "公交/出租车/网约车/轨道交通" || item['transport'] == "公共交通") pub_transit += 1
            else driving += 1
          })
          console.log(cycling)
          console.log(pub_transit)
          console.log(driving)
          var option = {
            backgroundColor: 'rgba(0, 0, 0, 0)',
            legend: {
              orient: 'vertical',
              x: 'left',
              data: ['步行/骑行','公交','开车'],
              textStyle: {
                color: '#ffffff'
              }
  
            },
            series: [{
            label: {
                show: false,
                position: 'center'
              },
            labelLine: {
                show: false
              },
            avoidLabelOverlap: false,
            emphasis: {
                label: {
                  show: true,
                  fontSize: '20',
                  fontWeight: 'bold',
                  fontColor: '#ffffff',
                  formatter: '{b} : {c}'
                }
              },
              type: 'pie',
              center: ['50%', '50%'],
              radius: ['60%', '90%'],
        
              data: [{
                value: cycling,
                name: '步行/骑行'
              }, {
                value: pub_transit,
                name: '公交'
              }, {
                value: driving,
                name: '开车'
              }]
            }]
          };
          chart.setOption(option);
        }
      })
    }
  })
  return chart;
}
Page({

  /**
   * 页面的初始数据
   */

  data: {
    credit: 0,
    percent : 0,
    testGroup: 0,
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    ec: {
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
        functionTitle: '低碳问答',
        url: '../journal/journal?typeq=2'
      },
      {
        functionSrc: '../../asset/img/exchange.png',
        functionTitle: '积分中心',
        url: '../store/store'
      }
    ],
    CoinRatio: 0,

  },
  updateCredit(){
    const db = wx.cloud.database()
    db.collection('lottery').where({
      _openid : this.data.openID
    }).watch({
      onChange:(snapshot) =>{
        console.log('query result snapshot after the event', snapshot.docs[0])
          this.setData({
            credit : snapshot.docs[0].credit,
            percent: Math.floor(snapshot.docs[0].credit/1.5)
          })
      },
      onError:(err)=>{
        console.log(err)
      }
    })
  },
  initChart() {
    let chart;
    if (this.randerComponent) {

      this.randerComponent.init((canvas, width, height, dpr) => {
        const getPixelRatio = () => {
          let dpr = 0;
          wx.getSystemInfo({
            success: function (res) {
              dpr = res.pixelRatio
              console.log('dpr =  ', dpr)
            },
            fail: function () {
              dpr = 2
            }
          })
          return dpr
        }

        chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: getPixelRatio(),
        });
        setChartOption(chart);
        this.chart = chart;
        return chart
      })
    }
  },
  dealer() {
    return
  },
  curDate() {

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
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
  setUserinfo() {
    this.setData({
      openID: app.globalData.openID,
    })
    if (app.globalData.userInfo != null) {
      const userInfo = app.globalData.userInfo
      
      console.log('userinfo', userInfo)
      this.setData({
        userInfo: userInfo,
        testGroup: userInfo.testGroup
      })
      console.log('userinfo updated!!', this.data.userInfo)
      return
    }

  },
  onlogin(e) {
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
      scrollTop: 0,
      duration: 0,
    })
    this.setUserinfo()
    this.initChart()
    if(this.data.testGroup ==3 ) {
      this.setData({
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
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    this.updateCredit()
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
    return {
      title: "快来一起低碳出街~",
    }
  }

})