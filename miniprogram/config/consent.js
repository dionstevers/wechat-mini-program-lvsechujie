// Consent form text resources.
//
// Edit this file to change consent page copy. No code changes needed.
//
// Inline emphasis markers (optional):
//   **text**   → bold white
//   ==text==   → highlight gold
//
// Structure:
//   welcome.appName / welcome.welcomeText  — top banner
//   intro                                  — intro paragraphs (before title)
//   title                                  — main section title
//   sections[].heading / .paragraphs       — each labelled sub-section
//   buttons.agree / .disagree              — bottom button labels
//   disagreeModal.*                        — pop-up shown when user taps 不同意

const CONSENT_CONFIG = {
  welcome: {
    appName: '低碳出街小助手',
    welcomeText: '很高兴你加入，一起开启低碳出街之旅 🌿',
  },

  intro: [
    '请阅读以下信息，了解本小程序的内容和目的。阅读完毕后，您可以选择是否同意知情同意书，并注册使用该程序，从而参与一项科学实验。',
    '注册==即可获得1元==奖励，整个实验过程中您将==累计获得20元==奖励！**向下滑动**，注册并开始领取您的奖励吧！',
  ],

  title: '知情同意书',

  sections: [
    {
      heading: '研究介绍与目的',
      paragraphs: [
        '我们正在进行一项有关中国居民互联网使用行为及其环保参与的研究。本研究旨在探索新型传播技术如何影响信息获取，并激励环保行为。研究结果将用于教学、科研出版或学术会议展示。',
        '**研究项目名称：**共同记录碳足迹：数字工具与环保参与研究',
        '**项目负责人：**常澈博士，昆山杜克大学环境与城市研究助理教授。地址：中国江苏省苏州市昆山市杜克大道8号，邮编：215316。电子邮箱：charles.c.chang@dukekunshan.edu.cn。',
        '如果您对本研究中所享有的权利有任何疑问或担忧，您可以联系昆山杜克大学伦理审查委员会：dku_irb@dukekunshan.edu.cn。',
      ],
    },
    {
      heading: '研究过程',
      paragraphs: [
        '参与本研究需要您下载并使用微信小程序"低碳出街小助手"，用其记录您的出行方式（如骑行、打车、公共交通等）。请在小程序内启动记录功能，出行结束后关闭，并如实填写您的出行方式。为了确保研究结果的准确性，请您真实地报告出行情况。',
        '**注册小程序后，您将获得1元人民币奖励。完成实验后，还可通过抽奖获得第二次奖励，奖金最高为1000元，最低为5元。完成实验需要满足以下条件：完成三次出行记录，并填写一份简短问卷。**',
        '我们还将请求您授权我们通过小程序收集额外的数据，包括您的微信ID、程序内点击行为，以及实验结束时填写的问卷答复。',
        '问卷中可能包含一些您不熟悉的提问方式，请根据您认为最恰当的方式作答。我们将采用科学的方法分析您的数据。',
      ],
    },
    {
      heading: '保密与个人信息处理说明',
      paragraphs: [
        '我们高度重视您的个人信息保护，并采取技术与管理措施确保数据安全，防止信息泄露、篡改或非法访问。我们严格遵循《中华人民共和国个人信息保护法》等相关法律法规，仅在实现本研究目的所必要的最小范围内收集您的个人信息。',
        '您提供的所有信息将被严格保密，仅用于本研究目的，不会用于与研究无关的用途，也不会向任何未经授权的第三方披露。我们不会基于个人层面进行分析，所有研究结果将以统计汇总形式呈现，无法识别到具体个人。',
        '本研究可能收集的可识别信息（如您的微信ID）将仅用于数据匹配与跟踪用途，不会用于识别您的真实身份。我们将在数据收集结束后立即进行匿名化处理，并在项目完成后安全删除所有原始数据。',
        '所有研究数据将存储在符合安全要求的加密服务器上，仅授权研究团队成员可访问。如需短期保存关联身份信息（如联系方式），将与其他研究数据分开存储并加密。研究结束后，所有数据将按法定或伦理规定予以销毁。',
        '您对自己的个人信息享有知情权、决定权、访问权、更正权及删除权。如您有相关需求，请随时联系我们的研究团队。',
      ],
    },
    {
      heading: '自愿参与与退出权利',
      paragraphs: [
        '参与本研究完全出于自愿，未经您的同意，我们不会收集任何数据。研究大约持续一天，您可以在任何阶段选择退出，无需承担任何后果。您可以通过电子邮件或小程序内的消息中心联系我们退出。',
      ],
    },
    {
      heading: '问题咨询',
      paragraphs: [
        '如您对自身作为研究参与者的权利或研究审批有任何疑问，可联系项目主持人常澈博士，昆山杜克大学环境与城市研究系，电子邮箱：charles.c.chang@dukekunshan.edu.cn。',
      ],
    },
    {
      heading: '同意确认',
      paragraphs: [
        '我确认我已经阅读并理解了上述陈述中关于本研究的相关信息，并曾有机会提出疑问。如果我有其他问题，我知道我可以联系谁。',
        '我**同意 / 不同意**参加上述研究，并授权"低碳出街小助手"小程序在上述研究信息范围内使用所收集的数据。',
        '感谢您的配合。现在就让我们开始吧！',
      ],
    },
  ],

  buttons: {
    agree: '同意',
    disagree: '不同意',
  },

  disagreeModal: {
    title: '感谢您的时间',
    content: '您已选择不参与本研究。',
    confirmText: '退出',
  },
}

// --- Renderer helpers (do not edit below unless you know what you're doing) ---

function parseSegments(raw) {
  const segments = []
  const regex = /(\*\*([^*]+)\*\*)|(==([^=]+)==)/g
  let last = 0
  let m
  while ((m = regex.exec(raw)) !== null) {
    if (m.index > last) segments.push({ text: raw.slice(last, m.index), style: 'normal' })
    if (m[2] !== undefined) segments.push({ text: m[2], style: 'bold' })
    else segments.push({ text: m[4], style: 'highlight' })
    last = regex.lastIndex
  }
  if (last < raw.length) segments.push({ text: raw.slice(last), style: 'normal' })
  if (segments.length === 0) segments.push({ text: raw, style: 'normal' })
  return { segments }
}

function normalizeParagraphs(arr) {
  return arr.map(parseSegments)
}

const CONSENT_RENDER = {
  welcome: CONSENT_CONFIG.welcome,
  intro: normalizeParagraphs(CONSENT_CONFIG.intro),
  title: CONSENT_CONFIG.title,
  sections: CONSENT_CONFIG.sections.map(function (s) {
    return { heading: s.heading, paragraphs: normalizeParagraphs(s.paragraphs) }
  }),
  buttons: CONSENT_CONFIG.buttons,
  disagreeModal: CONSENT_CONFIG.disagreeModal,
}

module.exports = { CONSENT_CONFIG, CONSENT_RENDER }
