# Pre-Upload Checklist — Cloud Release

Run through this list before clicking **上传** (Upload) in WeChat DevTools. Mock data and tourist mode must be disabled, or real participants will see a broken experiment.

## 1. Disable DEV_MODE

- [ ] `miniprogram/app.js` — set `const DEV_MODE = false`
- [ ] Verify no leftover `console.log('[DEV]...')` noise in hot paths
- [ ] Confirm `devMode` banner no longer renders on `consent` page

## 2. Real AppID

- [ ] `project.config.json` — replace `"appid": "touristappid"` with real AppID (from mp.weixin.qq.com → 开发 → 开发管理 → 开发设置)
- [ ] `project.private.config.json` — same

## 3. Cloud environment

- [ ] Confirm `env: 'iluvcarb-0gzvs45g82b57f98'` in `app.js` matches target env in WeChat Cloud console
- [ ] Cloud env has billing / quota enabled (not expired)

## 4. Deploy cloud functions

In DevTools, right-click each folder under `cloudfunctions/` → **上传并部署：云端安装依赖** (Upload & Deploy):

- [ ] `assignCondition`
- [ ] `completeSession`
- [ ] `logArticleEvent`
- [ ] `logDebriefing`
- [ ] `saveConsent`
- [ ] `saveRegistration`
- [ ] `saveSurveyResponse`

## 5. Database collections

Open Cloud console → 数据库. Ensure collections exist with correct permissions (usually 仅创建者可读写):

- [ ] `experiment_participants`

## 6. Smoke test against real cloud

With `DEV_MODE = false` and real AppID, in DevTools:

- [ ] Compile & preview on phone (扫码预览)
- [ ] Full flow: consent → registration → entry-survey → news-feed → article-viewer → exit-survey → debriefing → reward
- [ ] Check Cloud console → 数据库 → `experiment_participants` — new record created with your OpenID
- [ ] Fields populated: `consent_given`, `consent_timestamp`, registration fields, `condition`, `article_combination`, `article_order`, survey responses, `debrief_shown_timestamp`, `debrief_read_timestamp`, `session_complete`, `reward_yuan`

## 7. Version & submit

- [ ] DevTools → **上传** → set version number + description
- [ ] mp.weixin.qq.com → 版本管理 → submit 体验版 for internal testing before 提交审核

## 8. Revert DEV_MODE for local dev

After upload, restore local dev setup on your branch:

- [ ] `DEV_MODE = true`
- [ ] `appid: "touristappid"` (if you were using tourist mode)

Keep the release commit separate from the dev revert — do not push the tourist AppID to `master`.
