# 低碳出街小助手 — Experiment Mini-Program

WeChat mini-program implementing a between-subjects experiment on environmental communication. Originally forked from a carbon-footprint tracking app (Hengyu Du, 2022); the current code base re-uses the page shell + cloud-development scaffolding but the participant flow, surveys, condition assignment, video treatments, payout, and analytics are new.

Operator: Duke Kunshan University. AppID `wx3adf1829016e6695`. Cloud env `cloudbase-d4ghbgqhq17d3a271`.

---

## Participant flow

```
loading        bootstrap router (calls getParticipantState)
  → landing      welcome screen, +88 coin reward for tapping 继续
  → consent      knowledge-and-consent text, +50 on agree
  → registration phone (required) + WeChat ID (optional), +50 on submit
  → entry-survey survey-engine renders ENTRY_SURVEY config
                 [assignCondition fires here, on page LOAD, idempotent]
  → news-feed    treatment: video overlay → continue → article cards
                 control:   article cards directly
                 [exit-timer pill counts down 2 min top-right]
  → exit-survey  triggered by timer expiry or 跳过 chip
  → debriefing   scrolling consent gate; 领取奖励 button activates at bottom
  → reward       claimReward → yaoyaola red-packet API; idempotent
                 → news-feed (free-use mode after claim)
```

Mid-flow re-launches are routed by `getParticipantState` (cloud function) based on participant doc timestamps. Welcome-back banners explain the bounce.

---

## Conditions

Each participant gets three independent randomisations from `assignCondition`:

| Field | Values |
|---|---|
| `condition` | `treatment_pos` / `treatment_neg` / `no_text` / `control` |
| `article_combination` | `combo_A` / `combo_B` |
| `article_order` | `combo_X_order_1` / `combo_X_order_2` |

`condition` drives whether a video overlay plays before the news-feed (control = no video). `article_combination` + `article_order` jointly select which two articles the participant sees and in what order, per `ORDER_MAP` in [`miniprogram/config/articles.js`](miniprogram/config/articles.js).

---

## Repo layout

```
miniprogram/                client mini-program source (only file shipped to WeChat)
├── app.js                   globalData, dev-mode mocks, coin pub/sub
├── app.json                 page registry, custom tab-bar config
├── pages/                   12 pages — see flow above
├── components/              survey-engine, exit-timer, welcome-banner,
│                            coin-overlay, dev-banner
├── config/                  surveys (entry/exit), articles, videos, reward,
│                            consent, registration, news-feed copy
├── custom-tab-bar/          bottom 3-tab switcher (home / news-feed / center)
├── utils/                   parse-segments — bold-marker → wxml-friendly tokens
└── miniprogram_npm/         vendored @vant/weapp

cloudfunctions/              wx-server-sdk Node functions, deployed to TCB
├── saveConsent              Screen 1
├── saveRegistration         Screen 2
├── saveSurveyResponse       Screens 3 + 6 — block-by-block survey writes
├── assignCondition          fires at entry-survey START; idempotent
├── logArticleEvent          news-feed + article-viewer reading-time logs
├── logDebriefing            shown / read events
├── completeSession          totals coins, sets reward_yuan (cap 704 / ¥8)
├── claimReward              dispatches red packet via sendCashReward
├── sendCashReward           yaoyaola HTTP integration
├── getParticipantState      bootstrap router; returns route + welcome banner
└── (28 legacy carbon-tracking functions — unused, kept for compatibility)

dev-assets/                  files NOT shipped to WeChat
├── out-of-bundle/           legacy pages + utils excluded from upload bundle
│   ├── pages/               16 carbon-tracking pages (login, journal, ...)
│   └── utils/               8 unused utility modules
├── testing/                 bilingual test cases + tester README
│   ├── test-cases-cn.tsv    primary (113 cases, Chinese)
│   ├── other-languages/     bilingual + English-only
│   ├── legacy/              legacy xlsx test plans
│   └── build_test_tsv.py    authoring script — single source of truth
├── treatments/              raw mp4s for video treatments (served locally in dev)
├── plans/                   archived design plans
├── PRE_UPLOAD_CHECKLIST.md  pre-upload sanity list
└── serve-treatments.command macOS double-click helper to host treatments locally
```

---

## DEV_MODE switch

