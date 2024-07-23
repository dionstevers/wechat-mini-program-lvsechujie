const { logEvent } = require("../../utils/log");
const { updateUserData, onCheckSignIn } = require("../../utils/login")
const { updateColor, setColorStyle } = require("../../utils/colorschema")
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    testGroup: -1,
    userInfo: null,
    openID: null,
    background: null,

    /** 是否从朋友圈转发进入 */
    isFromShareTimeline: true,

    /** 文章点击此次数将上传数据库 */ 
    updateCloudThreshold: 5,

    /** 文章推荐的权重 */
    recommendWeights: {
      frequencyScore: 3.0,
      readAmount: 2.0,
      dislike: -2.0,
      version: 15.0,
      dailyMultiplier: 0.75
    },
    
    /** 把infoGroup对应上articleTypes的index */ 
    infoGroup2ArticleType: {
      0: -1, // 基础版
      1: 0, // 森林版
      2: 1 // 强国版
    },

    /** 文章种类对应的的index */
    articleTypes: {
      '碳行家': -1,
      '低碳我知道': 0,
      '低碳强国': 1
    },

    articles: [],
    articleShowList: [],
    articleRecommend: {
      frequencyScore: [],
      articleCount: [],
      readAmount: [],
      readArticles: [],
      infoGroup: 0
    }
  },

  /**
   * 页面实例数据
   */
  updateCounter: 0,
  dailyPushed: false,
  shouldUpdateCloud: false,

  /**
   * 获取云端文章
   */
  async fetchCloudArticles(){
    const db = wx.cloud.database();

    // 获取文章数据
    try {
      const queryLimit = 20; // 微信单次获取上限为20
      let articles = [];
      let iterations = 0

      while (true) {
        let fetchedArticles = await db.collection('articles').skip(iterations * queryLimit).limit(queryLimit).get();
        articles = articles.concat(fetchedArticles.data);
        iterations++;

        if (fetchedArticles.data.length < queryLimit) {
          break;
        }
      }

      articles.sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime))  
      this.setData({ articles: articles })
      wx.setStorageSync("articles", articles)
      
      console.log(`成功从云端获取${articles.length}篇文章`)
    } catch (error) {
      console.error("获取文章时出错：", error);
    }
  },

  /**
   * 获取云端数据
   * @param {boolean} isForced 是否强行更新本地数据
   */
  async fetchCloudData(isForced){
    const db = wx.cloud.database();

    // 未注册用户没有articleRecommend
    if (!onCheckSignIn() && !isForced) {
      return;
    }

    // 获取文章
    let localArticles = wx.getStorageSync('articles');
    if (localArticles !== '') {
      this.setData({
        articles: localArticles
      })
    } else {
      await this.fetchCloudArticles();
    }

    // 处理articleRecommend数据丢失情况 
    if (wx.getStorageSync("articleRecommend") === "" || isForced){
      try {
        let articleRecommendData = (await db.collection('articleRecommend')
        .where({ _openid: this.data.openID })
        .get()).data;

        // 本地和云端都丢失则初始化云端数据库
        if (articleRecommendData.length === 0) {
          const totalInfoGroupNumber = Object.keys(this.data.infoGroup2ArticleType).length;
          const infoGroup = this.data.testGroup === app.constData.TOTAL_TEST_GROUP_COUNT.INFOMATION ?
            Math.floor(Math.random() * totalInfoGroupNumber) : 0; // 基础版: 0;森林版: 1 强国版: 2
          const articleRecommend = [
            // 概率数组
            Array.from({ length: (Object.keys(this.data.articleTypes).length - 1) },
              () => (100 / 4) / (Object.keys(this.data.articleTypes).length - 1)), 

            // 文章存储数组（普通版：每种类型总会至少生成1篇；森林版："低碳我知道"生成2篇；强国版："低碳强国"至少生成2篇 ...）
            Array.from({ length: (Object.keys(this.data.articleTypes).length - 1) },
              (_, articleTypeIndex) => infoGroup === 0 ? 
              1 : (articleTypeIndex === this.data.infoGroup2ArticleType[infoGroup] ?
              2 : 0)),

            // 文章阅读量数组
            Array.from({ length: (Object.keys(this.data.articleTypes).length - 1) },
            () => 0),
          ];

          await db.collection('articleRecommend').add({
            data:{
              frequencyScore: articleRecommend[0],
              articleCount: articleRecommend[1],
              readAmount: articleRecommend[2],
              readArticles: [],
              infoGroup: infoGroup
            }
          });
          wx.setStorageSync("articleRecommend", {
            frequencyScore: articleRecommend[0],
            articleCount: articleRecommend[1],
            readAmount: articleRecommend[2],
            readArticles: [],
            infoGroup: infoGroup,
            lastClickDate: new Date()
          })

        // 仅本地数据丢失情况
        } else {
          const articleRecommend = {
            frequencyScore: articleRecommendData[0].frequencyScore,
            articleCount: articleRecommendData[0].articleCount,
            readAmount: articleRecommendData[0].readAmount,
            readArticles: articleRecommendData[0].readArticles,
            infoGroup: articleRecommendData[0].infoGroup
          }
          wx.setStorageSync("articleRecommend", {
            frequencyScore: articleRecommend.frequencyScore,
            articleCount: articleRecommend.articleCount,
            readAmount: articleRecommend.readAmount,
            readArticles: articleRecommend.readArticles,
            infoGroup: articleRecommend.infoGroup,
            lastClickDate: new Date()
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
        .where({ _openid: this.data.openID })
        .get()).data;

      if (articleRecommendData.length === 0) {
        await db.collection('articleRecommend').add({
          data:{
            frequencyScore: localArticleRecommend.frequencyScore,
            articleCount: localArticleRecommend.articleCount,
            readAmount: localArticleRecommend.readAmount,
            readArticles: localArticleRecommend.readArticles,
            infoGroup: localArticleRecommend.infoGroup
          }
        });
      } else {
        await db.collection('articleRecommend').doc(articleRecommendData[0]._id).update({
          data: {
            frequencyScore: localArticleRecommend.frequencyScore,
            articleCount: localArticleRecommend.articleCount,
            readAmount: localArticleRecommend.readAmount,
            readArticles: localArticleRecommend.readArticles,

            // TODO: 下面是处理旧用户，等所有数据库中都包含infoGroup后，可以移除
            infoGroup: localArticleRecommend.infoGroup
          }
        });
      }
    } catch(err) {
      // 更新失败
      console.log(err)
    }
  },

  /**
   * 更新本地 articleShowList 使其高亮未读文章，并排序：未读文章在前、按照时间排序（降序）
   */
  updateLocalUnreadHighlight() {
    // 更新文章isUnread
    let readArticles = [];
    let unreadArticles = [];

    // 遍历原始文章列表，根据 isUnread 属性分类存放到相应数组中
    const readLinks = this.data.articleRecommend.readArticles.map(article => article.link);
    this.data.articleShowList.forEach(article => {
      const isUnread = !readLinks.includes(article.link);
      if (isUnread) {
        unreadArticles.push({ ...article, isUnread });
      } else {
        readArticles.push({ ...article, isUnread });
      }
    });

    // 按照事件排序文章，并且放未读文章在前
    const updatedList = this.timeConvert(unreadArticles).concat(this.timeConvert(readArticles));

    this.setData({
      articleShowList: updatedList
    });
  },

  /**
   * 更新本地 articleShowList 使其显示用户不喜爱的文章
   */
  updateLocalDislike() {
    // 遍历原始文章列表，根据 doDislike 属性更新用户是否不喜爱这个文章
    const dislikeLinks = this.data.articleRecommend.readArticles
      .filter(article => article.doDislike)
      .map(article => article.link);

    const updatedList = this.data.articleShowList.map(article => {
      const doDislike = dislikeLinks.includes(article.link);
      return { ...article, doDislike }
    });

    this.setData({
      articleShowList: updatedList
    });
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
   * 根据articleRecommend的数值，合理推荐文章种类
   * @returns {number} 文章种类（细节见this.data中的articleTypes）
   */ 
  getArticleType() {
    // 点击频率 frequencyScore 概率分布（归一化）
    const frequencyScore = this.data.articleRecommend.frequencyScore
    const totalFrequencyScore = frequencyScore.reduce((sum, value) => sum + value, 0);
    const nFrequencyScore = totalFrequencyScore !== 0 ? 
      frequencyScore.map(value => value / totalFrequencyScore) : frequencyScore;

    // 文章阅读量 readAmount 概率分布（归一化）
    const readAmount = this.data.articleRecommend.readAmount
    const totalReadAmount = readAmount.reduce((sum, value) => sum + value, 0);
    const nReadAmount = totalReadAmount !== 0 ? 
      readAmount.map(value => value / totalReadAmount) : readAmount;

    // 用户是否不喜欢 doDislike 概率分布（最小差值）
    const dislikeCount = new Array(Object.keys(this.data.articleTypes).length - 1).fill(0);
    this.data.articleRecommend.readArticles.forEach(readArticleObj => {
      const link = readArticleObj.link;
      const articleObj = this.data.articles.find(article => article.link === link);
      if (articleObj) {
        const author = articleObj.author;
        let i = this.data.articleTypes[author];
        if (readArticleObj.doDislike) {
          dislikeCount[i] += 1;
        }
      }
    });
    const minValue = Math.min(...dislikeCount);
    const minorDislikeCount = dislikeCount.map(count => count - minValue); 

    // 信息激励小版本 version 概率分布（归一化）
    const versionEffect = new Array(Object.keys(this.data.articleTypes).length - 1).fill(0);
    let j = this.data.infoGroup2ArticleType[this.data.articleRecommend.infoGroup];
    if (j >= 0 && j < versionEffect.length) {
      versionEffect[j] = 1;
    }

    // 按照权重分配占比
    const weightedAverage = nFrequencyScore.map((fs, index) => { 
      return Math.max(0.01, this.data.recommendWeights.frequencyScore * fs + 
              this.data.recommendWeights.readAmount * nReadAmount[index] + 
              this.data.recommendWeights.dislike * minorDislikeCount[index] +
              this.data.recommendWeights.version * versionEffect[index]);
    });

    // 获取概率分布
    const totalWeightedSum = weightedAverage.reduce((sum, value) => sum + value, 0); 
    const probabilities = weightedAverage.map(value => value / totalWeightedSum);

    console.log(`文章推荐指数分别为：\n\t'点击频率（归一化）'：[${nFrequencyScore}]\n\t'文章阅读量（归一化）'：[${nReadAmount}]\n\t'不喜欢计数（最小差值）'：[${minorDislikeCount}]\n\t'信息激励版本影响（独热编码）'：[${versionEffect}]\n\t'总概率分布（归一化）'：[${probabilities}]`)

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

    // 上传用户此次推荐的 features 到云端
    const db = wx.cloud.database()
    try {
      db.collection('recommendFeatures').add({
        data:{
          rawFeatures : {
            clickFrequency: Object.entries(this.data.articleTypes)
                                  .reduce((acc, [key, value]) => (
                                    value >= 0 ? (acc[key] = frequencyScore[value], acc) : acc
                                  ), {}),
            readDuration: Object.entries(this.data.articleTypes)
                                .reduce((acc, [key, value]) => (
                                  value >= 0 ? (acc[key] = readAmount[value], acc) : acc
                                ), {}),
            dislikeCount: Object.entries(this.data.articleTypes)
                                .reduce((acc, [key, value]) => (
                                  value >= 0 ? (acc[key] = dislikeCount[value], acc) : acc
                                ), {}),
            versionImpact: versionEffect.includes(1) ? Object.keys(this.data.articleTypes).find(
                              key => this.data.articleTypes[key] === versionEffect.indexOf(1)
                            ) : null
          },
          engineeredFeatures: {
            frequencyDistribution_normalized: nFrequencyScore,
            readDistribution_normalized: nReadAmount,
            dislikeCount_minorDifference: minorDislikeCount,
            versionEffect_oneHotEncoded: versionEffect
          },
          probabilityDistribution: Object.entries(this.data.articleTypes)
                                         .reduce((acc, [key, value]) => (
                                          value >= 0 ? (acc[key] = probabilities[value], acc) : acc
                                         ), {}),
          recommendedType: Object.keys(this.data.articleTypes).find(key => this.data.articleTypes[key] === pickedType),
          time : new Date()
        }
      })
    } catch(err) {
      console.log("无法上传用户的推荐Features", err)
    }

    // 返回生成的文章类型
    return pickedType;
  },

  /**
   * 给用户分配文章，并添加在articleShowList中
   * @param {number} newArticleCount 可增添的文章数量
   */
  getArticles(newArticleCount = 0){
    const typeLength = Object.keys(this.data.articleTypes).length;

    try{
      // 若要获取新文章，则告知需更新数据库
      if (newArticleCount > 0) {
        this.shouldUpdateCloud = true;
      }

      // 获取新文章
      for (let i = 0; i < newArticleCount; i++) {
        let articleType = this.getArticleType();
        if (articleType != -1 && articleType < (typeLength - 1)) {
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
      for (let articleType = 0; articleType < (typeLength - 1); articleType++) {
        if (this.data.articleRecommend.articleCount[articleType] === 0) continue;
        let articleRes = this.data.articles
          .filter(article => this.data.articleTypes[article.author] === articleType)
          .slice(0, this.data.articleRecommend.articleCount[articleType])
        articleList.push(...articleRes);
      }

      this.setData({
        articleShowList: articleList
      })

      // 更新文章Unread状态，并排序：未读文章在前、按照时间排序
      this.updateLocalUnreadHighlight();

      // 更新用户是否 dislike
      this.updateLocalDislike();

    } catch(err) {
     console.log("分配文章失败: ", err)
    }
  },

  /**
   * 根据天数获取文章（检查时间：每日凌晨4点）
   */
  CheckDailyUpdate() {
    const currentDate = new Date()
    const localArticleRecommend = wx.getStorageSync('articleRecommend');

    if (localArticleRecommend !== ""){
      // 计算日期差异（每日凌晨4点检查）
      var timeDiff = Math.abs(currentDate.getTime() - (new Date(localArticleRecommend.lastClickDate)).setHours(4,0,0,0)); 
      var dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      // 更新本地点击日期
      if (dayDiff > 0) {
        console.log('Daily Update!')
        localArticleRecommend.lastClickDate = currentDate;
        wx.setStorageSync('articleRecommend', localArticleRecommend);
      }
      
      this.dailyPushed = dayDiff > 0;
    }
  },


  /**
   * 文章按钮事件
   */
  bindInfo(e){
    logEvent('Read Article')
    const author = e.currentTarget.dataset.author
    const link = e.currentTarget.dataset.link
    const imgSrc = e.currentTarget.dataset.imgsrc
    const scrollAmount = `<${this.data.articleShowList.findIndex(item => item.link === link) + 1}TH> IN <TOTAL: ${this.data.articleShowList.length + 1}>`;

    // 导航到对应链接
    wx.navigateTo({
      url:`/pages/detail/detail?articleType=${this.data.articleTypes[author]}&scrollAmount=${scrollAmount}&link=${link}&imgSrc=${imgSrc}`,
      success: () => {
        // 未注册用户直接返回
        if (!onCheckSignIn()) {
          return;
        }

        // 新增已读文章
        if (!this.data.articleRecommend.readArticles.some(article => article.link === link)) {
          if (this.data.articleTypes[author] === -1) { // 碳行家文章只添加链接
            this.data.articleRecommend.readArticles.push({
              link: link
            });
          } else {
            this.data.articleRecommend.readArticles.push({ // 其他文章添加链接和是否用户不喜欢的指标（默认不会不喜欢）
              link: link,
              doDislike: false
            });
          }
        }

        // 更新本地FrequencyScore, readArticles和未读文章高亮
        this.updateLocalFrequencyScore(this.data.articleTypes[author]);
        this.updateLocalDislike();
        this.updateLocalUnreadHighlight();

        // 更新本地存储 articleRecommend 的已读文章列表 readArticles
        let localArticleRecommend = wx.getStorageSync('articleRecommend');
        if (localArticleRecommend !== ""){
          localArticleRecommend.readArticles = this.data.articleRecommend.readArticles;
          wx.setStorageSync('articleRecommend', localArticleRecommend)
        }

        // 检查和更新本地存储 articleClickCounter ，并允许更新数据库和新增文章
        this.updateCounter++;
        if (this.updateCounter >= this.data.updateCloudThreshold) {
          this.updateCounter = 0;
          this.shouldUpdateCloud = true;
          this.getArticles(1)
        }
        wx.setStorageSync('articleClickCounter', this.updateCounter)
      }
    })
  },

  /**
   * 不喜欢按钮事件
   */
  bindDislike(e) {
    // 切换不喜欢状态
    const targetArticle = this.data.articleRecommend.readArticles.find(article => article.link === e.currentTarget.dataset.link);
    targetArticle.doDislike = !targetArticle.doDislike;
    if (targetArticle.doDislike) {
      wx.showModal({
        title: '感谢您的反馈',
        content:`为您减少'${e.currentTarget.dataset.author}'的推荐量`,
        showCancel: false
      })
    }
    this.updateLocalDislike()
    
    // 更新本地存储 articleRecommend 的已读文章列表 readArticles
    let localArticleRecommend = wx.getStorageSync('articleRecommend');
    if (localArticleRecommend !== ""){
      localArticleRecommend.readArticles = this.data.articleRecommend.readArticles;
      wx.setStorageSync('articleRecommend', localArticleRecommend)
    }
  },

  /**
   * 把文章日期格式化并降序排序
   * @param {Array} list 文章list
   * @returns 更新的已排序的文章list
   */
  timeConvert(list){
    // 格式化时间
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      const date = new Date(element.uploadTime);
      const formattedDate= date.toISOString().split("T")[0];
      element.date = formattedDate
    }

    // 按照 date 属性进行排序
    list.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    return list
  },

  /**
   * 初始化本页面数据，此函数使用闭包，多次调用只会初始化一次
   */
  initData(){
    // 异步处理数据初始化录入
    const initialize = async () => {
      try {
        // 未登录用户直接返回
        if (!onCheckSignIn()) {
          return;
        }

        // 加载用户测试组数据
        this.setData({
          testGroup: this.data.userInfo.testGroup
        });

        // 初始化页面数据
        await this.fetchCloudData(false)
        const articleRecommend = wx.getStorageSync('articleRecommend');

        // TODO: 这是用来处理旧用户的，等到所有用户都有infoGroup, 可以移除
        if (articleRecommend.infoGroup == undefined) {
          const totalInfoGroupNumber = Object.keys(this.data.infoGroup2ArticleType).length
          articleRecommend.infoGroup = this.data.testGroup === app.constData.TOTAL_TEST_GROUP_COUNT.INFOMATION ? 
            Math.floor(Math.random() * totalInfoGroupNumber) : 0; // 基础版: 0;森林版: 1 强国版: 2
          wx.setStorageSync('articleRecommend', articleRecommend);
        }

        // TODO: 这是用来处理旧用户的，等到所有用户都有readArticles, 可以移除
        if (articleRecommend.readArticles == undefined) {
          articleRecommend.readArticles = []
          wx.setStorageSync('articleRecommend', articleRecommend);
        }

        // 设置页面实例数据
        this.setData({
          articleRecommend: {
            frequencyScore: articleRecommend.frequencyScore,
            articleCount: articleRecommend.articleCount,
            readAmount: articleRecommend.readAmount,
            readArticles: articleRecommend.readArticles,
            infoGroup: articleRecommend.infoGroup
          }
        })

        // 获取文章点击计数器
        const counterStored = wx.getStorageSync('articleClickCounter')
        if (counterStored !== "") {
          this.updateCounter = counterStored
        }

        // 根据测试组不同，背景颜色不同 (强国组: 红色，其他：青色)
        if(this.data.articleRecommend.infoGroup === 2){
          setColorStyle('RED');
        } else {
          setColorStyle('CYAN');
        }

        // 检查天数是否更新（每日凌晨4点）
        this.CheckDailyUpdate(); 
        if (this.dailyPushed) {
          // 更新本地文章数据
          await this.fetchCloudArticles();

          // 每日更新 2 篇文章
          this.getArticles(2);

          // 减少以往天数的推荐比重
          const localArticleRecommend = wx.getStorageSync('articleRecommend');
          const frequencyScore = this.data.articleRecommend.frequencyScore;
          const minFrequencyScore = Math.min(...frequencyScore);
          const previousFrequencyScore = frequencyScore.map(
            element => (element - minFrequencyScore) * this.data.recommendWeights.dailyMultiplier + minFrequencyScore
          );

          const readAmount = this.data.articleRecommend.readAmount;
          const previousReadAmount = readAmount.map(
            element => element * this.data.recommendWeights.dailyMultiplier
          )

          localArticleRecommend.frequencyScore = previousFrequencyScore;
          localArticleRecommend.readAmount = previousReadAmount;
          wx.setStorageSync('articleRecommend', localArticleRecommend)
        } else {
          this.getArticles();
        }

        this.dailyPushed = false;
        await this.updateCloudStorage();
        console.log("Information页面初始化成功！");
      } catch (error) {
        console.error("Information页面初始化错误", error);
        this.initData.executed = false;
      }
    };

    // 让该函数只能初始化一次
    if (!this.initData.executed) {
      initialize();
      this.initData.executed = true;
    } else {
      console.log("Information页面已经初始化过了！");
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 转发朋友圈链接，导航到登录页面
    if (options.isFromShareTimeline) {
      wx.navigateTo({
        url: `/pages/index/index?sharedFromID=${options.sharedFromID}`,
        success: () => {
          this.setData({
            isFromShareTimeline: false
          });
        }
      })
      return;
    } else {
      this.setData({
        isFromShareTimeline: false
      });
    }

    // 游客登录初始化
    onCheckSignIn({
      failed : async () => {
        // 游客登陆每种文章仅有一篇（‘碳行家’文章除外）
        let localArticles = wx.getStorageSync('articles');
        if (localArticles !== '') {
          this.setData({
            articles: localArticles
          })
        } else {
          await this.fetchCloudArticles();
        }
        
        const articleShowList = this.data.articles.filter(article => article.author === "碳行家");
        const firstArticles = Object.values(this.data.articles
          .filter(art => art.author !== "碳行家")
          .reduce((acc, article) => 
            (!acc[article.author] && (acc[article.author] = article), acc), {}
          ));

        this.setData({
          articleShowList: this.timeConvert(articleShowList.concat(firstArticles))
        })
      }
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
    // 朋友圈进来则不显示
    if (this.data.isFromShareTimeline) {
      return;
    }

    // 更新颜色
    updateColor();

    // 检查登录状态
    updateUserData();
    onCheckSignIn({
      message : '请您登录',
      success: () => {
        // 初始化数据
        this.initData();

        // 更新本地 data 阅读量 readAmount
        let localArticleRecommend = wx.getStorageSync('articleRecommend');
        this.data.articleRecommend.readAmount = localArticleRecommend.readAmount;
      }
    })

    // 提交用户log
    logEvent('Information Center')
    console.log('info page showing up')

    // 设置标题栏
    wx.setNavigationBarTitle({
      title: '碳行家｜信息中心'
    })
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
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 朋友圈分享
   */
  onShareTimeline(){
    logEvent('Share App')
    return{
      title:'有意思的低碳知识，尽在碳行家～',
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      query:`sharedFromID=${app.globalData.openID}&isFromShareTimeline=true`,
      success: function(res){
        console.log(res)
      },fail: function (res){console.log(res)}
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    logEvent('Share App')
    return {
      title: "有意思的低碳知识，尽在碳行家～",
      path:`/pages/index/index?sharedFromID=${app.globalData.openID}`,
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
    this.getArticles(1);
  },
})