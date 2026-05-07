# Out-of-bundle source

Source files kept under git but **excluded from the WeChat upload bundle**. Reasons range from "legacy carbon-tracking holdover never reached by the experiment flow" to "asset too heavy for the 2 MB main-package cap with no on-screen consumer". Each cleanup that removes code from `miniprogram/` should drop the source here rather than deleting it, so the file's history stays inspectable + restorable.

## Contents

| Path here | Original location | Why excluded |
|---|---|---|
| `pages/registration/` | `miniprogram/pages/registration/` | Removed from active flow. Consent now redirects directly to `entry-survey`. See **Restoring the registration page** below. |
| `config/registration.js` | `miniprogram/config/registration.js` | Form copy + validation messages for the registration page. Only consumer was `pages/registration/`. |
| `cloudfunctions/saveRegistration/` | `cloudfunctions/saveRegistration/` | Cloud function that persisted `phone` / `wechat_id` and awarded `coins_registration`. Only caller was `pages/registration/registration.js`. |
| `pages/` (16 dirs) | `miniprogram/pages/<name>/` | Legacy carbon-tracking pages: `aboutus`, `detail`, `index`, `information`, `journal`, `login`, `merchDetail`, `myprize`, `notification`, `picUp`, `prizeCenter`, `privacy`, `quiz`, `store`, `track`, `triphistory`. None reachable from the experiment routing tree (loading → landing → consent → entry-survey → news-feed → article-viewer → exit-survey → debriefing → reward, plus tab pages home / center). DevTools' Code Quality scan flagged them as "no-dependency files" and they bloated the package. |
| `utils/` (8 files) | `miniprogram/utils/<name>` | Utility modules with zero remaining importers in the experiment bundle: `colorschema.ts`, `home.util.ts` (calls `wx.getLocation` — only consumer was the legacy home), `log.ts`, `login.ts` (only consumer was `pages/login/`), `md5.js`, `requestSubs.ts`, `time.ts`, `transfer.ts`. Only `parse-segments.js` stays in-bundle (used by survey-engine, landing, news-feed). |
| `ec-canvas/` | `miniprogram/asset/ec-canvas/` | echarts charting lib + wrapper (≈ 1.0 MB). No `usingComponents` entry references it; only consumer was `utils/chart.js` (also out-of-bundle). |
| `privacyPopup/` | `miniprogram/asset/privacyPopup/` | Custom privacy popup component (172 KB). No page registered it; mini-program privacy is handled by the platform's built-in modal. |
| `chart.js` | `miniprogram/utils/chart.js` | Helper that imported `../asset/ec-canvas/echarts`. No remaining caller. |

## Verification before each move

Every entry above was preceded by a grep against the in-bundle source tree confirming zero importers:

```
grep -rn '<symbol>' miniprogram/{pages,components,utils,custom-tab-bar,app.json}
```

If a grep returns hits, the file is still in-bundle and must NOT be moved here.

## Restore

`git mv` preserves history, so to restore any file run:

```bash
git mv dev-assets/out-of-bundle/pages/<name> miniprogram/pages/<name>
git mv dev-assets/out-of-bundle/utils/<name> miniprogram/utils/<name>
```

…then re-add the page entry to `miniprogram/app.json#pages` if applicable.

### Restoring the registration page

The registration screen sat between consent and entry-survey, collecting `phone` / `wechat_id` and awarding `COINS_REGISTRATION` (50 coins). Removing it required edits to seven other files. To restore:

1. **Move sources back:**
   ```bash
   git mv dev-assets/out-of-bundle/pages/registration miniprogram/pages/registration
   git mv dev-assets/out-of-bundle/config/registration.js miniprogram/config/registration.js
   git mv dev-assets/out-of-bundle/cloudfunctions/saveRegistration cloudfunctions/saveRegistration
   ```

2. **Re-register the page in [`miniprogram/app.json`](../../miniprogram/app.json#L5)** — add `"pages/registration/registration"` between `"pages/consent/consent"` and `"pages/entry-survey/entry-survey"` in the `pages` array.

3. **Restore the consent → registration redirect** in [`miniprogram/pages/consent/consent.js`](../../miniprogram/pages/consent/consent.js):
   ```js
   wx.redirectTo({ url: '/pages/registration/registration' })
   ```
   (currently points to `/pages/entry-survey/entry-survey`).

4. **Restore the registration route + welcome banner** in [`miniprogram/pages/loading/loading.js`](../../miniprogram/pages/loading/loading.js):
   - `ROUTE_TO_URL`: add `registration: { url: '/pages/registration/registration', method: 'redirect' }`
   - `MID_FLOW_HINT`: add `registration: '请先完成注册后再返回主页。'`

5. **Restore the registration gate** in [`cloudfunctions/getParticipantState/index.js`](../../cloudfunctions/getParticipantState/index.js):
   - `deriveRoute`: re-insert `if (!p.registration_timestamp) return 'registration'` after the `consent_given` check.
   - `deriveBanner`: re-insert `case 'registration': return '欢迎回来！请完成注册以继续'`.

6. **Restore the post-consent step** in [`cloudfunctions/saveConsent/index.js`](../../cloudfunctions/saveConsent/index.js): change both `current_step: 'entry_survey'` writes back to `current_step: 'registration'`.

7. **Restore the dev mock + scenario** in [`miniprogram/app.js`](../../miniprogram/app.js):
   - `MOCKS`: re-insert `saveRegistration: function() { return { success: true, coins_registration: REWARD_CONFIG.coins_registration } }`.
   - Dev scenario switch: rename `'consented_no_entry'` back to `'consented_no_registration'` (route `'registration'`) and add a separate `'registered_no_entry'` case (route `'entry_survey'`, +50 coins).
   - Update the `devScenario` doc-comment in `globalData` to list both names again.

8. **Re-deploy `saveRegistration`** in DevTools (right-click → 上传并部署：云端安装依赖) and rebuild npm if needed.

The `coins_registration` field reads in `getParticipantState` and `completeSession` were left in place when the page was removed, so they don't need to change. `REWARD_CONFIG.coins_registration` (`reward.js`) was also left intact — it's harmless when nothing writes the field, and ready for use on restore.

## History

This folder was previously called `dev-assets/trimmed/` (renamed for clarity — "out-of-bundle" reads as an ongoing category, "trimmed" suggested a one-time event). `git log --follow` on any file inside still walks back through the original `miniprogram/` location.
