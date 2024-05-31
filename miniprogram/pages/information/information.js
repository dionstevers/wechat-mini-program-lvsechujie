const app = getApp()
const { logEvent } = require("../../utils/log");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    testGroup: null,
    userInfo:app.globalData.userInfo,
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    updateCloudThreshold: 10,
    articleTypes: {
      "碳行家": -1,
      "低碳我知道": 0,
      "低碳强国": 1
    },
    articles: [],
    articleRecommend: {
      frequencyScore: [],
      articleCount: [],
      readAmount: []
    },
    arlist: [],
  }, 

  /**
   * 页面实例数据
   */
  updateCounter: 0,
  isLoaded: false,
  shouldUpdateCloud: false,

  /**
   * 获取云端数据
   * @param {boolean} isForced 是否强行更新本地数据
   */
  async fetchCloudData(isForced){
    const db = wx.cloud.database();

    // 获取文章数据
    try {
      let articles = (await db.collection('articles').orderBy('uploadTime', 'asc').get()).data;

      this.setData({
        articles: articles,
      })
      
      console.log('storage data set')
    } catch (error) {
      console.error("获取文章时出错：", error);
    }
    
    // 处理articleRecommend数据丢失情况 
    if (wx.getStorageSync("articleRecommend") === "" || isForced){
      try {
        let articleRecommendData = (await db.collection('articleRecommend')
        .where({ _openid: getApp().globalData.openID })
        .get()).data;

        // 本地和云端都丢失则初始化云端数据库
        if (articleRecommendData.length === 0) {
          const articleRecommend = [
            Array.from({ length: (Object.keys(this.data.articleTypes).length - 1) }, // 概率数组
              () => (100 / 4) / (Object.keys(this.data.articleTypes).length - 1)), 
            Array.from({ length: (Object.keys(this.data.articleTypes).length - 1) }, // 文章存储数组
              () => 1),
            Array.from({ length: (Object.keys(this.data.articleTypes).length - 1) }, // 文章阅读量数组
              () => 0)
          ];
          await db.collection('articleRecommend').add({
            data:{
              frequencyScore: articleRecommend[0],
              articleCount: articleRecommend[1],
              readAmount: articleRecommend[2]
            }
          });
          wx.setStorageSync("articleRecommend", {
            frequencyScore: articleRecommend[0],
            articleCount: articleRecommend[1],
            readAmount: articleRecommend[2]
          })

        // 仅本地数据丢失情况
        } else {
          const articleRecommend = {
            frequencyScore: articleRecommendData[0].frequencyScore,
            articleCount: articleRecommendData[0].articleCount,
            readAmount: articleRecommendData[0].readAmount
          }
          wx.setStorageSync("articleRecommend", {
            frequencyScore: articleRecommend.frequencyScore,
            articleCount: articleRecommend.articleCount,
            readAmount: articleRecommend.readAmount
          })
        }

      } catch (error) {
        console.error("获取用户articleRecommend出错：", error);
      }
    }
  },

  /**
   * 更新云端articleRecommend
   */
  async updateCloudStorage(){
    const localArticleRecommend = wx.getStorageSync("articleRecommend");

    // 本地无存储则返回
    if (localArticleRecommend === "") {
      console.log("本地存储为空");
      return;
    }

    // 更新数据库
    try {
      const db = wx.cloud.database();
      let articleRecommendData = (await db.collection('articleRecommend')
        .where({ _openid: getApp().globalData.openID })
        .get()).data[0];

      if (articleRecommendData.length === 0) {
        await db.collection('articleRecommend').add({
          data:{
            frequencyScore: localArticleRecommend.frequencyScore,
            articleCount: localArticleRecommend.articleCount,
            readAmount: localArticleRecommend.readAmount
          }
        });
      } else {
        await db.collection('articleRecommend').doc(articleRecommendData._id).update({
          data: {
            frequencyScore: localArticleRecommend.frequencyScore,
            articleCount: localArticleRecommend.articleCount,
            readAmount: localArticleRecommend.readAmount
          }
        });
      }
    } catch(err) {
      // 更新失败
      console.log(err)
    }
  },

  /**
   * 更新本地frequencyScore
   * @param {number} pickedType 用户选择的articleType
   */
  updateLocalFrequencyScore(pickedType) {
    if (pickedType === -1) {
      return;
    }

    // 更新本地frequencyScore
    const updateFactor = (100 / 4) / (Object.keys(this.data.articleTypes).length - 1);
    this.data.articleRecommend.frequencyScore = this.data.articleRecommend.frequencyScore.map((value, index) => {
      if (index == pickedType) {
        return Math.min(value + updateFactor, 100); // 选中类型的概率值增加updateFactor
      } else {
        return Math.max(value - updateFactor, updateFactor); // 未选中类型的概率值减少updateFactor
      }
    });

    const localArticleRecommend = wx.getStorageSync('articleRecommend');
    if (localArticleRecommend !== ""){
      localArticleRecommend.frequencyScore = this.data.articleRecommend.frequencyScore;
      wx.setStorageSync('articleRecommend', localArticleRecommend)
    }
  },

  /**
   * 动态进行article分配
   */ 
  getArticleType() {
    // 计算各种文章概率分布
    const frequencyScore = this.data.articleRecommend.frequencyScore
    const readAmount = this.data.articleRecommend.readAmount
    const weightFS = 0.6

    const totalFrequencyScore = frequencyScore.reduce((sum, value) => sum + value, 0); // 归一化frequencyScore和readAmount
    const totalReadAmount = readAmount.reduce((sum, value) => sum + value, 0);
    const normalizedFrequencyScore = totalFrequencyScore !== 0 ? 
      frequencyScore.map(value => value / totalFrequencyScore) : frequencyScore;
    const normalizedReadAmount = totalReadAmount !== 0 ? 
      readAmount.map(value => value / totalReadAmount) : readAmount;

    const weightedAverage = normalizedFrequencyScore.map((fs, index) => { // 按照权重分配占比
      const normalizedRa = normalizedReadAmount[index];
      return weightFS * fs + (1 - weightFS) * normalizedRa;
    });

    const totalWeightedSum = weightedAverage.reduce((sum, value) => sum + value, 0); // 获取概率分布
    const probabilities = weightedAverage.map(value => value / totalWeightedSum);

    // 返回文章类型，0是type1; 1是type2; 2是type3; ...
    const randomValue = Math.random();
    let pickedType = -1;
    let cumulativeProbability = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProbability += probabilities[i];
      if (randomValue <= cumulativeProbability) {
        pickedType = i; 
        break;
      }
    }

    return pickedType;
  },

  /**
   * 给用户分配文章 （每种类型总会至少生成一个）
   * @param {number} articleNumber 总共生成的额外的文章数
   */
  getArticles(articleNumber){
    try{
      // 获取新文章
      const articleCountSum = this.data.articleRecommend.articleCount.reduce((a, b) => a + b, 0);
      const iterations = articleNumber + (Object.keys(this.data.articleTypes).length - 1) - articleCountSum;

      if (iterations > 0) {
        this.shouldUpdateCloud = true;
      }

      for (let i = 0; i < iterations; i++) {
        let articleType = this.getArticleType();
        if (articleType != -1 && articleType < (Object.keys(this.data.articleTypes).length - 1)) {
          // 检查文章是否已经达到上限
          if (this.data.articleRecommend.articleCount[articleType] < 
              this.data.articles.filter(article => this.data.articleTypes[article.author] === articleType).length) {
                this.data.articleRecommend.articleCount[articleType] ++;
                console.log(`生成${articleType}文章`);
          } else {
            console.log("已达文章上限");
          }
        } else {
          console.log("生成文章错误");
        }
      }

      // 更新本地articleCount
      const localArticleRecommend = wx.getStorageSync('articleRecommend');
      if (localArticleRecommend !== ""){
        localArticleRecommend.articleCount = this.data.articleRecommend.articleCount;
        wx.setStorageSync('articleRecommend', localArticleRecommend)
      }
    
      // 生成对应的文章给用户
      const articleList = this.data.articles.filter(article => article.author === "碳行家");

      for (let articleType = 0; articleType < (Object.keys(this.data.articleTypes).length - 1); articleType++) {
        if (this.data.articleRecommend.articleCount[articleType] === 0) continue;
        let articleRes = this.data.articles
          .filter(article => this.data.articleTypes[article.author] === articleType)
          .slice(0, this.data.articleRecommend.articleCount[articleType])
        articleList.push(...articleRes);
      }

      // 转换时间并按照时间升序排序
      this.setData({
        arlist: this.TimeConvert(articleList)
      })

    } catch(err) {
     console.log("分配文章失败: ", err)
    }
  },

  /**
   * 根据天数获取文章
   */
  getArticlesByLoginDays() {
    if(this.data.testGroup == 1){ // 空白对照组, 无文章
      console.log('blank control')
      return
    }

    const currentDate = new Date()
    var timeDiff = Math.abs(currentDate.getTime()-this.data.userInfo.loginDate); // 计算日期差异的毫秒数
    var dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // 将毫秒数转换为天数

    console.log(`${dayDiff} days since first login`)
    this.getArticles(dayDiff)
  },

  /**
   * 文章按钮事件
   */
  bindInfo(e){
    logEvent('Read Article')
    const author = e.currentTarget.dataset.author
    const link = e.currentTarget.dataset.link

    // 更新本地推荐概率值
    this.updateLocalFrequencyScore(this.data.articleTypes[author])
    this.updateCounter++;

    // 检查和存储counter并更新数据库
    wx.setStorageSync('articleClickCounter', this.updateCounter)
    if (this.updateCounter >= this.data.updateCloudThreshold) {
      this.updateCounter = 0;
      this.shouldUpdateCloud = true;
    }
    
    // 导航到对应链接
    wx.navigateTo({
      url:`/pages/detail/detail?link=${link}&articleType=${this.data.articleTypes[author]}`
    })
  },

  /**
   * 把文章日期格式化并排序
   * @param {Array} list 文章list
   */
  TimeConvert(list){
    // 格式化时间
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      const date = new Date(element.uploadTime);
      const formattedDate= date.toISOString().split("T")[0];
      element.date = formattedDate
    }

    // 按照 date 属性进行排序
    list.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    return list
  },

  /**
   * 异步处理数据录入
   */
  async loadData(){
    // 初始化页面数据
    await this.fetchCloudData(false)
    const localArticleRecommend = wx.getStorageSync('articleRecommend');
    if (localArticleRecommend !== "") {
      this.setData({
        articleRecommend: {
          frequencyScore: localArticleRecommend.frequencyScore,
          articleCount: localArticleRecommend.articleCount,
          readAmount: localArticleRecommend.readAmount
        }
      })
    }

    this.isLoaded = true;
    this.getArticlesByLoginDays();
    await this.updateCloudStorage();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo,
      testGroup :app.globalData.userInfo.testGroup
    });
    this.loadData();

    // 获取文章点击计数器
    const counterStored = wx.getStorageSync('articleClickCounter')
    if (counterStored !== "") {
      this.updateCounter = counterStored
    }

    // 根据测试组不同，背景颜色不同
    if(this.data.testGroup == 3){
      wx.setNavigationBarColor({
        backgroundColor: "#D13A29",
        frontColor: '#ffffff',
      })
      this.setData({
        background: 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)'
      })
    }
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
    // 提交用户log
    logEvent('Information Center')
    console.log('info page showing up')

    // 设置标题栏
    wx.setNavigationBarTitle({
      title: '碳行家｜信息中心'
    })

    // 更新文章显示和本地内容
    if (this.isLoaded) {
      this.getArticlesByLoginDays();

      const localArticleRecommend = wx.getStorageSync('articleRecommend');
      if (localArticleRecommend !== "") {
        this.setData({
          articleRecommend: {
            frequencyScore: localArticleRecommend.frequencyScore,
            articleCount: localArticleRecommend.articleCount,
            readAmount: localArticleRecommend.readAmount
          }
        })
      }
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 检查是否需要更新
    if (this.shouldUpdateCloud) {
      this.updateCloudStorage();
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 检查是否需要更新
    if (this.shouldUpdateCloud) {
      this.updateCloudStorage();
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log("refreshing")
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
    logEvent('Share App')
    const app = getApp()
    const openid = app.globalData.openID
    return {
      title: "快来一起低碳出街~",
      path:"/pages/index/index?id=" + openid,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  },

  /**
   * 测试用生成文章
   */
  debugGenerateArticle() {
    this.getArticles(this.data.arlist.length - (Object.keys(this.data.articleTypes).length - 1));
  },
})