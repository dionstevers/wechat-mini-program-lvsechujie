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
    link: null,
    articleType: -1,
    imgSrc: null,
    scrollAmount: null,
    sharedFromID: null,
    openTime:null,
    userInfo:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options){
    const link = options.link
    const imgSrc = options.imgSrc
    const articleType = options.articleType
    const scrollAmount = options.scrollAmount
    const sharedFromID = options.sharedFromID ? options.sharedFromID : null
    const openTime  = new Date()
    this.setData({
      link: link,
      imgSrc: imgSrc,
      articleType: articleType,
      scrollAmount: scrollAmount,
      sharedFromID: sharedFromID,
      openTime: openTime,
      userInfo: app.globalData.userInfo
    })

    console.log('the link is: ', link, '\nthe image source is: ', imgSrc, '\nthe article type is: ', articleType, '\nthe scroll amount is: ', scrollAmount, '\nthe shared from ID is: ', sharedFromID);

    if (sharedFromID) {
      wx.showModal({
      title: '欢迎阅读碳行家文章',
        content:'进入小程序可阅读更多有趣文章！',
        showCancel: false
      })
    }
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
          scrollAmount: this.data.scrollAmount ? this.data.scrollAmount : null,
          sharedFromID: this.data.sharedFromID ? this.data.sharedFromID : null
        }
      })
      
      onCheckSignIn({
        success: () => {
          // 信息激励强国版用户增加测试题 -- canceled now
          if (this.data.userInfo.testGroup === app.constData.TOTAL_TEST_GROUP_COUNT.INFOMATION && localArticleRecommend.infoGroup === 2) {
            // wx.navigateTo({
            //   url: '/pages/quiz/quiz?link=' + this.data.link,
            // })
            wx.showModal({
              title: '阅读成功',
              content:'低碳生活，携手同行！',
              showCancel: false
            })

          // 普通用户
          } else { 
            wx.showModal({
              title: '阅读成功',
              content:'低碳生活，携手同行！',
              showCancel: false
            })
          }
        },
        failed: () => {
          wx.showModal({
            title: '阅读成功',
            content:'登陆即可阅读更多有趣的文章！',
            showCancel: false,
            success: (res) =>{
              if(res.confirm){
                let localAutoLogin = wx.getStorageSync('autoLogin');
                if (localAutoLogin) {
                  let indexPageInstance = getCurrentPages()
                    .find(page => page.route === 'pages/index/index');
                  indexPageInstance?.HandleSignIn();
                }
              }
            }
          })
        }
      }) 
      
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

  onShareAppMessage() {
    logEvent('Share App')
    return {
      title: "有意思的低碳知识，尽在碳行家~",
      path:`/pages/index/index?sharedFromID=${app.globalData.openID}&articleLink=${this.data.link}&articleType=${this.data.articleType}&isFromArticleShared=${true}`,
      imageUrl: this.data.imgSrc,
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  }
})