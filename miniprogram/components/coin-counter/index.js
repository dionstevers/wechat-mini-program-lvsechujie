// coin-counter component
// Props:
//   coins: integer — current coin total (updated by parent on each question answered)
//   rate: number  — yuan per coin (from REWARD_CONFIG.coins_to_yuan_rate)

Component({
  properties: {
    coins: {
      type: Number,
      value: 0,
      observer(newVal) {
        this._updateYuan(newVal)
      },
    },
    rate: {
      type: Number,
      value: 0.05,
    },
  },

  data: {
    yuan: '0.00',
  },

  lifetimes: {
    attached() {
      this._updateYuan(this.data.coins)
    },
  },

  methods: {
    _updateYuan(coins) {
      const yuan = (coins * this.data.rate).toFixed(2)
      this.setData({ yuan })
    },
  },
})