Single constant in [`miniprogram/app.js:8`](miniprogram/app.js#L8) controls dev behaviour:

```js
const DEV_MODE_OPTION = 'off' | 'empty' | 'prefilled'
```

| Value | wx.cloud.callFunction | Surveys | Use |
|---|---|---|---|
| `'off'` | real cloud | answered manually | **production / trial** |
| `'empty'` | mocked in-memory | blank | UI dev with no cloud roundtrip |
| `'prefilled'` | mocked in-memory | every question pre-answered | rapid click-through testing |

Must be `'off'` before upload. Verified in [`dev-assets/PRE_UPLOAD_CHECKLIST.md`](dev-assets/PRE_UPLOAD_CHECKLIST.md).

There's also a `TEST_CONDITION_OVERRIDE` constant in [`miniprogram/pages/entry-survey/entry-survey.js`](miniprogram/pages/entry-survey/entry-survey.js) — set to a condition string to force every participant into that condition regardless of `assignCondition`. Empty string = real randomisation. **Must be empty before review.**

---

## Reward

Coin budget = 704 (= ¥8 at 88 coins/yuan). Awarded across:
- Landing 继续: 88
- Consent 同意: 50
- Registration 提交: 50
- Entry survey: distributed per `coins_per_question` weights (computed from `TYPE_WEIGHTS` in [`miniprogram/config/reward.js`](miniprogram/config/reward.js))
- News-feed video continue: +50 (treatment only)
- Exit-timer expiry / 跳过: +88
- Exit survey: distributed similarly

`completeSession` clamps the DB total at 704 regardless of upstream sum. Yuan rounded to 2 dp.

`claimReward` flips `reward_attempted=true` atomically with the in-flight lock; routing afterwards never returns to the reward page (`getParticipantState` routes to `news_feed_free`). yaoyaola DNS errors are surfaced inline with a 返回主页 button + contact-us hint.

---

## Local development

Prerequisites: WeChat DevTools (Stable channel), this repo cloned, AppID `wx3adf1829016e6695` access on the WeChat MP backend (operator-side).

1. **Clone + open** in DevTools. The project root is the dir containing `project.config.json`.
2. **Set DEV_MODE** in [`miniprogram/app.js:8`](miniprogram/app.js#L8). For day-to-day: `'prefilled'`.
3. **Treatment videos in dev**: double-click [`dev-assets/serve-treatments.command`](dev-assets/serve-treatments.command) (macOS) — runs a local HTTP server on `:8000` serving `dev-assets/treatments/*.mp4`. [`miniprogram/config/videos.js`](miniprogram/config/videos.js) auto-routes to `localhost` when `DEV_MODE !== 'off'`.
4. **Cloud env** — confirm DevTools 云开发 panel binds to `cloudbase-d4ghbgqhq17d3a271`. Wrong env binding = silent FUNCTION_NOT_FOUND.
5. **Compile** + use the simulator. The custom tab-bar surfaces only on home / news-feed / center.

Survey edits go in [`miniprogram/config/survey-entry.js`](miniprogram/config/survey-entry.js) / [`miniprogram/config/survey-exit.js`](miniprogram/config/survey-exit.js). Field names + question types must align with what `survey-engine` expects (`single_select`, `multi_select`, `slider`, `matrix`, `dropdown`, `open_text`, `statement`, `intro`, `token_allocation`).

---

## Cloud functions

Deploy via DevTools right-click on the function folder → **上传并部署：云端安装依赖** (or ⌘4). Each function has its own `package.json` with `wx-server-sdk` as the only universal dep; `claimReward` + `sendCashReward` + `transfer` also pull `axios`.

Database collections (auto-created by first writes; index on `_openid` recommended):
- `experiment_participants` — one row per participant; primary research output
- `participant_feedback` — contact-us submissions from the center page
- `track` — self-reported trip records (legacy carb-tracking remnant, kept on home tab)

Cloud storage: treatment videos under `treatments/` in the cloud env. Permission must be **all-users-read** for participants other than the uploader to fetch them.

---

## Publish workflow

1. Run [`dev-assets/PRE_UPLOAD_CHECKLIST.md`](dev-assets/PRE_UPLOAD_CHECKLIST.md) end-to-end.
2. DevTools → 上传 → bump version (e.g. `1.0.x`).
3. mp.weixin.qq.com → 管理 → 版本管理 → 开发版本 → 选为体验版.
4. mp.weixin.qq.com → 成员管理 → 体验成员 → add tester WeChat IDs.
5. 设置 → 开发管理 → 体验版二维码 → scan on phone.
6. After trial verification: 提交审核 → 发布.

The home capsule (top-left house icon WeChat renders on non-first pages) reLaunches to `pages/loading/loading`. Mid-flow taps land in a silent re-bootstrap with a route-specific welcome-banner reminder; we cannot intercept the tap directly.

---

## Testing

Bilingual test plan (113 cases) lives at [`dev-assets/testing/test-cases-cn.tsv`](dev-assets/testing/test-cases-cn.tsv) (primary) with English + side-by-side variants under `other-languages/`. Authoring script: [`dev-assets/testing/build_test_tsv.py`](dev-assets/testing/build_test_tsv.py). Edit the `ROWS` list, run the script, commit script + TSVs together.

For QA delivery: open the relevant TSV in Excel, save as `.xlsx`, send to testers.

---

## Where research data lives

| Source | Location |
|---|---|
| Participant rows | CloudBase Console → Database → `experiment_participants` |
| Feedback messages | CloudBase Console → Database → `participant_feedback` |
| Cloud function logs | CloudBase Console → Cloud Function → \<name> → Log |
| Reward transactions | yaoyaola dashboard (vendor side) — cross-ref `reward_transaction_id` |
| Crashes / runtime errors | mp.weixin.qq.com → 运维中心 → 异常情况 |

Export via the cloud console's CSV/JSON download. For larger cohorts: write a one-shot cloud function that streams the collection.

---

## Common gotchas

- **Inner `miniprogram/project.config.json`**: a leftover. DevTools may still parse it. Authoritative file is the root `project.config.json`.
- **`@babel/runtime`**: enabling `lazyCodeLoading: "requiredComponents"` in `app.json` triggers a babel-runtime helper resolution error on the survey-engine. Either install `@babel/runtime` + run DevTools 构建 npm, or leave the option off (the marginal cold-start win isn't worth the npm dance for the trial).
- **Forced reLaunch** on home-capsule tap: WeChat does not expose a tap hook. We make the bounce silent by suppressing min-loading delay + welcome-banner re-paint on second-bootstrap.
- **Condition assignment timing**: `assignCondition` fires at entry-survey LOAD (so the engine knows condition before block 5 renders the textIfControl variant). Submitted analyses keying on `condition_assigned_timestamp` should expect that timestamp to fall ~mid-survey rather than at submit.
- **Wiping participants for re-test**: delete the row in `experiment_participants` from the cloud console, then DevTools → 清缓存 → 全部清除 → recompile. Otherwise `getParticipantState` will route the tester back into mid-flow.
