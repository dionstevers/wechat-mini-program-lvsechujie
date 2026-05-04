// Screen 2 — Registration
// Collects phone, wechat_id. Awards COINS_REGISTRATION on submit.

const { REWARD_CONFIG } = require('../../config/reward.js')
const { REGISTRATION_CONFIG } = require('../../config/registration.js')
const { parseSegments } = require('../../utils/parse-segments.js')
const { onHomeNudge } = require('../../utils/home-nudge.js')
const app = getApp()

Page({
  data: {
    form: { phone: '', wechat_id: '' },
    errors: {},
    submitting: false,
    btnCoins: REWARD_CONFIG.coins_registration || 0,
    cfg: REGISTRATION_CONFIG,
    headerSegs: parseSegments(REGISTRATION_CONFIG.header || ''),
  },

  onLoad() {
    if (wx.hideHomeButton) wx.hideHomeButton()
    if (app && app.globalData && app.globalData.devMode) {
      this.setData({
        form: { phone: '13800138000', wechat_id: 'dev_tester' },
      })
    }
  },

  onHomeNudge,

  onPhoneInput(e)  { this.setData({ 'form.phone': e.detail.value, 'errors.phone': '' }) },
  onWechatInput(e) { this.setData({ 'form.wechat_id': e.detail.value }) },

  onSubmit() {
    if (this._submitting) return
    if (!this._validate()) return

    this._submitting = true
    this.setData({ submitting: true })
    const { phone, wechat_id } = this.data.form

    wx.cloud.callFunction({
      name: 'saveRegistration',
      data: { phone, wechat_id },
      success: (res) => {
        const result = res.result
        if (result && result.success) {
          if (app && typeof app.addTotalCoins === 'function') {
            app.addTotalCoins(REWARD_CONFIG.coins_registration || 0)
          }
          wx.redirectTo({ url: '/pages/entry-survey/entry-survey' })
        } else {
          this._showError()
          this._submitting = false
        }
      },
      fail: () => {
        this._showError()
        this._submitting = false
      },
      complete: () => this.setData({ submitting: false }),
    })
  },

  _validate() {
    const { phone } = this.data.form
    const errors = {}
    if (!phone.trim()) errors.phone = REGISTRATION_CONFIG.errors.phoneMissing
    else if (!/^1\d{10}$/.test(phone.trim())) errors.phone = REGISTRATION_CONFIG.errors.phoneInvalid
    this.setData({ errors })
    return Object.keys(errors).length === 0
  },

  _showError() {
    wx.showModal({ title: '提交失败', content: '请检查网络连接后重试', showCancel: false })
  },
})
