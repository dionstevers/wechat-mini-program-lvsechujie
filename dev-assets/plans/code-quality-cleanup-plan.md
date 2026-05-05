# Plan: Address WeChat DevTools Code Quality flags

## Context

DevTools' Code Quality scan on the just-uploaded build (master @ `97082db`) flags three Not-Pass items. None are fatal for the trial QR (the upload succeeded), but two of them — unused page files and the oversized image — also slow real-device load. The third (LazyCodeLoading) is a free runtime win.

The flags:

1. **Components → LazyCodeLoading is not turned on.** Engine eagerly evaluates every page + component on app launch instead of deferring component instantiation until the host page actually mounts.
2. **Image and Audio Resources → Picture and audio resources size exceeds 200K.** One offender: [`miniprogram/asset/img/clean.jpg`](miniprogram/asset/img/clean.jpg) at **269 KB**, used as an article thumbnail in [`miniprogram/config/articles.js`](miniprogram/config/articles.js).
3. **No Use or Dependency Files → Code Files: No dependency files should exist.** [`miniprogram/app.json`](miniprogram/app.json) registers 28 pages but only 12 are reachable in the experiment routing tree. The remaining 16 are legacy carbon-tracking holdovers (login, journal, triphistory, store, myprize, privacy, picUp, detail, quiz, notification, prizeCenter, merchDetail, aboutus, track, information, index) — they ship in the package and bloat the bundle without ever being navigated to.

Fixing all three slims the package, satisfies the linter, and removes 16 legacy files from the surface area a reviewer might flag during the manual review pass.

## Approach

### 1. Enable LazyCodeLoading

Single line in [`miniprogram/app.json`](miniprogram/app.json) at the top level:

```json
"lazyCodeLoading": "requiredComponents"
```

This tells WeChat to instantiate components lazily — the `home-cap-btn` / `welcome-banner` / `coin-overlay` etc. on a given page only get evaluated when that page mounts, not at app launch. No code changes needed; the runtime semantics already match what the option promises.

### 2. Shrink `clean.jpg` below 200 KB

Path: [`miniprogram/asset/img/clean.jpg`](miniprogram/asset/img/clean.jpg) (currently 269 KB).

It's used as a 750rpx-wide article thumbnail (≈375 px on most phones), so it's currently over-resolution. Two compatible knobs:

- **Re-encode at JPEG quality ~75** (it's likely 90+ now). Quickest win, no visual change at thumbnail size.
- If still over 200 KB, also resize to 1200 px wide (still 2× retina-safe). 

Tool: any local image processor (`magick`, `sips`, or an online compressor). Target ≤ 180 KB to leave headroom.

`asset/img/polluted.png` at 128 KB is below the limit — no action needed there.

### 3. Drop legacy pages from the bundle

Per audit, these 16 pages in [`miniprogram/app.json`](miniprogram/app.json) `pages` array are unreachable:

```
pages/index/index           pages/picUp/picUp
pages/information/information  pages/detail/detail
pages/login/login            pages/quiz/quiz
pages/journal/journal        pages/notification/notification
pages/triphistory/triphistory  pages/prizeCenter/prizeCenter
pages/store/store            pages/merchDetail/merchDetail
pages/myprize/myprize        pages/aboutus/aboutus
pages/privacy/privacy        pages/track/track
```

Verification: a `grep -rln '/pages/<name>/' miniprogram/{pages,components,utils,custom-tab-bar}` against each returned 0–2 hits, all of which are intra-legacy cross-references (legacy pages linking to each other, not the experiment flow). The 12 active pages are: `loading`, `landing`, `consent`, `registration`, `entry-survey`, `news-feed`, `article-viewer`, `exit-survey`, `debriefing`, `reward`, `home`, `center`.

For each of the 16 legacy pages:
1. Remove its entry from `app.json#pages`.
2. Move the directory `miniprogram/pages/<name>/` into `dev-assets/legacy-pages/<name>/` so the source is preserved off-bundle (matches the existing `dev-assets/trimmed/` pattern from earlier cleanups).
3. After all 16 are moved, grep miniprogram/ for any `require`/`import` references to files inside the moved directories — if anything dangles, either also move the dependency (if only legacy pages used it) or rewrite the importer to drop the dependency.

Likely co-movers: `miniprogram/utils/login.ts` (only imported by legacy `pages/login/`), `miniprogram/utils/home.util.ts` (`wx.getLocation` caller, not used by the experiment home page), `miniprogram/utils/chart.js` (already moved earlier per `dev-assets/trimmed/README.md`).

### 4. Verify `requiredPrivateInfos` after the move

[`miniprogram/app.json`](miniprogram/app.json) currently declares `requiredPrivateInfos: ['onLocationChange', 'startLocationUpdateBackground', 'getLocation', 'startLocationUpdate']` and `requiredBackgroundModes: ['location']`. These are needed by review only when the keywords appear in shipped JS. After legacy pages move out, run:

```
grep -rn 'wx.getLocation\|onLocationChange\|startLocationUpdate' miniprogram/
```

If no hits remain, drop both declarations from `app.json` — they trigger reviewer questions that are easier to avoid than answer.

## Critical files (touch list)

| File | Action |
|---|---|
| [`miniprogram/app.json`](miniprogram/app.json) | Add `lazyCodeLoading: "requiredComponents"`. Trim 16 legacy entries from `pages`. Possibly drop `requiredPrivateInfos` + `requiredBackgroundModes`. |
| [`miniprogram/asset/img/clean.jpg`](miniprogram/asset/img/clean.jpg) | Re-encode/resize to ≤180 KB. |
| `miniprogram/pages/{16 legacy dirs}/` | Move to `dev-assets/legacy-pages/`. |
| `miniprogram/utils/login.ts` (and any other legacy-only utils discovered in step 3 verification) | Move to `dev-assets/legacy-pages/utils/`. |
| `dev-assets/legacy-pages/README.md` | New short note (mirrors `dev-assets/trimmed/README.md`) listing what was moved + how to restore. |

No cloud function changes, no client-side behavior changes for the participant flow.

## Verification

1. **Static** —
   - `grep '"lazyCodeLoading"' miniprogram/app.json` → returns the new line.
   - `wc -c miniprogram/asset/img/clean.jpg` → < 200 000.
   - `grep -c 'pages/' miniprogram/app.json` in the `pages` array → 12 (down from 28).
   - `grep -rln 'pages/index\|pages/login\|pages/journal\|pages/track\|pages/information' miniprogram/` → empty (or returns only file paths inside the still-active 12-page tree, with no references to the moved names).

2. **DevTools** — Re-run the Code Quality scan after the changes. The three Not-Pass items should flip to Pass. Package size in the upload preview should drop noticeably (current 2.5 MB raw → expected ~2.2 MB raw, well under 2 MB compressed).

3. **Functional regression** — Walk the full participant flow in DevTools simulator: loading → landing → consent → registration → entry-survey → news-feed (timer + video) → exit-survey → debriefing → reward. Every step must still render correctly (the legacy pages were never on this path — the test confirms no hidden cross-imports got severed).

4. **Trial re-upload** — Bump version to `1.0.1`, upload, set as 体验版 again, scan QR on phone. Confirm the live build behaves identically.

