// Landing page text. Edit here to adjust copy without touching code.
// Each paragraph is an array of segments. { bold: true } renders highlighted.
const LANDING_CONFIG = {
  header: '很高兴你加入「低碳出街小助手」，一起开启我们的低碳生活之旅吧！',
  paragraphs: [
    [
      { text: '这个小程序是一项科学实验的一部分，只需' },
      { text: '约10分钟', bold: true },
      { text: '即可完成！' },
    ],
    [
      { text: '注册即可获得' },
      { text: '1元奖励', bold: true },
      { text: '，持续使用本应用，累计可赚' },
      { text: '8元', bold: true },
      { text: '！点击「继续」，注册并开始领取您的奖励吧！' },
    ],
  ],
  buttonText: '继续',
}

module.exports = { LANDING_CONFIG }
