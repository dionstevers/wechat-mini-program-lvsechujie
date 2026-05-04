// Shared `nudge` event handler for the home-cap-btn component on mid-flow
// pages. Emits a route-specific hint on the page's welcome-banner instance
// (matched by class .welcome-banner-host) without leaving the page.

const ROUTE_HINTS = {
  consent:      '请先完成知情同意书后再返回主页。',
  registration: '请先完成注册后再返回主页。',
  entry_survey: '请先完成入门问卷后再返回主页。',
  exit_survey:  '请先完成结束问卷后再返回主页。',
  debriefing:   '请先阅读完研究说明后再返回主页。',
  reward:       '请先领取奖励后再返回主页。',
}

const DEFAULT_HINT = '请先完成本步骤后再返回主页。'

function onHomeNudge(e) {
  const route = (e && e.detail && e.detail.route) || ''
  const banner = this.selectComponent('.welcome-banner-host')
  if (!banner) return
  banner.showText(ROUTE_HINTS[route] || DEFAULT_HINT)
}

module.exports = { onHomeNudge, ROUTE_HINTS }
