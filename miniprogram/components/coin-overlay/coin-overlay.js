const app = getApp()

Component({
  data: {
    coins: 0,
    yuan: '0.00',
  },
  lifetimes: {
    attached() {
      this._update(app && app.globalData ? (app.globalData.totalCoins || 0) : 0)
      if (app && typeof app.subscribeTotalCoins === 'function') {
        this._unsub = app.subscribeTotalCoins((v) => this._update(v))
      }
    },
    detached() {
      if (this._unsub) this._unsub()
    },
  },
  methods: {
    _update(coins) {
      this.setData({ coins, yuan: (coins * 0.05).toFixed(2) })
    },
  },
})
