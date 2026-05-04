# Trimmed assets

Files relocated out of `miniprogram/` to keep the upload bundle under the WeChat 2 MB main-package cap. Nothing here is referenced by the experiment flow. Restore by moving back if needed.

## Contents

| Path here | Original location | Size | Why removed |
|---|---|---|---|
| `ec-canvas/` | `miniprogram/asset/ec-canvas/` | 1.0 MB | echarts charting lib + wrapper component. No `usingComponents` entry references `ec-canvas`. Only consumer was `utils/chart.js` (also removed). Legacy from the carbon-tracking app's chart screens, none of which are in the experiment routing tree. |
| `privacyPopup/` | `miniprogram/asset/privacyPopup/` | 172 KB | Custom privacy popup component (.js/.json/.wxml/.wxss). No page registers it in `usingComponents` and no template imports it. Mini-program privacy is handled by `app.json` `requiredPrivateInfos` + WeChat's built-in modal, not this component. |
| `chart.js` | `miniprogram/utils/chart.js` | <8 KB | Helper that imports `../asset/ec-canvas/echarts` and configures a chart instance. No file in `pages/` or `components/` imports it (verified with grep). |

## Verification before move

- `grep -rn "ec-canvas" miniprogram/{pages,components,app.json}` → no hits
- `grep -rn "privacyPopup" miniprogram/{pages,components,app.json}` → no hits
- `grep -rn "utils/chart" miniprogram/{pages,components}` → no hits

`asset/img/clean.jpg` and `asset/img/polluted.png` were considered but are LIVE — used as article thumbnails in [`config/articles.js`](../../miniprogram/config/articles.js). Kept in bundle.

## Restore

```bash
mv dev-assets/trimmed/ec-canvas miniprogram/asset/
mv dev-assets/trimmed/privacyPopup miniprogram/asset/
mv dev-assets/trimmed/chart.js miniprogram/utils/
```
