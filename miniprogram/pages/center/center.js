// pages/center/center.ts
import * as echarts from "../../ec-canvas/echarts"
const app = getApp();

function initChart(canvas,width,height,dpr){
  const chart = echarts.init(canvas,null,{
    width:width,
    height:height,
    devicePixelRatio:dpr
  })
  canvas.setChart(chart)
  const model = {
    yCates: ['5', '4', '3',
      '2', '1'],
    xCates: ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri','Sat','Sun'],
    data: [
      // [yCateIndex, xCateIndex, value]
      // 替换为云数据库data
      [0, 0, 1], [0, 1, 7], [0, 2, 3], [0, 3, 5], [0, 4, 2],[0,5,1],[0,6,1],
      [1, 0, 1], [1, 1, 2], [1, 2, 4], [1, 3, 8], [1, 4, 2],[1,5,1],[1,6,3],
      [2, 0, 2], [2, 1, 3], [2, 2, 8], [2, 3, 6], [2, 4, 7],[2,5,1],[2,6,1],
      [3, 0, 3], [3, 1, 7], [3, 2, 5], [3, 3, 1], [3, 4, 6],[3,5,1],[3,6,4],
      [4, 0, 3], [4, 1, 2], [4, 2, 7], [4, 3, 8], [4, 4, 9],[4,5,1],[4,6,1],
      [5, 0, 2], [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 7],[5,5,1],[5,6,1],
      [6, 0, 6], [6, 1, 5], [6, 2, 3], [6, 3, 1], [6, 4, 2],[6,5,1],[6,6,2]
    ]
  };

  const data = model.data.map(function (item) {
    return [item[1], item[0], item[2] || '-'];
  });

  const option = {
    // tooltip: {
    //   position: 'top'
    // },
    animation: true,
    grid: {
      bottom: 20,
      top: 10,
      left:40,
      right:20
    },
    xAxis: {
      type: 'category',
      data: model.xCates
    },
    yAxis: {
      type: 'category',
      data: model.yCates
    },
    visualMap: {
      min: 1,
      max: 10,
      show: false,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      inRange: {
        color: ["#B7FFBF", "#95F985", "#4DED30", "#26D701", "#00C301", "#00AB08"],
      }
    },
    series: [{
      name: 'Punch Card',
      type: 'heatmap',
      data: data,
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

  chart.setOption(option);
  return chart;
};


Page({

  /**
   * 页面的初始数据
   */
  data: {
    ec:{
      onInit: initChart
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
    CoinRatio: 0
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

  // 用户注册
  async login() {
    const {
      userInfo
    } = await wx.getUserProfile({
      desc: '用于完善用户信息',
    })
    console.log(userInfo)
    var _this = this
    wx.cloud.callFunction({
      name: 'login',
      data: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
      },
      success: res => {
        _this.setData({
          userInfo: res.result.data
        })
      
      wx.setStorageSync('userInfo', res.result.data)

      }
    })
  },
  // 已注册用户登录
  async getUserInfo(){
    const data = wx.getStorageSync('userInfo')
    if (data){
       
      const userInfo = await wx.cloud.database().collection('userInfo').doc(data._id).get()
      this.setData({
        userInfo: userInfo.data
      })
      console.log(userInfo)
    }
    
  },

  onSurvey(e) {
    wx.navigateTo({
      url: '/pages/survey/survey',
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
    this.getUserInfo()
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
  onPullDownRefresh() {

  },

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