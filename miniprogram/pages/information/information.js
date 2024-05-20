const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    testGroup: null,
    userInfo:app.globalData.userInfo,
    background: 'linear-gradient(180deg, #00022a 0%,#009797 100%)',
    arlist: [],
    imgSrc:''
  }, 

  // 更新分配概率
  async updateRecommendation(pickedType) {
    const db = wx.cloud.database();

    try {
      // 获取用户articleRecommend
      const articleRecommendData = (await 
        db.collection('articleRecommend')
        .where({ _openid: getApp().globalData.openID })
        .get()).data[0];

      // 更新概率
      const updateFactor = 0.05;
      const newRecommendationProbabilities = articleRecommendData.recommendProbabilities.map((value, index) => {
        if (index == pickedType) {
          return Math.min(value + updateFactor, 1); // 选中类型的概率值增加 0.05
        } else {
          return Math.max(value - updateFactor, updateFactor); // 未选中类型的概率值减少 0.05
        }
      });

      // 更新数据库   
      await db.collection('articleRecommend').doc(articleRecommendData._id).update({
        data: {
          recommendProbabilities: newRecommendationProbabilities
        }
      });

    } catch(err) {
      // 更新失败
      console.log(err)
    }
  },

  // 动态进行article分配
  getArticleType(recommendationProbabilities) {
    // 计算各种文章类型的概率
    const sumProbabilities = recommendationProbabilities.reduce((a, b) => a + b, 0);
    const probabilities = recommendationProbabilities.map(probability => probability / sumProbabilities);

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
  async getArticles(articleNumber){
    const db = wx.cloud.database();

    try{
      // 获取用户的articleRecommend
      const recommendQuery = await db.collection('articleRecommend').where({ _openid: getApp().globalData.openID }).get();
      
      // 生成文章类型
      const recommendProbabilities = [];
      const articleCount = [];
      let _id = "";

      if (recommendQuery.data.length === 0){ // 更新旧用户
        const recommendationIndicator = [
          Array.from({ length: app.constData.totalArticleTypeNumber }, (_, i) => i === this.data.testGroup ? 1 : 0.05), // 概率数组
          Array.from({ length: app.constData.totalArticleTypeNumber }, () => 0) // 文章存储数组
        ];
        _id = (await db.collection('articleRecommend').add({
          data:{
            recommendProbabilities: recommendationIndicator[0],
            articleCount: recommendationIndicator[1]
          }
        }))._id;

        recommendProbabilities.push(...recommendationIndicator[0]);
        articleCount.push(...recommendationIndicator[1]);
      } else {
        _id = recommendQuery.data[0]._id
        recommendProbabilities.push(...recommendQuery.data[0].recommendProbabilities)
        articleCount.push(...recommendQuery.data[0].articleCount)
      }

      // 更新articleCount到数据库
      const articleCountSum = articleCount.reduce((a, b) => a + b, 0);
      const iterations = articleNumber - articleCountSum;

      for (let i = 0; i < iterations; i++) { // 获取新文章
        let articleType = this.getArticleType(recommendProbabilities);
        if (articleType != -1 && articleType < articleCount.length) {
          articleCount[articleType] ++;
          console.log(`生成${articleType}文章`);
        } else {
          console.log("生成文章错误");
        }
      }
      await db.collection('articleRecommend').doc(_id).update({
        data: {
          articleCount: articleCount
        }
      });
    
      // 生成对应的文章给用户
      const articleList = [(await 
        db.collection('articles')
        .where({author: '碳行家'})
        .get()).data[0]];

      for (let articleType = 0; articleType < articleCount.length; articleType++) {
        if(articleType === 0){ // 低碳我知道
          if (articleCount[articleType] === 0) continue;
          const res = await db.collection('articles').where({
            author: '低碳我知道'
          }).orderBy('uploadTime', 'asc').limit(articleCount[articleType]).get()
          articleList.push(...res.data);
        }
  
        if(articleType === 1){ // 低碳强国
          if (articleCount[articleType] === 0) continue;
          const res  = await db.collection('articles').where({
            author:'低碳强国'
          }).orderBy('uploadTime', 'asc').limit(articleCount[articleType]).get()
          articleList.push(...res.data);
        }
      }

      // 转换时间并按照时间升序排序
      this.setData({
        arlist: this.TimeConvert(articleList)
      })

    } catch(err) {
     console.log("error msg: ", err)
    }
  },

  // 按钮文章事件
  bindInfo(e){
    const author = e.currentTarget.dataset.author
    const link = e.currentTarget.dataset.link

    // 更新推荐概率值
    switch(author) {
      case "低碳我知道":
        this.updateRecommendation(0);
        break;
      case "低碳强国":
        this.updateRecommendation(1);
        break;
    }
    
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
  onLoad() {
    // 初始化页面数据
    this.setData({
      userInfo: app.globalData.userInfo,
      testGroup :app.globalData.userInfo.testGroup
    })

    // 根据测试组不同，背景颜色不同
    if(this.data.testGroup == 3 ){
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

    console.log(dayDiff)
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
      title: '碳行家｜环境资讯'
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
    this.getArticles(this.data.arlist.length);
  },
})