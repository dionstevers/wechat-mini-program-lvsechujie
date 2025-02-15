const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;

/**
 * 获取文章列表
 * @param {string} author - 文章作者（必须匹配）
 * @param {array} tags - 文章标签，优先匹配
 * @param {array} subtags - 文章子标签，优先匹配
 * @param {string} region - 文章所属地区，优先匹配
 * @param {array} excludedIDs - 需要排除的文章ID列表
 */
exports.main = async (event, context) => {
  const { author, tags, subtags, region, excludedIDs } = event;

  // 确保参数正确
  if (!author) {
    return { success: false, error: 'author 参数不能为空' };
  }

  let query = db.collection('articles');

  // 必须匹配的条件
  let condition = {
    author: author, // 确保 author 匹配
    _id: _.nin(excludedIDs || []) // 排除指定的文章
  };

  try {
    // **第一步：获取所有符合 author 的文章**
    let res = await query.where(condition).get();
    let articles = res.data;

    // **第二步：计算文章的优先级**
    articles.forEach(article => {
      let weight = 0;

      // 1. 如果匹配 `tags`，加 3 分
      if (tags && tags.length > 0 && article.tags) {
        weight += article.tags.some(tag => tags.includes(tag)) ? 3 : 0;
      }

      // 2. 如果匹配 `subtags`，加 2 分
      if (subtags && subtags.length > 0 && article.subtags) {
        weight += article.subtags.some(subtag => subtags.includes(subtag)) ? 2 : 0;
      }

      // 3. 如果匹配 `region`，加 1 分
      if (region && article.region === region) {
        weight += 1;
      }

      // 4. 根据日期（越新越优先），加 `date` 权重（最新的 +N）
      if (article.date) {
        let now = new Date().getTime();
        let articleTime = new Date(article.date).getTime();
        let timeDiff = (now - articleTime) / (1000 * 60 * 60 * 24); // 计算天数差
        weight += Math.max(0, 10 - timeDiff / 30); // 近 30 天的文章最多 +10
      }

      article.weight = weight; // 添加权重字段
    });

    // **第三步：根据权重和日期排序**
    articles.sort((a, b) => b.weight - a.weight || new Date(b.date) - new Date(a.date));

    return {
      success: true,
      data: articles
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};
