const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    testGroup: null,
    userInfo:app.globalData.userInfo,
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    articleTypes: {
      "低碳我知道": 0,
      "低碳强国": 1
    },
    articles: [],
    articleRecommend: {
      recommendProbabilities: [],
      articleCount: []
    },
    arlist: [],
  }, 

  // 获取云端数据
  async fetchCloudData(){
    const db = wx.cloud.database();

    // 获取文章数据
    try {
      let articles = (await db.collection('articles').orderBy('uploadTime', 'asc').get()).data;
      wx.setStorageSync("articles", articles)
    } catch (error) {
      console.error("获取文章时出错：", error);
    }
    
    // 处理articleRecommend数据丢失情况 
    if (wx.getStorageSync("articleRecommend") === ""){
      try {
        let articleRecommendData = (await db.collection('articleRecommend')
        .where({ _openid: getApp().globalData.openID })
        .get()).data;

        // 本地和云端都丢失则初始化云端数据库
        if (articleRecommendData.length === 0) {
          const articleRecommend = [
            Array.from({ length: Object.keys(this.data.articleTypes).length }, // 概率数组
              () => 0.2 / Object.keys(this.data.articleTypes).length), 
            Array.from({ length: Object.keys(this.data.articleTypes).length }, // 文章存储数组
              () => 1) 
          ];
          await db.collection('articleRecommend').add({
            data:{
              recommendProbabilities: articleRecommend[0],
              articleCount: articleRecommend[1]
            }
          });
          wx.setStorageSync("articleRecommend", articleRecommend)

        // 仅本地数据丢失情况
        } else {
          const articleRecommend = {
            recommendProbabilities: articleRecommendData[0].recommendProbabilities,
            articleCount: articleRecommendData[0].articleCount
          }
          wx.setStorageSync("articleRecommend", articleRecommend)
        }

      } catch (error) {
        console.error("获取用户articleRecommend出错：", error);
      }
    }
  },

  // 更新云端articleRecommend
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
            recommendProbabilities: localArticleRecommend["recommendProbabilities"],
            articleCount: localArticleRecommend["articleCount"]
          }
        });
      } else {
        await db.collection('articleRecommend').doc(articleRecommendData._id).update({
          data: {
            recommendProbabilities: localArticleRecommend["recommendProbabilities"],
            articleCount: localArticleRecommend["articleCount"]
          }
        });
      }
    } catch(err) {
      // 更新失败
      console.log(err)
    }
  },

  // 更新本地recommendProbabilities
  updateLocalRecommend(pickedType) {
    // 更新概率
    const updateFactor = 0.2 / Object.keys(this.data.articleTypes).length;
    this.data.articleRecommend.recommendProbabilities = this.data.articleRecommend.recommendProbabilities.map((value, index) => {
      if (index == pickedType) {
        return Math.min(value + updateFactor, 1); // 选中类型的概率值增加updateFactor
      } else {
        return Math.max(value - updateFactor, updateFactor); // 未选中类型的概率值减少updateFactor
      }
    });

    wx.setStorageSync("articleRecommend", this.data.articleRecommend)
  },

  // 动态进行article分配
  getArticleType(recommendationProbabilities) {
    // 计算各种文章类型的概率
    const sumProbabilities = 
      recommendationProbabilities
      .reduce((a, b) => a + b, 0);
    const probabilities = 
      recommendationProbabilities
      .map(probability => probability / sumProbabilities);

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

  // 给用户分配文章
  getArticles(articleNumber){
    try{
      // 更新本地articleCount
      const articleCountSum = this.data.articleRecommend.articleCount.reduce((a, b) => a + b, 0);
      const iterations = articleNumber + Object.keys(this.data.articleTypes).length - articleCountSum;

      // 获取新文章
      for (let i = 0; i < iterations; i++) {
        let articleType = this.getArticleType(this.data.articleRecommend.recommendProbabilities);
        if (articleType != -1 && articleType < Object.keys(this.data.articleTypes).length) {
          // 检查文章是否已经达到上限
          if (this.data.articleRecommend.articleCount[articleType] < 
              this.data.articles.filter(article => this.data.articleTypes[article.author] === articleType).length) {
                this.data.articleRecommend.articleCount[articleType] ++;
                console.log(`生成${articleType}文章`);
              }
        } else {
          console.log("生成文章错误");
        }
      }

      wx.setStorageSync("articleRecommend", this.data.articleRecommend)
    
      // 生成对应的文章给用户
      const articleList = this.data.articles.filter(article => article.author === "碳行家");

      for (let articleType = 0; articleType < Object.keys(this.data.articleTypes).length; articleType++) {
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

  // 按钮文章事件
  bindInfo(e){
    const author = e.currentTarget.dataset.author
    const link = e.currentTarget.dataset.link

    // 更新推荐概率值
    this.updateLocalRecommend(this.data.articleTypes[author])
    
    // 导航到对应链接
    wx.navigateTo({
      url:'/pages/detail/detail?link=' + link
    })
  },

  // 把文章日期格式化并排序
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
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    // 初始化页面数据
    await this.fetchCloudData()

    this.setData({
      userInfo: app.globalData.userInfo,
      testGroup :app.globalData.userInfo.testGroup,
      articles: wx.getStorageSync('articles'),
      articleRecommend: wx.getStorageSync('articleRecommend')
    })

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
    
    // 根据天数获取文章
    if(this.data.testGroup == 1){ // 空白对照组, 无文章
      console.log('blank control')
      return
    }

    const currentDate = new Date()
    var timeDiff = Math.abs(currentDate.getTime()-this.data.userInfo.loginDate); // 计算日期差异的毫秒数
    var dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // 将毫秒数转换为天数

    console.log(`距离登陆日已过了 ${dayDiff} 天`)
    this.getArticles(dayDiff)
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
      title: '碳行家｜信息中心'
    })

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

  },

  // 测试用生成文章
  debugGenerateArticle() {
    this.getArticles(this.data.arlist.length - 2);
  },
})