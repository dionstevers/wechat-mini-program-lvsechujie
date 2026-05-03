// Entry survey configuration.
// Each block is shown as a separate screen. Each question has a type,
// field name (for DB storage), text, options, and required flag.
// To change question text or add/remove questions, edit this file only —
// no code changes needed.

const PROVINCES = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省',
  '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区',
  '海南省', '重庆市', '四川省', '贵州省', '云南省',
  '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
  '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区', '台湾省', '拒绝回答',
]

const BIRTH_YEARS = []
for (let y = 1930; y <= 2010; y++) BIRTH_YEARS.push(String(y))
BIRTH_YEARS.push('拒绝回答')

const LIKERT_4 = [
  { label: '非常不同意', value: 1 },
  { label: '不太同意',   value: 2 },
  { label: '比较同意',   value: 3 },
  { label: '非常同意',   value: 4 },
]

const ENTRY_SURVEY = {
  surveyId: 'entry',
  header: '入门问卷 · 我们想简单了解您的基本情况，大约 **2-3 分钟**。部分题型可能不太熟悉，按您的理解作答即可。为确保结果准确，**请您如实填写**。',
  lastBlockCoins: 50,
  blocks: [
    // ─── Block 1: Demographics + Attention check ─────────────────────────
    {
      id: 'block_1',
      questions: [
        {
          id: 'Q1.2',
          type: 'dropdown',
          text: '我们先想了解一下您个人的情况。请问您是哪年出生的？',
          field: 'birth_year',
          logsTimestamp: 'entry_survey_start_timestamp',
          options: BIRTH_YEARS,
          required: true,
          nullValue: '拒绝回答',
          defaultValue: '2000',
        },
        {
          id: 'Q1.3',
          type: 'single_select',
          text: '您的性别是？',
          field: 'gender',
          options: [
            { label: '男性', value: 1 },
            { label: '女性', value: 2 },
            { label: '拒绝回答', value: 3 },
          ],
          required: true,
        },
        {
          id: 'Q1.4',
          type: 'single_select',
          text: '您的最高学历是什么？',
          field: 'education',
          options: [
            { label: '初中及以下', value: 1 },
            { label: '高中或中专', value: 2 },
            { label: '大专',       value: 3 },
            { label: '本科',       value: 4 },
            { label: '硕士',       value: 5 },
            { label: '博士',       value: 6 },
            { label: '拒绝回答',   value: 7 },
          ],
          required: true,
        },
        {
          id: 'Q1.5',
          type: 'single_select',
          text: '您目前是在校大学生吗？',
          field: 'is_student',
          options: [
            { label: '是',     value: 1 },
            { label: '否',     value: 2 },
            { label: '拒绝回答', value: 3 },
          ],
          required: true,
        },
        {
          id: 'Q3.6',
          type: 'single_select',
          text: '为了我们的研究，认真回答问卷非常重要！为了表明您在认真作答，请在下列问题中选择"非常同意"。',
          field: 'attention_check_response',
          options: [
            { label: '非常不同意', value: 1 },
            { label: '不太同意',   value: 2 },
            { label: '比较同意',   value: 3 },
            { label: '非常同意',   value: 4 },
            { label: '拒绝回答',   value: 5 },
          ],
          required: true,
          attentionCheck: true,
          correctValue: 4,
        },
        {
          id: 'Q6.2',
          type: 'dropdown',
          text: '最近一年您最常居住的地方是',
          field: 'province',
          options: PROVINCES,
          required: true,
          nullValue: '拒绝回答',
        },
        {
          id: 'Q6.3',
          type: 'single_select',
          text: '您的民族是什么？',
          field: 'ethnicity',
          options: [
            { label: '汉族',   value: 1 },
            { label: '其他',   value: 2 },
            { label: '不知道', value: 3 },
            { label: '拒绝回答', value: 4 },
          ],
          required: true,
        },
        {
          id: 'Q6.4',
          type: 'single_select',
          text: '您是否党员？',
          field: 'party_member',
          options: [
            { label: '是',       value: 1 },
            { label: '预备党员', value: 2 },
            { label: '否',       value: 3 },
            { label: '拒绝回答', value: 4 },
          ],
          required: true,
        },
        {
          id: 'Q6.5',
          type: 'multi_select',
          text: '您家庭拥有以下哪些物品？',
          field: 'household_assets',
          options: [
            { label: '摩托车、代步车、电动自行车等',   value: 1 },
            { label: '国产汽车',                         value: 2 },
            { label: '进口汽车',                         value: 3 },
            { label: '冰箱',                             value: 4 },
            { label: '平板电视',                         value: 5 },
            { label: '吸尘器',                           value: 7 },
            { label: '洗衣机',                           value: 8 },
            { label: '微波炉、烤箱等厨房电器',           value: 9 },
            { label: '平板电脑',                         value: 10 },
            { label: '摄像机或专业数码相机',             value: 11 },
            { label: '洗碗机',                           value: 12 },
            { label: '台式电脑/笔记本电脑',             value: 13 },
            { label: '智能手机',                         value: 14 },
            { label: '非智能手机',                       value: 15 },
            { label: '空调',                             value: 16 },
            { label: '以上都没有',                       value: 17, exclusive: true },
            { label: '拒绝回答',                         value: 18, exclusive: true },
          ],
          required: true,
        },
      ],
    },

    // ─── Block 2: Issue-Specific Beliefs ─────────────────────────────────
    {
      id: 'block_3',
      questions: [
        {
          id: 'Q4.0',
          type: 'statement',
          text: '现在，我们想了解您对中国环境状况的看法。请问您在多大程度上同意下面的观点？',
          field: null,
          required: false,
        },
        {
          id: 'Q4.1',
          type: 'single_select',
          text: '中国仍然存在许多环境问题。',
          field: 'env_problems',
          options: LIKERT_4,
          required: true,
        },
        {
          id: 'Q4.2',
          type: 'single_select',
          text: '中国的环境保护状况比大多数其他国家都要好。',
          field: 'env_better_than_others',
          options: LIKERT_4,
          required: true,
        },
        {
          id: 'Q8',
          type: 'token_allocation',
          text: '现在，我们想进一步了解一下你如何看待自己。\n假设这里有 6 个圆圈，每个圆圈代表"你是谁"的一个不同部分。你一共有 10 个代币。请将这些代币分配到各个圆圈中，以表示每个部分在你对自我认知中的重要程度。你可以把所有代币都放在一个圆圈里，也可以分散放在几个圆圈里，或者让某些圆圈保持空白。这里没有对错之分。框内数字代表代币数量。',
          field: 'identity_allocation',
          totalTokens: 10,
          randomiseCategories: true,
          required: true,
          categories: [
            { id: 'nationality', label: '作为中国人',                       field: 'identity_alloc_nationality' },
            { id: 'career',      label: '我的职业 / 事业',                  field: 'identity_alloc_career' },
            { id: 'gender',      label: '我的性别',                         field: 'identity_alloc_gender' },
            { id: 'family',      label: '我的家庭角色（例如：父母、子女、兄弟姐妹）', field: 'identity_alloc_family' },
            { id: 'religion',    label: '我的宗教或信仰',                   field: 'identity_alloc_religion' },
            { id: 'other',       label: '其他 / 就是我自己 / 没有特别看法', field: 'identity_alloc_other', pinBottom: true },
          ],
        },
      ],
    },

    // ─── Block 5: Video notice (treatment conditions only) ───────────────
    {
      id: 'block_5',
      treatmentOnly: true,
      questions: [
        {
          id: 'Q_video_notice',
          type: 'statement',
          text: '点击「提交」后，您将看到一段视频。请仔细观看。',
          field: null,
          required: false,
        },
      ],
    },
  ],
}

module.exports = { ENTRY_SURVEY }
