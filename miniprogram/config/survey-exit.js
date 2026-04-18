// Exit survey configuration.
// Structure mirrors survey-entry.js — same survey engine renders both.
// Block 1 (video questions) is shown to treatment conditions only;
// the survey engine checks question.treatmentOnly and skips for control.

const LIKERT_4 = [
  { label: '非常不同意', value: 1 },
  { label: '不太同意',   value: 2 },
  { label: '比较同意',   value: 3 },
  { label: '非常同意',   value: 4 },
]

// Manipulation check items — order is randomised per participant at runtime
const MANIPULATION_CHECK_ITEMS = [
  {
    id: 'Q3.1',
    type: 'slider',
    text: '中国人这一身份对我个人生活的重要性是…',
    field: 'ni_importance',
    min: 0, max: 10,
    minLabel: '完全不重要',
    maxLabel: '我生活中最重要的事情',
    required: true,
  },
  {
    id: 'Q3.2',
    type: 'single_select',
    text: '我在谈论中国人时，更常说"我们"而不是"中国人"。',
    field: 'ni_we',
    options: LIKERT_4,
    required: true,
  },
  {
    id: 'Q3.3',
    type: 'single_select',
    text: '作为中国人对我的自我认同很重要。',
    field: 'ni_identity',
    options: LIKERT_4,
    required: true,
  },
  {
    id: 'Q3.4',
    type: 'single_select',
    text: '别人批评中国时我感觉他们也批评我自己。',
    field: 'ni_criticism',
    options: LIKERT_4,
    required: true,
  },
  {
    id: 'Q3.5',
    type: 'single_select',
    text: '我有时希望自己生在别的国家。',
    field: 'ni_other_country',
    options: LIKERT_4,
    required: true,
    reverseCoded: true,
  },
]

const EXIT_SURVEY = {
  surveyId: 'exit',
  blocks: [
    // ─── Block 0: Introduction ────────────────────────────────────────────
    {
      id: 'block_exit_0',
      questions: [
        {
          id: 'Q_exit_intro',
          type: 'intro',
          text: '再次感谢您参与我们的研究！我们还有最后几道问题想请您回答，完成后即可领取您的奖励。部分题目可能不太常见，请按照您认为最合适的方式作答即可。谢谢您的配合！',
          field: null,
          required: false,
          logsTimestamp: 'exit_survey_start_timestamp',
        },
      ],
    },

    // ─── Block 1: Video viewing confirmation (treatment only) ─────────────
    {
      id: 'block_exit_1',
      treatmentOnly: true,
      questions: [
        {
          id: 'Q2.2',
          type: 'single_select',
          text: '您是否在上一页观看过该视频？如果未向您展示视频，请填写"未展示视频"。',
          field: 'video_watched',
          treatmentOnly: true,
          options: [
            { label: '观看过',    value: 1 },
            { label: '未观看过',  value: 2 },
            { label: '未展示视频', value: 3 },
          ],
          required: true,
        },
        {
          id: 'Q2.3',
          type: 'open_text',
          text: '当您看到这个短视频时，您首先想到的是什么？您喜欢这个内容吗？为什么？',
          field: 'video_reaction_1',
          treatmentOnly: true,
          required: false,
        },
        {
          id: 'Q2.4',
          type: 'open_text',
          text: '在您看来，视频中的内容反映了真实情况吗？请说明理由。',
          field: 'video_reaction_2',
          treatmentOnly: true,
          required: false,
        },
      ],
    },

    // ─── Block 2: Manipulation check (order randomised at runtime) ────────
    {
      id: 'block_exit_2',
      randomiseOrder: true,
      introText: '在使用我们的小程序之后，我们想了解您对一些相关议题的看法。请问您在多大程度上同意下面的观点？',
      questions: MANIPULATION_CHECK_ITEMS,
    },

    // ─── Block 3: Emotions battery (order randomised at runtime) ──────────
    {
      id: 'block_exit_3',
      questions: [
        {
          id: 'Q5.1',
          type: 'matrix',
          text: '当您想到中国当前的环境状况时，您在多大程度上有以下这些情绪？',
          field: 'emotions',
          randomiseRows: true,
          scaleLabels: ['非常', '比较', '有点', '完全不'],
          scaleValues: [1, 2, 3, 4],
          rows: [
            { id: 'Q5.1a', label: '紧张（即不安）', field: 'emotion_anxious' },
            { id: 'Q5.1b', label: '骄傲',           field: 'emotion_proud' },
            { id: 'Q5.1c', label: '生气',           field: 'emotion_angry' },
            { id: 'Q5.1d', label: '充满希望',       field: 'emotion_hopeful' },
            { id: 'Q5.1e', label: '担忧',           field: 'emotion_worried' },
            { id: 'Q5.1f', label: '兴奋',           field: 'emotion_excited' },
          ],
          required: true,
        },
      ],
    },

    // ─── Block 4: Preference falsification ───────────────────────────────
    {
      id: 'block_exit_4',
      questions: [
        {
          id: 'Q7.1',
          type: 'single_select',
          text: '人们在填写问卷时有不同的方式。在您身边的人（如朋友、同学或同事）中，在填写像本次这样的调查时，为了让答案看起来更容易被他人接受，而不完全表达真实想法的情况有多常见？',
          field: 'preference_falsification',
          options: [
            { label: '完全不常见', value: 1 },
            { label: '有点不常见', value: 2 },
            { label: '比较常见',   value: 3 },
            { label: '非常常见',   value: 4 },
            { label: '拒绝回答',   value: 5 },
          ],
          required: true,
        },
      ],
    },
  ],
}

module.exports = { EXIT_SURVEY, MANIPULATION_CHECK_ITEMS }
