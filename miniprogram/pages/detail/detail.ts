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
    article: {
      title: "标题模板",
      geolocation: "全国",
      uploadTime: "2024-11-11 11:11:11",
      tags: ["#标签1", "#标签2"],
      texts: ["这里放第一段文字，第一段文字上方是第一张图片，如果希望图片显示在最前，则第一段文字用\"\"，以此类推。",
              "这里放第二段文字，第二段文字上方是第二张图片，如果希望两张图片紧接着显示，则第二段文字用\"\"，以此类推。"],
      imgs: ["https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/personalized/%E9%AA%91%E8%A1%8C%E6%B1%BD%E8%BD%A6.png?sign=95e224f0caf96fa684c8bc06ef5b7094&t=1722219043",
             "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/personalized/%E8%A1%A3%E9%A3%9F%E8%A1%8C.jpg?sign=49c273e74497c80274f9a7f387a57d4e&t=1722219019"]
    },

    totalTags: null,
    scrollAmount: null,
    sharedFromID: null,
    openTime:null,
    userInfo:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options){
    const title = options.title ? decodeURIComponent(options.title) : null
    const uploadTime = options.uploadTime ?? null
    const texts = options.texts ? JSON.parse(options.texts).map(
      text => { return decodeURIComponent(text) }
    ) : null
    const imgs = options.imgs ? JSON.parse(options.imgs).map(
      img => { return decodeURIComponent(img) }
    ) : null
    const geolocation = options.geolocation ?? null
    const articleTags = options.tags ? JSON.parse(options.tags) : null
    const totalTags = options.totalTags ? JSON.parse(options.totalTags) : null
    const scrollAmount = options.scrollAmount
    const sharedFromID = options.sharedFromID ?? null
    const openTime  = new Date()
    this.setData({
      article: {
        title: title,
        geolocation: geolocation,
        uploadTime: uploadTime,
        tags: articleTags ? articleTags.map(tag => `#${tag}`) : ["#碳行家"],
        texts: texts,
        imgs: imgs
      },

      totalTags: totalTags,
      scrollAmount: scrollAmount,
      sharedFromID: sharedFromID,
      openTime: openTime,
      userInfo: app.globalData.userInfo
    })

    console.log("文章信息：\n\t'文章标题': ", title, "\n\t'图片链接': ", imgs[0], "\n\t'文章标签': ", articleTags, "\n\t'滚动参数': ", scrollAmount, "\n\t'分享openID': ", sharedFromID);

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
      if (localArticleRecommend !== "" && this.data.totalTags !== null && this.data.article.tags != null) {
        this.data.article.tags.forEach(tag => {
          let index = this.data.totalTags.indexOf(tag);
          if (index !== -1) localArticleRecommend.readAmount[index] += Math.floor(timeDifference / 1000);
        });

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
          scrollAmount: this.data.scrollAmount ?? null,
          sharedFromID: this.data.sharedFromID ?? null
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
      imageUrl: this.data.article.imgs[0],
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  }
})