const { logEvent } = require("../../utils/log");
const { updateUserData, onCheckSignIn } = require("../../utils/login")
const { updateColor, setColorStyle } = require("../../utils/colorschema")
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    /** 页面基本信息 */
    RECOMMENDATION_VERSION: 2.1, // 用来识别是否需要处理就用户的 （Note: 请勿轻易更改，会去除用户当前的articleRecommend信息）
    updateCounter: 0,
    shouldUpdateCloud: false,
    background: null,

    /** UI 相关 */
    UITotalTags: [],
    UISelectedTag: "",
    articleShowList: [],

    /** 用户基本信息 */
    userInfo: null,
    openID: null,

    /** 是否从朋友圈转发进入 */
    isFromShareTimeline: true,

    /** 文章点击此次数将上传数据库 */ 
    updateCloudThreshold: 5,

    /** 前一天推荐参数修正 */ 
    dailyMultiplier: 0.75,

    /** 文章推荐的权重 */
    recommendWeights: {
      frequencyScore: 3.0,
      readAmount: 2.0,
      dislike: -2.0
    },

    /** infoGroup对应的文章作者 */
    articleAuthors: {
      '-1': '碳行家',
      '0' : '低碳个人',
      '1' : '低碳森林',
      '2' : '低碳强国'
    },

    /** 文章种类对应的tags */
    articleTags: {
      '低碳个人': ['新能源汽车', '避雷', '攻略', '健康', '省钱'],
      '低碳森林': ['动物', '海洋', '植物', '气候变化'],
      '低碳强国': ['碳排放权交易', '生态环境部', '长江黄河', '生态文明建设', '生态文明思想']
    },

    articles: [],
    articleRecommend: {
      frequencyScore: [],
      articleCount: [],
      readAmount: [],
      recommendedArticles: [],
      infoGroup: -1
    }
  },

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 云数据处理 CLOUD HANDLING ///////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * 处理旧版本兼容
   */
  async handleOldVersion() {
    // 判断旧版本
    const localArticleRecommend = wx.getStorageSync('articleRecommend')
    if (localArticleRecommend == '' || localArticleRecommend.RECOMMENDATION_VERSION == this.data.RECOMMENDATION_VERSION) return;

    // 更新新版本 （Note: 这里应该根据版本改变发生变动）
    const totalInfoGroupNumber = Object.keys(this.data.articleAuthors).length - 1;
    const infoGroup = localArticleRecommend.infoGroup !== undefined ? 
      localArticleRecommend.infoGroup : Math.floor(Math.random() * totalInfoGroupNumber); // infoGroup 不改变, 没有则生成
    const author = this.data.articleAuthors[infoGroup]
    const articleRecommend = [
      // 点击频率数组 (25可以修改来改变点击频率的推荐占比)
      Array.from({ length: (Object.keys(this.data.articleTags[author]).length) },
        () => 25 / (Object.keys(this.data.articleTags[author]).length)), 

      // 文章数量存储数组
      Array.from({ length: (Object.keys(this.data.articleTags[author]).length) },
        () => 0),

      // 文章阅读量数组
      Array.from({ length: (Object.keys(this.data.articleTags[author]).length) },
        () => 0),
    ];

    wx.removeStorageSync('articleRecommend')
    wx.setStorageSync("articleRecommend", {
      frequencyScore: articleRecommend[0],
      articleCount: articleRecommend[1],
      readAmount: articleRecommend[2],
      recommendedArticles: [],
      infoGroup: infoGroup,
      lastClickDate: new Date(),

      RECOMMENDATION_VERSION: this.data.RECOMMENDATION_VERSION
    })

    // 移除本地文章库存
    // TODO: 等到新文章放进数据库articles之后，可以移除
    wx.removeStorageSync('articles')

    await this.updateCloudStorage(this.data.RECOMMENDATION_VERSION);
    console.log('处理旧版本成功！')
  },

  /**
   * 获取云端文章
   */
  async fetchCloudArticles(){
    const db = wx.cloud.database();

    // 获取文章数据
    try {
      const queryLimit = 20; // 微信单次获取上限为20
      let articles = (await db.collection('articles').where({author: this.data.articleAuthors[-1]}).get()).data;
      let iterations = 0

      if (onCheckSignIn()) {
        while (true) {
          let author = this.data.articleAuthors[this.data.articleRecommend.infoGroup]
          let fetchedArticles = await db.collection('articles').where({author: author}).skip(iterations * queryLimit).limit(queryLimit).get();
  
          articles = articles.concat(fetchedArticles.data);
          iterations++;
  
          if (fetchedArticles.data.length < queryLimit) {
            break;
          }
        }
      }

      wx.setStorageSync("articles", articles)  
      console.log(`成功从云端获取${articles.length}篇文章`)
    } catch (error) {
      console.error("获取文章时出错：", error);
    }
  },

  /**
   * 获取云端数据
   */
  async fetchCloudData(){
    const db = wx.cloud.database();

    // 未注册用户没有articleRecommend
    if (!onCheckSignIn()) {
      return;
    }

    // 处理articleRecommend数据丢失情况 
    if (wx.getStorageSync("articleRecommend") === ""){
      try {
        let articleRecommendData = (await db.collection('articleRecommend')
        .where({ _openid: this.data.openID })
        .get()).data;

        // 本地和云端都丢失则初始化云端数据库
        if (articleRecommendData.length === 0) {
          const totalInfoGroupNumber = Object.keys(this.data.articleAuthors).length - 1;
          const infoGroup = Math.floor(Math.random() * totalInfoGroupNumber);
          const author = this.data.articleAuthors[infoGroup]
          const articleRecommend = [
            // 点击频率数组 (25可以修改来改变点击频率的推荐占比)
            Array.from({ length: (Object.keys(this.data.articleTags[author]).length) },
              () => 25 / (Object.keys(this.data.articleTags[author]).length)), 

            // 文章数量存储数组
            Array.from({ length: (Object.keys(this.data.articleTags[author]).length) },
              () => 0),

            // 文章阅读量数组
            Array.from({ length: (Object.keys(this.data.articleTags[author]).length) },
              () => 0),
          ];

          await db.collection('articleRecommend').add({
            data:{
              frequencyScore: articleRecommend[0],
              articleCount: articleRecommend[1],
              readAmount: articleRecommend[2],
              recommendedArticles: [],
              infoGroup: infoGroup,

              RECOMMENDATION_VERSION: this.data.RECOMMENDATION_VERSION
            }
          });
          
          wx.setStorageSync("articleRecommend", {
            frequencyScore: articleRecommend[0],
            articleCount: articleRecommend[1],
            readAmount: articleRecommend[2],
            recommendedArticles: [],
            infoGroup: infoGroup,
            lastClickDate: new Date(),

            RECOMMENDATION_VERSION: this.data.RECOMMENDATION_VERSION
          })

        // 仅更新本地数据情况
        } else {
          const articleRecommend = {
            frequencyScore: articleRecommendData[0].frequencyScore,
            articleCount: articleRecommendData[0].articleCount,
            readAmount: articleRecommendData[0].readAmount,
            recommendedArticles: articleRecommendData[0].recommendedArticles,
            infoGroup: articleRecommendData[0].infoGroup,

            RECOMMENDATION_VERSION: articleRecommendData[0].RECOMMENDATION_VERSION
          }
          wx.setStorageSync("articleRecommend", {
            frequencyScore: articleRecommend.frequencyScore,
            articleCount: articleRecommend.articleCount,
            readAmount: articleRecommend.readAmount,
            recommendedArticles: articleRecommend.recommendedArticles,
            infoGroup: articleRecommend.infoGroup,
            lastClickDate: new Date(),

            RECOMMENDATION_VERSION: articleRecommend.RECOMMENDATION_VERSION
          })
        }
      } catch (error) {
        console.error("获取用户articleRecommend出错：", error);
      }
    }
  },

  /**
   * 更新云端articleRecommend
   * @param UPDATED_RECOMMENDATION_VERSION 更新的推荐系统版本号（不填则不更新版本号）
   */
  async updateCloudStorage(UPDATED_RECOMMENDATION_VERSION = null){
    const localArticleRecommend = wx.getStorageSync("articleRecommend");

    // 本地无存储则返回
    if (localArticleRecommend === "") {
      console.log("本地存储为空");
      return;
    }

    // 更新数据库
    try {
      const db = wx.cloud.database();
      const articleRecommendData = (await db.collection('articleRecommend')
        .where({ _openid: this.data.openID })
        .get()).data;

      // 更新新数据和去除旧数据
      const updatedData = {
        frequencyScore: localArticleRecommend.frequencyScore,
        articleCount: localArticleRecommend.articleCount,
        readAmount: localArticleRecommend.readAmount,
        recommendedArticles: localArticleRecommend.recommendedArticles,
        infoGroup: localArticleRecommend.infoGroup
      };

      // 添加推荐系统版本号
      if (UPDATED_RECOMMENDATION_VERSION != null) updatedData['RECOMMENDATION_VERSION'] = UPDATED_RECOMMENDATION_VERSION

      // 写入数据库
      if (articleRecommendData.length === 0) {
        await db.collection('articleRecommend').add({
          data: updatedData
        });
      } else {
        const removedData = Object.keys(articleRecommendData[0]).reduce((acc, field) => 
          (field !== '_openid' && field !== '_id' && field !== 'RECOMMENDATION_VERSION' && !(field in updatedData)) ? { ...acc, [field]: 'OUTDATED' } : acc, {});

        await db.collection('articleRecommend').doc(articleRecommendData[0]._id).update({
          data: {
            ...updatedData,
            ...removedData
          }
        });
      }
    } catch(err) {
      // 更新失败
      console.log(err)
    }
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 本地数据处理 LOCAL DATA HANDLING ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * 更新本地 articleShowList 使其高亮未读文章，并排序：未读文章在前、按照时间排序（降序）
   */
  updateLocalUnread() {
    // 更新文章isUnread
    let readArticles = [];
    let unreadArticles = [];

    // 遍历原始文章列表，根据 isUnread 属性分类存放到相应数组中
    const readIDs = this.data.articleRecommend.recommendedArticles.filter(art => !art.isUnread).map(article => article._id);
    this.data.articleShowList.forEach(article => {
      const isUnread = !readIDs.includes(article._id);
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
    const dislikeIDs = this.data.articleRecommend.recommendedArticles
      .filter(article => article.doDislike)
      .map(article => article._id);

    const updatedList = this.data.articleShowList.map(article => {
      const doDislike = dislikeIDs.includes(article._id);
      return { ...article, doDislike }
    });

    this.setData({
      articleShowList: updatedList
    });
  },

  /**
   * 更新本地 articleShowList 使其的TagShow对应到当前UI选择的Tag
   */
  updateLocalTagShow() {
    const updatedList = this.data.articleShowList.map(article => {
      article.isTagShow = article.tags?.includes(this.data.UISelectedTag) || this.data.UISelectedTag == '全部';
      return article;
    });

    this.setData({
      articleShowList: updatedList
    })
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 文章推荐分配 RECOMMENDATION ///////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * 根据articleRecommend的数值，合理推荐文章
   * @returns {object} 单次推荐的文章
   */ 
  getArticle() {
    const author = this.data.articleAuthors[this.data.articleRecommend.infoGroup];
    const totalTags = this.data.articleTags[author];

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
    const dislikeCount = new Array(Object.keys(totalTags).length).fill(0);
    this.data.articleRecommend.recommendedArticles.forEach(recommendedArt => {
      const id = recommendedArt._id;
      const articleObj = this.data.articles.find(article => article._id === id);
      if (articleObj) {
        if (recommendedArt.doDislike) {
          for (let tag of articleObj.tags) {
            let i = totalTags.indexOf(tag);
            if (i) dislikeCount[i] += 1;
          }
        }
      }
    });
    const minValue = Math.min(...dislikeCount);
    const minorDislikeCount = dislikeCount.map(count => count - minValue); 

    // 按照权重分配占比
    const weightedAverage = nFrequencyScore.map((fs, index) => { 
      return Math.max(0.01, this.data.recommendWeights.frequencyScore * fs + 
              this.data.recommendWeights.readAmount * nReadAmount[index] + 
              this.data.recommendWeights.dislike * minorDislikeCount[index]);
    });

    // 获取概率分布
    const totalWeightedSum = weightedAverage.reduce((sum, value) => sum + value, 0); 
    const probabilities = weightedAverage.map(value => value / totalWeightedSum);

    console.log(`文章推荐指数分别为：\n\t'总标签'：[${totalTags}]\n\t'点击频率（归一化）'：[${nFrequencyScore}]\n\t'文章阅读量（归一化）'：[${nReadAmount}]\n\t'不喜欢计数（最小差值）'：[${minorDislikeCount}]\n\t'总概率分布（归一化）'：[${probabilities}]`)

    // 返回文章 （每个文章至多2个tags, 按照tags的分数加权总分进行概率分布)
    const recommendedArticles = new Set(this.data.articleRecommend.recommendedArticles.map(article => article._id));
    const unrecommendedArticles = this.data.articles.filter(article => 
      article.author === author && !recommendedArticles.has(article._id)
    );
    if (unrecommendedArticles.length === 0) {
      return null;
    }

    const scores = unrecommendedArticles.map(article => 
      article.tags.reduce((acc, tag) => {
        let index = totalTags.indexOf(tag);
        return index !== -1 ? acc + probabilities[index] : acc;
      }, 0) * (article.tags.length === 1 ? 2 : 1) // 如果只有一个tag，则双倍分数
    );
    
    const normalizedScores = scores.map(score => score / scores.reduce((acc, score) => acc + score, 0))
    const cumulativeProbabilities = normalizedScores.reduce((acc, score) => {
      const cumulative = (acc.length ? acc[acc.length - 1] : 0) + score;
      acc.push(cumulative);
      return acc;
    }, []);

    const random = Math.random()
    const pickedArticle = unrecommendedArticles[cumulativeProbabilities.findIndex(prob => random < prob)];

    // 上传用户此次推荐的 features 到云端
    const db = wx.cloud.database()
    try {
      db.collection('recommendFeatures').add({
        data:{
          infoGroup: author,
          totalTags: totalTags,
          rawFeatures : {
            clickFrequency: frequencyScore,
            readDuration: readAmount,
            dislikeCount: dislikeCount,
          },
          engineeredFeatures: {
            frequencyDistribution_normalized: nFrequencyScore,
            readDistribution_normalized: nReadAmount,
            dislikeCount_minorDifference: minorDislikeCount,
          },
          probabilityDistribution: probabilities,
          recommendedArticle: pickedArticle.title,
          recommendedTags: pickedArticle.tags,
          time : new Date()
        }
      })
    } catch(err) {
      console.log("无法上传用户的推荐Features", err)
    }

    // 返回生成的文章
    return pickedArticle;
  },

  /**
   * 给用户生成新文章，并添加在articleShowList中
   * @param {number} newArticleCount 增添的文章数量
   */
  getArticles(newArticleCount = 0){
    const localArticleRecommend = wx.getStorageSync('articleRecommend');

    try{
      // 获取新文章
      const author = this.data.articleAuthors[this.data.articleRecommend.infoGroup]
      const totalTags = this.data.articleTags[author]

      for (let i = 0; i < newArticleCount; i++) {
        let article = this.getArticle();
        if (article != null) {
          for (let tag of article.tags) {
            let index = totalTags.indexOf(tag);
            this.data.articleRecommend.articleCount[index]++;
          }

          this.data.articleRecommend.recommendedArticles.push({
            isUnread: true,
            _id: article._id
          })

          console.log(`生成'${article.author}'文章: [${article.title}]`);
        } else {
          console.log("已达文章上限");
        }
      }

      // 添加碳行家'碳行家'文章到 articleShowList
      const defaultArticles = this.data.articles.filter(art => art.author === this.data.articleAuthors[-1])
      defaultArticles.forEach(art => {
        if (!this.data.articleRecommend.recommendedArticles.some(article => article._id === art._id)) {
          this.data.articleRecommend.recommendedArticles.push({
            _id: art._id,
            isUnread: true
          });
        }
      });

      // 更新本地 articleRecommend
      if (localArticleRecommend !== ""){
        localArticleRecommend.recommendedArticles = this.data.articleRecommend.recommendedArticles;
        localArticleRecommend.articleCount = this.data.articleRecommend.articleCount;
        wx.setStorageSync('articleRecommend', localArticleRecommend)
      }
    
      // 生成对应的文章给用户
      const articleList = []
      const recommendedIDs = this.data.articleRecommend.recommendedArticles.map(article => article._id);
      const recommendedArticles = this.data.articles.filter(article => recommendedIDs.includes(article._id));
      articleList.push(...recommendedArticles);

      this.setData({
        articleShowList: articleList
      })

      // 更新文章Unread状态，并排序：未读文章在前、按照时间排序
      this.updateLocalUnread();

      // 更新用户是否 dislike
      this.updateLocalDislike();

      // 更新用户的 isTagShow 来判断当前UI是否应该显示该文章
      this.updateLocalTagShow();

    } catch(err) {
     console.log("分配文章失败: ", err)
    }
  },

  /**
   * 根据天数获取文章（检查时间：每日凌晨4点）
   * 每次检查后，将会更新检查时间为明日
   * @returns {boolean} 是否需要更新
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
      
      return dayDiff > 0;
    }
  },

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 界面交互 UI EVENT HANDLING ///////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * UI 界面 Tag 切换
   */
  selectUITag(e){
    this.setData({
      UISelectedTag: e.currentTarget.dataset.tag
    })

    this.updateLocalTagShow();
  },

  /**
   * 文章按钮事件
   */
  bindInfo(e){
    logEvent('Read Article')

    const articleID = e.currentTarget.dataset.id;
    const mode = e.currentTarget.dataset.mode;
    const tag = e.currentTarget.dataset.tag;

    const targetArticle = this.data.articles.find(article => article._id === articleID);
    const totalShownArticle = mode === "HORIZONTAL"
    ? this.data.articleShowList.filter(item => item.author === this.data.articleAuthors[-1] || item.isUnread)
    : this.data.articleShowList.filter(item => item.tags && item.tags.includes(tag))

    const title = encodeURIComponent('【' + targetArticle.title + '】')
    const uploadTime = new Date(targetArticle.uploadTime).toISOString().split('T')[0];
    const author = targetArticle.author
    const imgs = targetArticle.imgs.map(img => {
      return encodeURIComponent(img);
    });
    const texts = targetArticle.texts.map(text => {
      return encodeURIComponent(text);
    });
    const geolocation = targetArticle.geolocation
    const tags = author === this.data.articleAuthors[-1] ? null : targetArticle.tags
    const totalTags = author === this.data.articleAuthors[-1] ? null : this.data.articleTags[this.data.articleAuthors[this.data.articleRecommend.infoGroup]]
    const scrollAmount = tag === undefined 
    ? `<${mode}: ${totalShownArticle.findIndex(item => item._id === articleID) + 1}TH> in <TOTAL: ${totalShownArticle.length}>`
    : `<${mode}: ${totalShownArticle.findIndex(item => item._id === articleID) + 1}TH> in <TOTAL: ${totalShownArticle.length}> with <TAG: ${tag}>`

    // 导航到对应链接
    wx.navigateTo({
      url:`/pages/detail/detail?title=${title}&uploadTime=${uploadTime}&tags=${JSON.stringify(tags)}&geolocation=${geolocation}&totalTags=${JSON.stringify(totalTags)}&scrollAmount=${scrollAmount}&texts=${JSON.stringify(texts)}&imgs=${JSON.stringify(imgs)}`,
      success: () => {
        // 未注册用户直接返回
        if (!onCheckSignIn()) {
          return;
        }

        // 更新本地 recommendedArticles 的已读文章
        let localArticleRecommend = wx.getStorageSync('articleRecommend');
        this.data.articleRecommend.recommendedArticles.find(article => article._id == articleID).isUnread = false;
        if (localArticleRecommend !== ""){
          localArticleRecommend.recommendedArticles = this.data.articleRecommend.recommendedArticles;
        }

        // 更新本地 frequencyScore
        if (author !== this.data.articleAuthors[-1]) {
          const totalTags = this.data.articleTags[this.data.articleAuthors[this.data.articleRecommend.infoGroup]];
          const delta = 25 / (Object.keys(totalTags).length);
          const tagIndices = new Set(tags.map(tag => totalTags.indexOf(tag)));
          this.data.articleRecommend.frequencyScore = this.data.articleRecommend.frequencyScore.map((value, index) => 
            tagIndices.has(index) 
              ? Math.min(value + delta, 100) 
              : Math.max(value - delta, delta)
          );
        }
        if (localArticleRecommend !== ""){
          localArticleRecommend.frequencyScore = this.data.articleRecommend.frequencyScore;
        }

        // 检查和更新本地存储 articleClickCounter ，并允许更新数据库和新增2篇文章
        if (this.data.updateCounter + 1 >= this.data.updateCloudThreshold) {
          this.setData({
            updateCounter: 0,
            shouldUpdateCloud: true
          })
          this.getArticles(2)
        } else {
          this.setData({
            updateCounter: this.data.updateCounter + 1
          })
        }
        if (localArticleRecommend !== ""){
          localArticleRecommend.articleClickCounter = this.data.updateCounter;
        }
        wx.setStorageSync('articleRecommend', localArticleRecommend)

        // 更新不喜欢文章，未读文章高亮，和TagShow的文章
        this.updateLocalDislike();
        this.updateLocalUnread();
        this.updateLocalTagShow();
      }
    })
  },

  /**
   * 不喜欢按钮事件
   */
  bindDislike(e) {
    // 切换不喜欢状态
    const targetArticle = this.data.articleRecommend.recommendedArticles.find(article => article._id === e.currentTarget.dataset._id && !article.isUnread);
    targetArticle.doDislike = !targetArticle.doDislike;
    if (targetArticle.doDislike) {
      wx.showModal({
        title: '感谢您的反馈',
        content:`为您减少相关文章的推荐量`,
        showCancel: false
      })
    }
    this.updateLocalDislike()
    this.updateLocalTagShow()
    
    // 更新本地存储 articleRecommend 的已读文章列表 recommendedArticles
    let localArticleRecommend = wx.getStorageSync('articleRecommend');
    if (localArticleRecommend !== ""){
      localArticleRecommend.recommendedArticles = this.data.articleRecommend.recommendedArticles;
      wx.setStorageSync('articleRecommend', localArticleRecommend)
    }
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 功能函数 LOCAL FUNCTIONAL METHOD ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

        // 初始化 articleRecommend 数据
        let articleRecommend = wx.getStorageSync('articleRecommend');
        if (articleRecommend == '') {
          await this.fetchCloudData(false)
        }

        // 检查推荐系统版本
        await this.handleOldVersion()
        articleRecommend = wx.getStorageSync('articleRecommend');

        // 更新页面 articleRecommend 数据
        this.setData({
          articleRecommend: {
            frequencyScore: articleRecommend.frequencyScore,
            articleCount: articleRecommend.articleCount,
            readAmount: articleRecommend.readAmount,
            recommendedArticles: articleRecommend.recommendedArticles,
            infoGroup: articleRecommend.infoGroup
          },
        })

        // 获取文章 articles, （若此前先从游客模式进入再登录（只有碳行家文章），则更新本地文章）
        let localArticles = wx.getStorageSync('articles');
        if (localArticles == '' || localArticles.filter(article => article.author !== this.data.articleAuthors[-1]).length === 0) {
          await this.fetchCloudArticles();
          localArticles = wx.getStorageSync('articles');
        }

        // 更新页面 articles 数据和初始化 UISelectedTag 为'全部'
        this.setData({
          articles: localArticles,
          UITotalTags: ['全部'].concat(this.data.articleTags[this.data.articleAuthors[this.data.articleRecommend.infoGroup]]),
          UISelectedTag: '全部'
        })

        // 获取文章点击计数器
        const counterStored = articleRecommend.articleClickCounter
        if (counterStored !== undefined) {
          this.setData({
            updateCounter: counterStored
          })
        }

        // 根据测试组不同，背景颜色不同 (强国组: 红色，其他：青色)
        // if(this.data.articleRecommend.infoGroup === 2){
        //   setColorStyle('RED');
        // } else {
        //   setColorStyle('CYAN');
        // }

        // 检查天数是否更新（每日凌晨4点）
        if (this.CheckDailyUpdate()) {
          // 更新本地文章数据
          if (localArticles.filter(article => article.author !== this.data.articleAuthors[-1]).length !== 0) {
            await this.fetchCloudArticles();
            localArticles = wx.getStorageSync('articles');
            this.setData({
              articles: localArticles
            })
          }

          // 每日更新 2 篇文章
          this.getArticles(2);

          // 减少以往天数的推荐比重
          articleRecommend = wx.getStorageSync('articleRecommend');
          const frequencyScore = this.data.articleRecommend.frequencyScore;
          const minFrequencyScore = 25 / (Object.keys(this.data.articleTags[this.data.articleAuthors[this.data.articleRecommend.infoGroup]]).length)
          const previousFrequencyScore = frequencyScore.map(
            element => (element - minFrequencyScore) * this.data.dailyMultiplier + minFrequencyScore
          );

          const readAmount = this.data.articleRecommend.readAmount;
          const previousReadAmount = readAmount.map(
            element => element * this.data.dailyMultiplier
          )

          articleRecommend.frequencyScore = previousFrequencyScore;
          articleRecommend.readAmount = previousReadAmount;
          wx.setStorageSync('articleRecommend', articleRecommend);

        // 不在每日更新情况
        } else {
          // 若是新用户，则新增2篇文章
          articleRecommend = wx.getStorageSync('articleRecommend');
          if (articleRecommend.recommendedArticles.length <= this.data.articles.filter(art => 
            art.author === this.data.articleAuthors[-1]).length) {
              this.getArticles(2);
            } else {
              this.getArticles();
            }
        }

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

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 页面周期函数 PAGE BUILT-IN FUNCTIONS ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  onReady(){
    
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 转发朋友圈链接，导航到登录页面
    if (options.isFromShareTimeline) {
      wx.redirectTo({
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
    
    // 清除旧文章显示
    this.setData({
      articleShowList: []
    })

    // 游客登录初始化
    onCheckSignIn({
      failed : async () => {
        // 游客登陆仅有‘碳行家’文章
        await this.fetchCloudArticles();
        let localArticles = wx.getStorageSync('articles');
        this.setData({
          articles: localArticles
        })
        const articleShowList = this.data.articles.filter(article => article.author === this.data.articleAuthors[-1]);

        this.setData({
          articleShowList: this.timeConvert(articleShowList)
        })
      }
    })
  }, 

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getTabBar()
    if(typeof this.getTabBar === 'function' && this.getTabBar()){
      this.getTabBar().setData({
        selected:1
      })
    }
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
    if (this.data.shouldUpdateCloud) {
      this.setData({
        shouldUpdateCloud: false
      })
      this.updateCloudStorage();
    }
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
})