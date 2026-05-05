// pages/index/index.ts
// Experiment entry point — routes participants to the correct step based on
// their existing record in experiment_participants collection.

const app = getApp()
const STEP_ROUTES: Record<string, string> = {
  registration:  '/pages/registration/registration',
  entry_survey:  '/pages/entry-survey/entry-survey',
  news_feed:     '/pages/news-feed/news-feed',
  exit_survey:   '/pages/exit-survey/exit-survey',
  debriefing:    '/pages/debriefing/debriefing',
  reward:        '/pages/reward/reward',
  complete:      '/pages/reward/reward',
}

Page({
  data: {
    openID: '',
  },

  async onLoad() {
    wx.showLoading({ title: '加载中...', mask: true })
    try {
      // 1. Get OpenID
      const loginRes = await wx.cloud.callFunction({ name: 'login' })
      const openID = (loginRes.result as any).data._openid
      app.globalData.openID = openID
      this.setData({ openID })

      // 2. Look up participant record
      const db = wx.cloud.database()
      const query = await db.collection('experiment_participants')
        .where({ _openid: openID })
        .get()

      wx.hideLoading()

      if (query.data.length === 0) {
        // New participant → start at consent
        wx.redirectTo({ url: '/pages/consent/consent' })
        return
      }

      const participant = query.data[0]
      app.globalData.participantData = participant

      // 3. Route to the correct step
      const step = participant.current_step || 'registration'
      const route = STEP_ROUTES[step] || '/pages/consent/consent'
      wx.redirectTo({ url: route })
    } catch (err) {
      wx.hideLoading()
      console.error('Index routing error', err)
      wx.showModal({
        title: '加载失败',
        content: '请检查网络连接后重试',
        showCancel: false,
      })
    }
  },

  onShow() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
})
