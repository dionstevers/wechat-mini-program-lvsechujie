// Video asset configuration for treatment conditions.
// Update video_file paths when final assets are uploaded to cloud storage.

const VIDEO_CONFIG = {
  US_better_than_China: {
    condition_id: 'US_better_than_China',
    video_file: 'cloud://iluvcarb-0gzvs45g82b57f98.6c6c-iluvcarb-0gzvs45g82b57f98/treatments/US_better_than_China.mp4',
    duration_seconds: 8,
  },
  China_better_than_US: {
    condition_id: 'China_better_than_US',
    video_file: 'cloud://iluvcarb-0gzvs45g82b57f98.6c6c-iluvcarb-0gzvs45g82b57f98/treatments/China_better_than_US.mp4',
    duration_seconds: 8,
  },
  no_text: {
    condition_id: 'no_text',
    video_file: 'cloud://iluvcarb-0gzvs45g82b57f98.6c6c-iluvcarb-0gzvs45g82b57f98/treatments/no_text.mp4',
    duration_seconds: 8,
  },
  control: {
    condition_id: 'control',
    video_file: null,
    duration_seconds: 0,
  },
}

module.exports = { VIDEO_CONFIG }
