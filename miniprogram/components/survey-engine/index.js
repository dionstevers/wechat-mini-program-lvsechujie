// survey-engine component
// Props:
//   config: object — survey config from config/survey-entry.js or survey-exit.js
//   coinRate: number — yuan per coin (from REWARD_CONFIG)
//   coinsPerQuestion: object — { type: coins } from REWARD_CONFIG
//   condition: string — participant condition, used to skip treatmentOnly questions for control
//
// Events fired:
//   survey-complete — { responses, totalCoins, timestamps: { start, end } }

const { REWARD_CONFIG } = require('../../config/reward.js')
const app = getApp()

Component({
  properties: {
    config: {
      type: Object,
      value: null,
      observer(newConfig) {
        if (newConfig) this._initSurvey(newConfig)
      },
    },
    condition: {
      type: String,
      value: '',
    },
    coinRate: {
      type: Number,
      value: REWARD_CONFIG.coins_to_yuan_rate,
    },
    initialCoins: {
      type: Number,
      value: 0,
    },
  },

  data: {
    blocks: [],
    currentBlockIndex: 0,
    totalBlocks: 0,
    currentBlock: {},
    currentQuestions: [],
    isLastBlock: false,
    progressPct: 0,
    answers: {},        // field → scalar value (single_select, slider, dropdown, open_text)
    multiAnswers: {},   // field → { value: bool } for multi_select
    matrixAnswers: {},  // rowField → value
    dropdownIndices: {},// field → index in options array
    pickerDefaults: {}, // field → initial wheel index (used before user picks)
    coinValues: {},     // qid → coins awarded for that question
    totalCoins: 0,
    canAdvance: false,
    answeredThisBlock: {}, // qid → bool, tracks which questions in current block are answered
    surveyStartTimestamp: null,
  },

  methods: {
    _initSurvey(config) {
      // Filter blocks for control condition (skip treatmentOnly blocks)
      const isControl = this.data.condition === 'control'
      const blocks = config.blocks.filter(b => !(b.treatmentOnly && isControl))

      // Randomise manipulation check order if needed
      blocks.forEach(block => {
        if (block.randomiseOrder && block.questions) {
          block.questions = this._shuffle([...block.questions])
        }
        // Randomise matrix rows if needed
        block.questions && block.questions.forEach(q => {
          if (q.randomiseRows && q.rows) {
            q.rows = this._shuffle([...q.rows])
          }
        })
      })

      const totalBlocks = blocks.length

      // Pre-compute picker wheel start index for each dropdown. Does NOT pre-fill
      // answers — display text stays as placeholder until user commits a pick.
      const pickerDefaults = {}
      blocks.forEach(block => {
        block.questions && block.questions.forEach(q => {
          if (q.type === 'dropdown' && q.options) {
            if (q.defaultValue !== undefined) {
              const idx = q.options.indexOf(q.defaultValue)
              pickerDefaults[q.field] = idx >= 0 ? idx : 0
            } else {
              pickerDefaults[q.field] = 0
            }
          }
        })
      })

      // DEV_MODE: prefill answers with generic values so tester can click through
      const devMode = !!(app && app.globalData && app.globalData.devMode)
      const prefill = devMode ? this._buildDevPrefill(blocks) : null

      // Pre-compute coin badge value per question
      const coinValues = {}
      const coinMap = REWARD_CONFIG.coins_per_question
      blocks.forEach(block => {
        ;(block.questions || []).forEach(q => {
          if (q.type === 'intro') return
          coinValues[q.id] = coinMap[q.type] || coinMap.default || 5
        })
      })

      const startingCoins = (this.data.initialCoins || 0) + (prefill ? prefill.coins : 0)
      if (app && typeof app.setTotalCoins === 'function') app.setTotalCoins(startingCoins)

      this.setData({
        blocks,
        totalBlocks,
        currentBlockIndex: 0,
        surveyStartTimestamp: Date.now(),
        totalCoins: startingCoins,
        answers: prefill ? prefill.answers : {},
        multiAnswers: prefill ? prefill.multiAnswers : {},
        matrixAnswers: prefill ? prefill.matrixAnswers : {},
        dropdownIndices: prefill ? prefill.dropdownIndices : {},
        pickerDefaults,
        coinValues,
        answeredThisBlock: {},
      })
      this._loadBlock(0, blocks)
    },

    _buildDevPrefill(blocks) {
      const answers = {}
      const multiAnswers = {}
      const matrixAnswers = {}
      const dropdownIndices = {}
      const coinMap = REWARD_CONFIG.coins_per_question
      let coins = 0
      blocks.forEach(block => {
        ;(block.questions || []).forEach(q => {
          if (q.type === 'intro') return
          coins += coinMap[q.type] || coinMap.default || 5
          if (q.type === 'single_select' && q.options && q.options.length) {
            answers[q.field] = q.options[0].value
          } else if (q.type === 'multi_select' && q.options && q.options.length) {
            const first = q.options.find(o => !o.exclusive) || q.options[0]
            multiAnswers[q.field] = { [first.value]: true }
          } else if (q.type === 'slider') {
            answers[q.field] = Math.round((q.min + q.max) / 2)
          } else if (q.type === 'matrix' && q.rows && q.scaleValues) {
            const mid = q.scaleValues[Math.floor(q.scaleValues.length / 2)]
            q.rows.forEach(row => { matrixAnswers[row.field] = mid })
          } else if (q.type === 'dropdown' && q.options && q.options.length) {
            const idx = q.defaultValue !== undefined
              ? Math.max(0, q.options.indexOf(q.defaultValue))
              : 0
            const val = q.options[idx]
            dropdownIndices[q.field] = idx
            answers[q.field] = q.nullValue && val === q.nullValue ? null : val
          } else if (q.type === 'open_text') {
            answers[q.field] = '测试回答'
          }
        })
      })
      return { answers, multiAnswers, matrixAnswers, dropdownIndices, coins }
    },

    _loadBlock(index, blocks) {
      const block = (blocks || this.data.blocks)[index]
      const isLastBlock = index === (blocks || this.data.blocks).length - 1
      const progressPct = Math.round((index / (blocks || this.data.blocks).length) * 100)

      // Filter treatmentOnly questions within a block for control participants
      const isControl = this.data.condition === 'control'
      const currentQuestions = block.questions
        ? block.questions.filter(q => !(q.treatmentOnly && isControl))
        : []

      this.setData({
        currentBlock: block,
        currentQuestions,
        isLastBlock,
        progressPct,
        answeredThisBlock: {},
        canAdvance: false,
      })

      // Log start timestamp on first block
      if (index === 0) {
        const tsField = block.questions && block.questions[0] && block.questions[0].logsTimestamp
        if (tsField) {
          // Parent page will read surveyStartTimestamp from component
        }
      }

      this._checkCanAdvance()
    },

    _checkCanAdvance() {
      const { currentQuestions, answers, multiAnswers, matrixAnswers } = this.data
      let canAdvance = true

      currentQuestions.forEach(q => {
        if (!q.required) return
        if (q.type === 'intro') return

        if (q.type === 'single_select' || q.type === 'dropdown' || q.type === 'open_text' || q.type === 'slider') {
          if (answers[q.field] === undefined || answers[q.field] === null || answers[q.field] === '') {
            canAdvance = false
          }
        } else if (q.type === 'multi_select') {
          const selected = multiAnswers[q.field] || {}
          const hasSelection = Object.values(selected).some(Boolean)
          if (!hasSelection) canAdvance = false
        } else if (q.type === 'matrix') {
          const allRowsAnswered = q.rows.every(row => matrixAnswers[row.field] !== undefined)
          if (!allRowsAnswered) canAdvance = false
        }
      })

      this.setData({ canAdvance })
    },

    onSingleSelect(e) {
      const { field, qid } = e.currentTarget.dataset
      const value = parseInt(e.detail.value, 10) || e.detail.value
      const answers = { ...this.data.answers, [field]: value }
      const answeredThisBlock = { ...this.data.answeredThisBlock }

      if (!answeredThisBlock[qid]) {
        answeredThisBlock[qid] = true
        this._awardCoin('single_select')
      }

      this.setData({ answers, answeredThisBlock })
      this._checkCanAdvance()
    },

    onMultiSelect(e) {
      const { field, value, exclusive } = e.currentTarget.dataset
      const multiAnswers = { ...this.data.multiAnswers }
      if (!multiAnswers[field]) multiAnswers[field] = {}

      const currentlySelected = multiAnswers[field][value]

      if (exclusive) {
        // Selecting an exclusive option clears all others
        multiAnswers[field] = { [value]: !currentlySelected }
      } else {
        // Deselect any exclusive options when selecting a normal one
        const question = this.data.currentQuestions.find(q => q.field === field)
        if (question) {
          question.options.forEach(opt => {
            if (opt.exclusive) multiAnswers[field][opt.value] = false
          })
        }
        multiAnswers[field][value] = !currentlySelected
      }

      const answeredThisBlock = { ...this.data.answeredThisBlock }
      if (!answeredThisBlock[field]) {
        answeredThisBlock[field] = true
        this._awardCoin('multi_select')
      }

      this.setData({ multiAnswers, answeredThisBlock })
      this._checkCanAdvance()
    },

    onSliderChange(e) {
      const { field, qid } = e.currentTarget.dataset
      const value = e.detail.value
      const answers = { ...this.data.answers, [field]: value }
      const answeredThisBlock = { ...this.data.answeredThisBlock }

      if (!answeredThisBlock[qid]) {
        answeredThisBlock[qid] = true
        this._awardCoin('slider')
      }

      this.setData({ answers, answeredThisBlock })
      this._checkCanAdvance()
    },

    onMatrixSelect(e) {
      const { rowfield, value, qid } = e.currentTarget.dataset
      const matrixAnswers = { ...this.data.matrixAnswers, [rowfield]: value }

      // Award coin once per matrix question (not per row)
      const answeredThisBlock = { ...this.data.answeredThisBlock }
      if (!answeredThisBlock[qid]) {
        // Check if all rows in this matrix are now answered
        const question = this.data.currentQuestions.find(q => q.id === qid)
        if (question) {
          const updated = { ...matrixAnswers }
          const allDone = question.rows.every(row => updated[row.field] !== undefined)
          if (allDone) {
            answeredThisBlock[qid] = true
            this._awardCoin('matrix')
          }
        }
      }

      this.setData({ matrixAnswers, answeredThisBlock })
      this._checkCanAdvance()
    },

    onDropdownChange(e) {
      const { field, qid } = e.currentTarget.dataset
      const index = e.detail.value
      const question = this.data.currentQuestions.find(q => q.field === field)
      const rawValue = question ? question.options[index] : index

      // Store the display string; null for '拒绝回答' / nullValue options
      const isNull = question && question.nullValue && rawValue === question.nullValue
      const answers = { ...this.data.answers, [field]: isNull ? null : rawValue }
      const dropdownIndices = { ...this.data.dropdownIndices, [field]: index }

      const answeredThisBlock = { ...this.data.answeredThisBlock }
      if (!answeredThisBlock[qid]) {
        answeredThisBlock[qid] = true
        this._awardCoin('dropdown')
      }

      this.setData({ answers, dropdownIndices, answeredThisBlock })
      this._checkCanAdvance()
    },

    onTextInput(e) {
      const { field, qid } = e.currentTarget.dataset
      const value = e.detail.value
      const answers = { ...this.data.answers, [field]: value }
      const answeredThisBlock = { ...this.data.answeredThisBlock }

      if (!answeredThisBlock[qid] && value.trim().length > 0) {
        answeredThisBlock[qid] = true
        this._awardCoin('open_text')
      }

      this.setData({ answers, answeredThisBlock })
      this._checkCanAdvance()
    },

    _awardCoin(questionType) {
      const coinMap = REWARD_CONFIG.coins_per_question
      const coins = coinMap[questionType] || coinMap.default || 5
      const next = this.data.totalCoins + coins
      this.setData({ totalCoins: next })
      if (app && typeof app.setTotalCoins === 'function') app.setTotalCoins(next)
    },

    onNextBlock() {
      if (!this.data.canAdvance) return
      this._saveBlockToCloud()
      const next = this.data.currentBlockIndex + 1
      this.setData({ currentBlockIndex: next })
      this._loadBlock(next)
    },

    onPrevBlock() {
      const prev = this.data.currentBlockIndex - 1
      this.setData({ currentBlockIndex: prev })
      this._loadBlock(prev)
    },

    onSubmit() {
      if (!this.data.canAdvance) return
      this._saveBlockToCloud(true)
    },

    _saveBlockToCloud(isFinal = false) {
      // Collect responses for this block
      const { answers, multiAnswers, matrixAnswers, config } = this.data
      const responses = {}

      this.data.currentQuestions.forEach(q => {
        if (q.type === 'multi_select') {
          const selected = multiAnswers[q.field] || {}
          responses[q.field] = Object.entries(selected)
            .filter(([, v]) => v)
            .map(([k]) => parseInt(k, 10))
        } else if (q.type === 'matrix') {
          q.rows.forEach(row => {
            if (matrixAnswers[row.field] !== undefined) {
              responses[row.field] = matrixAnswers[row.field]
            }
          })
          // Also store row order for randomised matrices
          if (q.randomiseRows) {
            responses.emotion_battery_order = q.rows.map(r => r.id)
          }
        } else if (answers[q.field] !== undefined) {
          responses[q.field] = answers[q.field]
        }
        // Handle attention check
        if (q.attentionCheck && answers[q.field] !== undefined) {
          responses.attention_check_response = answers[q.field]
        }
        // Store manipulation check order
        if (this.data.currentBlock.randomiseOrder) {
          responses.manipulation_check_order = this.data.currentQuestions.map(q => q.id)
        }
      })

      const coinsEarned = isFinal ? this.data.totalCoins : 0

      const timestamps = isFinal
        ? { start: this.data.surveyStartTimestamp, end: Date.now() }
        : null

      wx.cloud.callFunction({
        name: 'saveSurveyResponse',
        data: {
          surveyType: config ? config.surveyId : 'entry',
          responses,
          coinsEarned,
          isFinal,
          timestamps,
        },
        success: () => {
          if (isFinal) {
            this.triggerEvent('survey-complete', {
              responses: { ...this.data.answers, ...this.data.matrixAnswers },
              totalCoins: this.data.totalCoins,
              timestamps,
            })
          }
        },
        fail: (err) => {
          console.error('saveSurveyResponse failed', err)
          wx.showToast({ title: '保存失败，请重试', icon: 'error' })
        },
      })
    },

    _shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    },
  },
})
