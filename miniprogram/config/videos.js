// Video asset configuration for treatment conditions.
// DEV_MODE uses local files under asset/treatments/. Production uses cloud:// URIs.

const app = getApp()
const DEV_MODE = !!(app && app.globalData && app.globalData.devMode)

const CLOUD_BASE = 'cloud://cloudbase-d4ghbgqhq17d3a271.636c-cloudbase-d4ghbgqhq17d3a271-1367227578/treatments/'
// DEV: run `python3 -m http.server 8000` in miniprogram/asset/treatments/
// and enable "不校验合法域名..." in WeChat DevTools settings.
const LOCAL_BASE = 'http://127.0.0.1:8000/'
const BASE = DEV_MODE ? LOCAL_BASE : CLOUD_BASE

const VIDEO_CONFIG = {
  treatment_neg: {
    condition_id: 'treatment_neg',
    video_file: BASE + 'treatment_neg.mp4',
    duration_seconds: 8,
  },
  treatment_pos: {
    condition_id: 'treatment_pos',
    video_file: BASE + 'treatment_pos.mp4',
    duration_seconds: 8,
  },
  no_text: {
    condition_id: 'no_text',
    video_file: BASE + 'no_text.mp4',
    duration_seconds: 8,
  },
  control: {
    condition_id: 'control',
    video_file: null,
    duration_seconds: 0,
  },
}

module.exports = { VIDEO_CONFIG }
