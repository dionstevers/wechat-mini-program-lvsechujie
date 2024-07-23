// pages/detail/detail.ts
import { onCheckSignIn } from '../../utils/login'
import { updateColor } from '../../utils/colorschema'
import { logEvent } from '../../utils/log'
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    link: '',
    articleType: -1,
    openTime:'',
    userInfo:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options){
    const link = options.link
    const articleType = options.articleType
    const scrollAmount = options.scrollAmount
    const openTime  = new Date()
    this.setData({
      link: link,
      articleType: articleType,
      scrollAmount: scrollAmount,
      openTime: openTime,
      userInfo: app.globalData.userInfo
    })

    console.log('the link is: ', link, '\nthe article type is: ', articleType, '\nthe scroll amount is: ', scrollAmount)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    const db = wx.cloud.database()
    const endTime = new Date()
    const startTime = new Date(this.data.openTime)
    const timeDifference = endTime.valueOf() - startTime.valueOf();
    const localArticleRecommend = wx.getStorageSync('articleRecommend');

    // 更新本地readAmount
    if (onCheckSignIn()){   
      if (localArticleRecommend !== "" && this.data.articleType !== -1) {
        localArticleRecommend.readAmount[this.data.articleType] += Math.floor(timeDifference / 1000); // 阅读时间单位为：秒
        wx.setStorageSync('articleRecommend', localArticleRecommend)
      }
    }

    // 更新云端阅读记录
    try {
      db.collection('readHistory').add({
        data:{
          startTime: startTime,
          endTime: endTime,
          link: this.data.link,
          scrollAmount: this.data.scrollAmount
        }
      })
  
      // 信息激励强国版用户增加测试题 -- canceled now
      if (onCheckSignIn() && this.data.userInfo.testGroup === app.constData.TOTAL_TEST_GROUP_COUNT.INFOMATION && localArticleRecommend.infoGroup === 2) {
        // wx.navigateTo({
        //   url: '/pages/quiz/quiz?link=' + this.data.link,
        // })
        wx.showModal({
          title: '阅读成功',
          content:'低碳生活，携手同行！',
          showCancel: false
        })

      }
      else{  
        wx.showModal({
          title: '阅读成功',
          content:'低碳生活，携手同行！',
          showCancel: false
        })
      }
    } catch(err) {
      console.log("文章阅读记录失败：" + err)
    }
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 更新颜色
    updateColor();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  onShareAppMessage() {
    logEvent('Share App')
    return {
      title: "有意思的低碳知识，尽在碳行家~",
      path:`/pages/detail/detail?sharedFromID=${app.globalData.openid}&link=${this.data.link}`,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  }
})