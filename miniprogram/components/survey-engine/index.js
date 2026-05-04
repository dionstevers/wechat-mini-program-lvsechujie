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
const { parseSegments } = require('../../utils/parse-segments.js')
const app = getApp()

Component({
  options: {
    addGlobalClass: true,
  },
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
    visibleQuestions: [],
    scrollTop: 0,
    scrollIntoView: '',    // id of card to scroll into view (e.g. 'q-Q4.1')
    isLastBlock: false,
    progressPct: 0,
    answers: {},        // field → scalar value (single_select, slider, dropdown, open_text)
    multiAnswers: {},   // field → { value: bool } for multi_select
    matrixAnswers: {},  // rowField → value
    allocAnswers: {},   // qid → { categoryField: count } for token_allocation
    allocTotals: {},    // qid → sum of counts across categories
    devMode: false,     // surfaces dev-only visual markers (e.g. randomised badges)
    dropdownIndices: {},// field → index in options array
    pickerDefaults: {}, // field → initial wheel index (used before user picks)
    coinValues: {},     // qid → coins awarded for that question
    totalCoins: 0,
    canAdvance: false,
    submitting: false,     // debounces 下一页 / 提交 against rapid double-taps
    awardedQids: {},       // qid (or field for multi_select) → true once a coin has been awarded for that question across the survey lifetime
    surveyStartTimestamp: null,
    totalQCount: 0,        // answerable questions across whole survey
    answeredQCount: 0,     // answered across whole survey
    completionPct: 0,
    surveyHeader: '',
    surveyHeaderSegs: [],
    surveyLastBlockCoins: 0,
  },

  methods: {
    _initSurvey(config) {
      // Filter blocks for control condition (skip treatmentOnly blocks)
      const isControl = this.data.condition === 'control'
      const blocks = config.blocks.filter(b => !(b.treatmentOnly && isControl))

      // Randomise manipulation check order if needed.
      // Statement questions stay in place — they're context cards, not items
      // to shuffle. Only the answerable questions between statements rotate.
      blocks.forEach(block => {
        if (block.randomiseOrder && block.questions) {
          const out = []
          let buffer = []
          const flush = () => {
            if (buffer.length) {
              // Tag each shuffled question with _randomised so dev mode can
              // render a 🔀 marker on its card.
              this._shuffle(buffer).forEach(q => out.push({ ...q, _randomised: true }))
              buffer = []
            }
          }
          block.questions.forEach(q => {
            if (q.type === 'statement' || q.type === 'intro') {
              flush()
              out.push(q)
            } else {
              buffer.push(q)
            }
          })
          flush()
          block.questions = out
        }
        // Randomise matrix rows if needed; tag each shuffled row so dev
        // mode can render a 🔀 marker.
        block.questions && block.questions.forEach(q => {
          if (q.randomiseRows && q.rows) {
            q.rows = this._shuffle([...q.rows]).map(r => ({ ...r, _randomised: true }))
          }
          // Randomise token-allocation categories. Categories with pinBottom
          // stay anchored at the end (e.g. "其他" must always be last).
          if (q.type === 'token_allocation' && q.randomiseCategories && q.categories) {
            const fixed = q.categories.filter(c => c.pinBottom)
            const movable = q.categories.filter(c => !c.pinBottom)
            q.categories = [...this._shuffle(movable), ...fixed]
          }
          // Shuffle multi_select options when randomiseOptions is set, but
          // keep exclusive items (NOTA / PNA) anchored at the end. Mark each
          // shuffled option with _randomised so dev mode can render a tag.
          if (q.type === 'multi_select' && q.randomiseOptions && q.options) {
            const exclusive = q.options.filter(o => o.exclusive)
            const movable = q.options.filter(o => !o.exclusive)
            const shuffled = this._shuffle(movable).map(o => ({ ...o, _randomised: true }))
            q.options = [...shuffled, ...exclusive]
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

      // DEV: only prefill answers when DEV_MODE_OPTION is 'prefilled'
      const prefillEnabled = !!(app && app.globalData && app.globalData.devPrefillSurveys)
      const prefill = prefillEnabled ? this._buildDevPrefill(blocks) : null

      // Pre-compute coin badge value per question + initial allocation maps
      const coinValues = {}
      const coinMap = REWARD_CONFIG.coins_per_question
      let totalQCount = 0
      const allocAnswers = {}
      const allocTotals = {}
      blocks.forEach(block => {
        ;(block.questions || []).forEach(q => {
          if (q.type === 'intro' || q.type === 'statement') return
          // noCoin questions render with no badge and award nothing — used
          // for gating tick-boxes (e.g. "我已理解" on entry block 5).
          coinValues[q.id] = q.noCoin ? 0 : (coinMap[q.type] || coinMap.default || 5)
          if (q.required) totalQCount++
          if (q.type === 'token_allocation' && q.categories) {
            allocAnswers[q.id] = {}
            q.categories.forEach(c => { allocAnswers[q.id][c.field] = 0 })
            allocTotals[q.id] = 0
          }
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
        allocAnswers: prefill ? prefill.allocAnswers : allocAnswers,
        allocTotals: prefill ? prefill.allocTotals : allocTotals,
        devMode: !!(app && app.globalData && app.globalData.devMode),
        dropdownIndices: prefill ? prefill.dropdownIndices : {},
        pickerDefaults,
        coinValues,
        awardedQids: prefill ? this._allQidsAwarded(blocks) : {},
        totalQCount,
        answeredQCount: prefill ? totalQCount : 0,
        completionPct: prefill ? 100 : 0,
        surveyHeader: config.header || '',
        surveyHeaderSegs: parseSegments(config.header || ''),
        surveyLastBlockCoins: config.lastBlockCoins || 0,
      })
      this._loadBlock(0, blocks)
    },

    _allQidsAwarded(blocks) {
      const map = {}
      blocks.forEach(block => {
        ;(block.questions || []).forEach(q => {
          if (q.type === 'intro' || q.type === 'statement') return
          // multi_select gates by field; other types gate by qid. Mark both
          // so re-touching a prefilled answer never double-awards.
          if (q.id) map[q.id] = true
          if (q.field) map[q.field] = true
        })
      })
      return map
    },

    _buildDevPrefill(blocks) {
      const answers = {}
      const multiAnswers = {}
      const matrixAnswers = {}
      const dropdownIndices = {}
      const allocAnswers = {}
      const allocTotals = {}
      const coinMap = REWARD_CONFIG.coins_per_question
      let coins = 0
      blocks.forEach(block => {
        ;(block.questions || []).forEach(q => {
          if (q.type === 'intro' || q.type === 'statement') return
          if (!q.noCoin) coins += coinMap[q.type] || coinMap.default || 5
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
          } else if (q.type === 'token_allocation' && q.categories && q.totalTokens) {
            // Distribute tokens evenly (remainder lands on first category).
            const map = {}
            const baseShare = Math.floor(q.totalTokens / q.categories.length)
            let remainder = q.totalTokens - baseShare * q.categories.length
            q.categories.forEach((c, i) => {
              map[c.field] = baseShare + (remainder > 0 ? 1 : 0)
              if (remainder > 0) remainder--
            })
            allocAnswers[q.id] = map
            allocTotals[q.id] = q.totalTokens
          }
        })
      })
      return { answers, multiAnswers, matrixAnswers, dropdownIndices, allocAnswers, allocTotals, coins }
    },

    _loadBlock(index, blocks) {
      const block = (blocks || this.data.blocks)[index]
      const isLastBlock = index === (blocks || this.data.blocks).length - 1
      const progressPct = Math.round((index / (blocks || this.data.blocks).length) * 100)

      // Filter treatmentOnly questions within a block for control participants
      const isControl = this.data.condition === 'control'
      const isDev = !!(this.data.devMode || (app && app.globalData && app.globalData.devMode))
      const currentQuestions = (block.questions
        ? block.questions.filter(q => !(q.treatmentOnly && isControl))
        : []
      ).map(q => {
        const baseSegs = parseSegments(q.text || '')
        const segs = (isDev && q._randomised)
          ? [{ text: '🔀 ', bold: false }, ...baseSegs]
          : baseSegs
        return {
          ...q,
          textSegs: segs,
          // Sanitised id for use in WXML id attributes / selectors. WeChat
          // CSS selectors treat '.' as a class separator, so a question id
          // like 'Q4.1' would not resolve via createSelectorQuery('#q-Q4.1').
          safeId: (q.id || '').replace(/\./g, '_'),
        }
      })

      this.setData({
        currentBlock: block,
        currentQuestions,
        visibleQuestions: currentQuestions.filter(q => this._isVisible(q)),
        isLastBlock,
        progressPct,
        // awardedQids is intentionally NOT reset here — it must persist across
        // blocks so toggling prev/next never re-awards coins for a question.
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

    // Evaluates a question's showIf rule against current answer state.
    // Format: showIf: { field: 'video_watched', equals: 1 }
    _isVisible(q) {
      if (!q || !q.showIf) return true
      const { field, equals } = q.showIf
      if (!field) return true
      const { answers } = this.data
      return answers[field] === equals
    },

    // Recomputes visibleQuestions from currentQuestions × current answers.
    _recomputeVisible() {
      const visibleQuestions = (this.data.currentQuestions || []).filter(q => this._isVisible(q))
      this.setData({ visibleQuestions })
    },

    _checkCanAdvance() {
      this._recomputeVisible()
      const { visibleQuestions, answers, multiAnswers, matrixAnswers, allocTotals } = this.data
      let canAdvance = true

      visibleQuestions.forEach(q => {
        if (!q.required) return
        if (q.type === 'intro' || q.type === 'statement') return

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
        } else if (q.type === 'token_allocation') {
          if ((allocTotals[q.id] || 0) !== (q.totalTokens || 0)) canAdvance = false
        }
      })

      this.setData({ canAdvance })
      this._updateCompletion()
    },

    _updateCompletion() {
      const { blocks, answers, multiAnswers, matrixAnswers, allocTotals } = this.data
      let totalQCount = 0
      let answeredQCount = 0
      blocks.forEach(block => {
        ;(block.questions || []).forEach(q => {
          if (!q.required) return
          if (q.type === 'intro' || q.type === 'statement') return
          if (!this._isVisible(q)) return
          totalQCount++
          if (q.type === 'single_select' || q.type === 'dropdown' || q.type === 'open_text' || q.type === 'slider') {
            if (answers[q.field] !== undefined && answers[q.field] !== null && answers[q.field] !== '') answeredQCount++
          } else if (q.type === 'multi_select') {
            if (Object.values(multiAnswers[q.field] || {}).some(Boolean)) answeredQCount++
          } else if (q.type === 'matrix') {
            if (q.rows && q.rows.every(row => matrixAnswers[row.field] !== undefined)) answeredQCount++
          } else if (q.type === 'token_allocation') {
            if ((allocTotals[q.id] || 0) === (q.totalTokens || 0)) answeredQCount++
          }
        })
      })
      const completionPct = totalQCount > 0 ? Math.round(answeredQCount / totalQCount * 100) : 0
      this.setData({ totalQCount, answeredQCount, completionPct })
    },

    onSingleSelect(e) {
      const { field, qid, value } = e.currentTarget.dataset
      const v = typeof value === 'number' ? value : (parseInt(value, 10) || value)
      const currentVal = this.data.answers[field]
      const answers = { ...this.data.answers }
      const awardedQids = { ...this.data.awardedQids }

      if (currentVal === v) {
        // Tapping the already-selected option deselects it.
        delete answers[field]
        if (awardedQids[qid]) {
          delete awardedQids[qid]
          this._deductCoin('single_select', qid)
        }
      } else {
        answers[field] = v
        if (!awardedQids[qid]) {
          awardedQids[qid] = true
          this._awardCoin('single_select', qid)
        }
      }

      this.setData({ answers, awardedQids })
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

      const hasAny = Object.values(multiAnswers[field] || {}).some(Boolean)
      const awardedQids = { ...this.data.awardedQids }
      if (hasAny && !awardedQids[field]) {
        awardedQids[field] = true
        this._awardCoin('multi_select')
      } else if (!hasAny && awardedQids[field]) {
        delete awardedQids[field]
        this._deductCoin('multi_select')
      }

      this.setData({ multiAnswers, awardedQids })
      this._checkCanAdvance()
    },

    onSliderChange(e) {
      const { field, qid } = e.currentTarget.dataset
      const value = e.detail.value
      const answers = { ...this.data.answers, [field]: value }
      const awardedQids = { ...this.data.awardedQids }

      if (!awardedQids[qid]) {
        awardedQids[qid] = true
        this._awardCoin('slider')
      }

      this.setData({ answers, awardedQids })
      this._checkCanAdvance()
    },

    onMatrixSelect(e) {
      const { rowfield, value, qid } = e.currentTarget.dataset
      const matrixAnswers = { ...this.data.matrixAnswers, [rowfield]: value }

      // Award coin once per matrix question (not per row)
      const awardedQids = { ...this.data.awardedQids }
      if (!awardedQids[qid]) {
        // Check if all rows in this matrix are now answered
        const question = this.data.currentQuestions.find(q => q.id === qid)
        if (question) {
          const updated = { ...matrixAnswers }
          const allDone = question.rows.every(row => updated[row.field] !== undefined)
          if (allDone) {
            awardedQids[qid] = true
            this._awardCoin('matrix')
          }
        }
      }

      this.setData({ matrixAnswers, awardedQids })
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

      const awardedQids = { ...this.data.awardedQids }
      if (!awardedQids[qid]) {
        awardedQids[qid] = true
        this._awardCoin('dropdown')
      }

      this.setData({ answers, dropdownIndices, awardedQids })
      this._checkCanAdvance()
    },

    onAllocPlus(e) {
      const { qid, cat } = e.currentTarget.dataset
      const q = this.data.currentQuestions.find(qq => qq.id === qid)
      if (!q) return
      const total = this.data.allocTotals[qid] || 0
      if (total >= (q.totalTokens || 0)) return
      const map = { ...(this.data.allocAnswers[qid] || {}) }
      map[cat] = (map[cat] || 0) + 1
      const allocAnswers = { ...this.data.allocAnswers, [qid]: map }
      const allocTotals = { ...this.data.allocTotals, [qid]: total + 1 }
      // First touch awards the type coin (mirrors single_select pattern).
      const awardedQids = { ...this.data.awardedQids }
      if (!awardedQids[qid]) {
        awardedQids[qid] = true
        this._awardCoin('token_allocation')
      }
      this.setData({ allocAnswers, allocTotals, awardedQids })
      this._checkCanAdvance()
    },

    onAllocMinus(e) {
      const { qid, cat } = e.currentTarget.dataset
      const map = { ...(this.data.allocAnswers[qid] || {}) }
      const current = map[cat] || 0
      if (current <= 0) return
      map[cat] = current - 1
      const allocAnswers = { ...this.data.allocAnswers, [qid]: map }
      const total = (this.data.allocTotals[qid] || 0) - 1
      const allocTotals = { ...this.data.allocTotals, [qid]: total < 0 ? 0 : total }
      this.setData({ allocAnswers, allocTotals })
      this._checkCanAdvance()
    },

    onTextInput(e) {
      const { field, qid } = e.currentTarget.dataset
      const value = e.detail.value
      const answers = { ...this.data.answers, [field]: value }
      const awardedQids = { ...this.data.awardedQids }

      if (!awardedQids[qid] && value.trim().length > 0) {
        awardedQids[qid] = true
        this._awardCoin('open_text')
      }

      this.setData({ answers, awardedQids })
      this._checkCanAdvance()
    },

    _awardCoin(questionType, qid) {
      // Per-question opt-out (noCoin flag): coinValues[qid] is set to 0 in
      // _initSurvey for those questions, so we treat them as zero-credit.
      if (qid && this.data.coinValues && this.data.coinValues[qid] === 0) return
      const coinMap = REWARD_CONFIG.coins_per_question
      const coins = coinMap[questionType] || coinMap.default || 5
      const next = this.data.totalCoins + coins
      this.setData({ totalCoins: next })
      if (app && typeof app.setTotalCoins === 'function') app.setTotalCoins(next)
    },

    _deductCoin(questionType, qid) {
      if (qid && this.data.coinValues && this.data.coinValues[qid] === 0) return
      const coinMap = REWARD_CONFIG.coins_per_question
      const coins = coinMap[questionType] || coinMap.default || 5
      const next = Math.max(0, (this.data.totalCoins || 0) - coins)
      this.setData({ totalCoins: next })
      if (app && typeof app.setTotalCoins === 'function') app.setTotalCoins(next)
    },

    onNextBlock() {
      if (this._navigating) return
      const empties = this._findEmpties()
      if (empties.length > 0) {
        this._warnEmpties(empties, () => this._proceedNext())
        return
      }
      this._proceedNext()
    },

    _proceedNext() {
      this._navigating = true
      this.setData({ submitting: true })
      this._saveBlockToCloud()
      const next = this.data.currentBlockIndex + 1
      this.setData({ currentBlockIndex: next })
      this._loadBlock(next)
      this._scrollToTop()
    },

    onPrevBlock() {
      if (this._navigating) return
      this._navigating = true
      const prev = this.data.currentBlockIndex - 1
      this.setData({ currentBlockIndex: prev })
      this._loadBlock(prev)
      this._scrollToTop()
      // Prev nav has no async work; clear lock immediately on next tick.
      setTimeout(() => { this._navigating = false }, 0)
    },

    // Returns the list of required visible questions in the current block
    // that have no answer yet. Used for the next/submit warning + scroll.
    _findEmpties() {
      const { visibleQuestions, answers, multiAnswers, matrixAnswers, allocTotals } = this.data
      return (visibleQuestions || []).filter(q => {
        if (!q.required) return false
        if (q.type === 'intro' || q.type === 'statement') return false
        if (q.type === 'single_select' || q.type === 'dropdown' || q.type === 'open_text' || q.type === 'slider') {
          const v = answers[q.field]
          return v === undefined || v === null || v === ''
        }
        if (q.type === 'multi_select') {
          return !Object.values(multiAnswers[q.field] || {}).some(Boolean)
        }
        if (q.type === 'matrix') {
          return q.rows && !q.rows.every(row => matrixAnswers[row.field] !== undefined)
        }
        if (q.type === 'token_allocation') {
          return (allocTotals[q.id] || 0) !== (q.totalTokens || 0)
        }
        return false
      })
    },

    // Modal: warn about unanswered questions. The first empty card is
    // scrolled to programmatically (via createSelectorQuery to compute the
    // exact scrollTop) *before* the modal opens, so the participant sees
    // the empty card behind the dialog. scroll-into-view is unreliable when
    // setData hasn't yet flushed, so we set scrollTop directly.
    _warnEmpties(empties, proceedFn) {
      const target = empties[0]
      const safeId = target && target.safeId
      const showModal = () => {
        wx.showModal({
          title: '还有问题未填',
          content: '本页有 ' + empties.length + ' 道题尚未作答，是否仍要继续？',
          confirmText: '继续',
          cancelText: '返回填写',
          success: (res) => {
            if (res.confirm) proceedFn()
          },
        })
      }
      if (!safeId) {
        showModal()
        return
      }
      const query = this.createSelectorQuery()
      query.select('#q-' + safeId).boundingClientRect()
      query.select('.questions-scroll').boundingClientRect()
      query.select('.questions-scroll').scrollOffset()
      query.exec((res) => {
        const cardRect = res[0]
        const containerRect = res[1]
        const offset = res[2]
        if (cardRect && containerRect && offset) {
          // pixel space: card.top - container.top is the card's offset from
          // the visible top of the scroll-view; add current scrollTop to
          // get its absolute scroll-y, minus a small breathing margin.
          const targetTop = Math.max(0, offset.scrollTop + cardRect.top - containerRect.top - 24)
          // Force change detection by toggling through an off-by-one value.
          this.setData({ scrollTop: targetTop + 1 }, () => {
            this.setData({ scrollTop: targetTop }, showModal)
          })
        } else {
          showModal()
        }
      })
    },

    _scrollToTop() {
      // scroll-view only re-scrolls when scrollTop *changes*. Toggle 1 → 0.
      this.setData({ scrollTop: 1 })
      setTimeout(() => this.setData({ scrollTop: 0 }), 0)
      // Page-level scroll fallback for any device where the body scrolled too.
      if (typeof wx !== 'undefined' && wx.pageScrollTo) {
        wx.pageScrollTo({ scrollTop: 0, duration: 0 })
      }
    },

    onSubmit() {
      if (this._navigating) return
      const empties = this._findEmpties()
      if (empties.length > 0) {
        this._warnEmpties(empties, () => this._proceedSubmit())
        return
      }
      this._proceedSubmit()
    },

    _proceedSubmit() {
      this._navigating = true
      this.setData({ submitting: true })
      this._saveBlockToCloud(true)
    },

    _saveBlockToCloud(isFinal = false) {
      // Collect responses for this block
      const { answers, multiAnswers, matrixAnswers, allocAnswers, config } = this.data
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
        } else if (q.type === 'token_allocation') {
          const map = allocAnswers[q.id] || {}
          q.categories.forEach(c => {
            responses[c.field] = map[c.field] || 0
          })
          if (q.randomiseCategories) {
            responses[(q.field || q.id) + '_order'] = q.categories.map(c => c.id)
          }
        } else if (answers[q.field] !== undefined) {
          responses[q.field] = answers[q.field]
        }
        // Handle attention check
        if (q.attentionCheck && answers[q.field] !== undefined) {
          responses.attention_check_response = answers[q.field]
        }
        // Store manipulation check order (exclude non-answerable statements)
        if (this.data.currentBlock.randomiseOrder) {
          responses.manipulation_check_order = this.data.currentQuestions
            .filter(qq => qq.type !== 'statement' && qq.type !== 'intro')
            .map(qq => qq.id)
        }
      })

      // Only the coins earned during THIS survey go to the server. The
      // initial seed (landing/consent/registration coins from previous steps)
      // is excluded so coins_entry_survey / coins_exit_survey reflect just
      // the survey's own contribution.
      const surveyOnlyCoins = Math.max(0, (this.data.totalCoins || 0) - (this.data.initialCoins || 0))
      const coinsEarned = isFinal ? surveyOnlyCoins : 0

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
        complete: () => {
          this._navigating = false
          this.setData({ submitting: false })
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
