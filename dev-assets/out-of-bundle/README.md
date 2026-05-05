# Out-of-bundle source

Source files kept under git but **excluded from the WeChat upload bundle**. Reasons range from "legacy carbon-tracking holdover never reached by the experiment flow" to "asset too heavy for the 2 MB main-package cap with no on-screen consumer". Each cleanup that removes code from `miniprogram/` should drop the source here rather than deleting it, so the file's history stays inspectable + restorable.

## Contents

| Path here | Original location | Why excluded |
|---|---|---|
| `pages/` (16 dirs) | `miniprogram/pages/<name>/` | Legacy carbon-tracking pages: `aboutus`, `detail`, `index`, `information`, `journal`, `login`, `merchDetail`, `myprize`, `notification`, `picUp`, `prizeCenter`, `privacy`, `quiz`, `store`, `track`, `triphistory`. None reachable from the experiment routing tree (loading → landing → consent → registration → entry-survey → news-feed → article-viewer → exit-survey → debriefing → reward, plus tab pages home / center). DevTools' Code Quality scan flagged them as "no-dependency files" and they bloated the package. |
| `utils/` (8 files) | `miniprogram/utils/<name>` | Utility modules with zero remaining importers in the experiment bundle: `colorschema.ts`, `home.util.ts` (calls `wx.getLocation` — only consumer was the legacy home), `log.ts`, `login.ts` (only consumer was `pages/login/`), `md5.js`, `requestSubs.ts`, `time.ts`, `transfer.ts`. Only `parse-segments.js` stays in-bundle (used by survey-engine, registration, landing, news-feed). |
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

## History

This folder was previously called `dev-assets/trimmed/` (renamed for clarity — "out-of-bundle" reads as an ongoing category, "trimmed" suggested a one-time event). `git log --follow` on any file inside still walks back through the original `miniprogram/` location.
