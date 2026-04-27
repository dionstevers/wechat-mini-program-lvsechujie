// Screen 2 — Registration
// Collects name, phone, wechat_id; awards registration coins.

const { REWARD_CONFIG } = require('../../config/reward.js')

const app = getApp()

Page({
  data: {
    form: { name: '', phone: '', wechat_id: '' },
    errors: {},
    submitting: false,
    rewardModal: { show: false, coins: 0, yuan: '0.00' },
  },

  onLoad() {
    if (app && app.globalData && app.globalData.devMode) {
      this.setData({
        form: { name: '测试用户', phone: '13800138000', wechat_id: 'dev_tester' },
      })
    }
  },

  onNameInput(e)   { this.setData({ 'form.name': e.detail.value, 'errors.name': '' }) },
  onPhoneInput(e)  { this.setData({ 'form.phone': e.detail.value, 'errors.phone': '' }) },
  onWechatInput(e) { this.setData({ 'form.wechat_id': e.detail.value }) },

  onSubmit() {
    if (this.data.submitting) return
    if (!this._validate()) return

    this.setData({ submitting: true })
    const { name, phone, wechat_id } = this.data.form

    wx.cloud.callFunction({
      name: 'saveRegistration',
      data: { name, phone, wechat_id },
      success: (res) => {
        const result = res.result
        if (result.success) {
          app.addTotalCoins(result.coins_registration || 0)
          const yuan = (result.coins_registration * REWARD_CONFIG.coins_to_yuan_rate).toFixed(2)
          this.setData({ rewardModal: { show: true, coins: result.coins_registration, yuan } })
        } else {
          this._showError()
        }
      },
      fail: () => this._showError(),
      complete: () => this.setData({ submitting: false }),
    })
  },

  _validate() {
    const { name, phone } = this.data.form
    const errors = {}
    if (!name.trim()) errors.name = '请填写姓名'
    if (!phone.trim()) errors.phone = '请填写手机号码'
    else if (!/^1\d{10}$/.test(phone.trim())) errors.phone = '请输入有效的手机号码'
    this.setData({ errors })
    return Object.keys(errors).length === 0
  },

  onRewardConfirm() {
    this.setData({ 'rewardModal.show': false })
    wx.redirectTo({ url: '/pages/entry-survey/entry-survey' })
  },

  _showError() {
    wx.showModal({ title: '提交失败', content: '请检查网络连接后重试', showCancel: false })
  },
})
