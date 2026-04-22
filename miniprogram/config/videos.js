// Video asset configuration for treatment conditions.
// DEV_MODE uses local files under asset/treatments/. Production uses cloud:// URIs.

const app = getApp()
const DEV_MODE = !!(app && app.globalData && app.globalData.devMode)

const CLOUD_BASE = 'cloud://iluvcarb-0gzvs45g82b57f98.6c6c-iluvcarb-0gzvs45g82b57f98/treatments/'
const LOCAL_BASE = '/asset/treatments/'
const BASE = DEV_MODE ? LOCAL_BASE : CLOUD_BASE

const VIDEO_CONFIG = {
  US_better_than_China: {
    condition_id: 'US_better_than_China',
    video_file: BASE + 'US_better_than_China.mp4',
    duration_seconds: 8,
  },
  China_better_than_US: {
    condition_id: 'China_better_than_US',
    video_file: BASE + 'China_better_than_US.mp4',
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
