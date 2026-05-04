// Reward system configuration.
// Edit the four constants below — coins_per_question is computed automatically
// from the survey configs so the per-type values always sum to SURVEY_BUDGET.

const TOTAL_REWARD_YUAN = 8        // total payout for the experiment
const COINS_PER_YUAN    = 88      // 88 coins = ¥1
const COINS_LANDING      = 88     // landing 继续 button
const COINS_CONSENT      = 50     // consent 同意 button
const COINS_REGISTRATION = 50     // registration 提交注册 button
const COINS_EXIT_ENTRY   = 88     // ¥1 for entering the exit survey (timer-fired)

// Relative effort weights — higher = more coins per question of that type.
// Only the ratios matter; absolute scale is normalised by SURVEY_BUDGET.
const TYPE_WEIGHTS = {
  intro:         0,
  single_select: 1.0,
  multi_select:  1.3,
  slider:        1.5,
  matrix:        2.5,
  dropdown:      1.0,
  open_text:     2.0,
  statement:     0,
  token_allocation: 2.0,
}

const TOTAL_COINS    = TOTAL_REWARD_YUAN * COINS_PER_YUAN

const { ENTRY_SURVEY } = require('./survey-entry.js')
const { EXIT_SURVEY }  = require('./survey-exit.js')

// Per-survey post-submit bonuses (e.g. the +50 deferred coin pulse after
// the entry-survey video). Subtracted from the question budget below so
// the running coin counter never exceeds TOTAL_COINS.
const ENTRY_LAST_BLOCK_COINS = (ENTRY_SURVEY && ENTRY_SURVEY.lastBlockCoins) || 0
const EXIT_LAST_BLOCK_COINS  = (EXIT_SURVEY  && EXIT_SURVEY.lastBlockCoins)  || 0

const SURVEY_BUDGET = TOTAL_COINS
  - COINS_LANDING
  - COINS_CONSENT
  - COINS_REGISTRATION
  - COINS_EXIT_ENTRY
  - ENTRY_LAST_BLOCK_COINS
  - EXIT_LAST_BLOCK_COINS

function _countTypes() {
  // Count every coin-earning question across both surveys, including
  // treatmentOnly + showIf-gated ones. Sizing the budget for the worst
  // case (treatment user who answers every conditional question) means
  // the client tally never exceeds TOTAL_COINS. Control users + users
  // who skip showIf branches end up earning slightly less; the
  // server-side cap then clamps everyone at TOTAL_COINS exactly.
  const counts = {}
  ;[ENTRY_SURVEY, EXIT_SURVEY].forEach(cfg => {
    if (!cfg || !cfg.blocks) return
    cfg.blocks.forEach(block => {
      ;(block.questions || []).forEach(q => {
        if (!q.type) return
        if (q.type === 'intro' || q.type === 'statement') return
        if (q.noCoin) return
        counts[q.type] = (counts[q.type] || 0) + 1
      })
    })
  })
  return counts
}

function _computeCoinsPerQuestion() {
  const counts = _countTypes()
  let totalWeight = 0
  Object.keys(counts).forEach(type => {
    totalWeight += counts[type] * (TYPE_WEIGHTS[type] || 1)
  })
  const result = { intro: 0 }
  if (totalWeight === 0) return result
  Object.keys(counts).forEach(type => {
    const w = TYPE_WEIGHTS[type] || 1
    // per-question coins for this type; counts × this = type's share of budget
    result[type] = Math.max(1, Math.round((w / totalWeight) * SURVEY_BUDGET))
  })
  return result
}

const REWARD_CONFIG = {
  coins_landing:      COINS_LANDING,
  coins_consent:      COINS_CONSENT,
  coins_registration: COINS_REGISTRATION,
  coins_exit_entry:   COINS_EXIT_ENTRY,
  coins_per_question: _computeCoinsPerQuestion(),
  coins_to_yuan_rate: 1 / COINS_PER_YUAN,
  total_coins: TOTAL_COINS,
  survey_budget: SURVEY_BUDGET,
}

module.exports = { REWARD_CONFIG }
