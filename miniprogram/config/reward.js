// Reward system configuration
// All coin amounts and the yuan conversion rate are set here.
// Change these values without any code changes to adjust payout targets.

const REWARD_CONFIG = {
  // Coins awarded at registration (shown in one-time pop-up)
  coins_registration: 10,

  // Coins awarded per question answered in surveys
  coins_per_question: {
    intro: 0,         // intro screens award no coins
    single_select: 5,
    multi_select: 5,
    slider: 8,
    matrix: 10,       // per completed matrix row × number of rows
    dropdown: 5,
    open_text: 5,
  },

  // 1 coin = this many yuan
  // Example: 200 coins total × 0.05 = ¥10
  coins_to_yuan_rate: 0.05,
}

module.exports = { REWARD_CONFIG }
