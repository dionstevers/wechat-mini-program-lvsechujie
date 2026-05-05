# Testing artifacts

## What's current

Three flavours of the same 113 test cases covering the experiment mini-program. All are tab-separated, UTF-8 with BOM, and identical in scope — pick whichever matches the tester's language preference. Chinese (the team's working language) sits at the root; the other two languages are tucked under [`other-languages/`](other-languages/).

| File | Columns | Use when |
|---|---|---|
| [`test-cases-cn.tsv`](test-cases-cn.tsv) | 8 (Chinese only) | Mainland team running the QA pass — primary file |
| [`other-languages/test-cases-bilingual.tsv`](other-languages/test-cases-bilingual.tsv) | 12 (CN + EN side-by-side) | Bilingual reference; both languages on one row |
| [`other-languages/test-cases-en.tsv`](other-languages/test-cases-en.tsv) | 8 (English only) | Operator / supervisor reading along |

Modules covered:

- Bootstrap & re-entry routing (loading dispatcher)
- Landing / consent / registration
- Entry survey (incl. assignCondition)
- News-feed video overlay (treatment vs control, cold-launch replay, loading spinner)
- News-feed mid-flow re-entry (welcome modal first → video → feed)
- News-feed exit-timer (2-min countdown + skip)
- Article viewer
- Exit survey (Q2.2 visible to all, block randomisation, video-watch gating)
- Debriefing (scroll-to-bottom gate)
- Reward — happy path + error path (yaoyaola)
- Coin overlay (pulse, pop, idle-glow, drag)
- Welcome-back banner (single-shot)
- Home capsule (mid-flow re-bootstrap)
- Tab bar
- Trip records (home tab)
- Personal centre (个人积分)
- Contact-us form (participant_feedback)
- Randomisation (4 conditions, 2 article combos × 2 orders, in-survey shuffles, idempotency)
- Re-entry scenarios (one row per route in getParticipantState, including mid-exit-survey resume)
- Edge cases (network drop, force-kill, double-tap, vendor DNS fail, timeout)

## How to use

### Open in Excel directly

Double-click the `.tsv`. Excel auto-detects tab-delimited; BOM ensures Chinese characters render. If columns appear merged, use **Data → Text to Columns → Delimited → Tab**.

### Paste into a fresh xlsx / Google Sheet

1. Open the file in any text editor; select all; copy.
2. In Excel/Sheets, click cell **A1**.
3. Paste — all 12 columns + 114 rows (header + 113 cases) populate correctly.

### Column layouts

**Bilingual (12 cols):** 编号/ID · 模块/Module · 测试用例 (CN) · Test Case (EN) · 预设条件 (CN) · Pre-conditions (EN) · 操作步骤 (CN) · Steps (EN) · 预期结果 (CN) · Expected (EN) · 测试结果/Result *(blank)* · 备注/Notes *(blank)*

**CN-only (8 cols):** 编号 · 模块 · 测试用例 · 预设条件 · 操作步骤 · 预期结果 · 测试结果 *(blank)* · 备注 *(blank)*

**EN-only (8 cols):** ID · Module · Test Case · Pre-conditions · Steps · Expected · Result *(blank)* · Notes *(blank)*

Suggested values for **Result**: `Pass` / `Fail` / `Blocked` / `N/A`.

## Legacy artifacts

Lives under [`legacy/`](legacy/):

- `小程序测试用例YYYYMMDD.xlsx` (Aug 2024 → Jan 2026) — old test plans
- `小程序测试记录YYYYMMDD.xlsx` — old execution records
- `Cur_Prob.docx` — legacy known-issues log

All describe the **previous** carbon-tracking app: trip-recording APIs, location permissions, points-exchange, friend-add — features that no longer exist in the experiment routing tree. Kept for historical reference only, not as the active test plan.

## Updating the test cases

The authoring script [`build_test_tsv.py`](build_test_tsv.py) is the source of truth. The three TSVs are emitted from a single `ROWS` list inside it.

To add / remove / edit cases:

1. Edit the `ROWS` list in [`build_test_tsv.py`](build_test_tsv.py) — each entry is a tuple of `(module, case_zh, case_en, pre_zh, pre_en, steps_zh, steps_en, exp_zh, exp_en)`.
2. Run `python3 build_test_tsv.py` from this directory (or anywhere — paths are absolute).
3. All three TSVs (`test-cases-cn.tsv`, `other-languages/test-cases-bilingual.tsv`, `other-languages/test-cases-en.tsv`) regenerate.
4. Commit the script + TSV diffs together.

Avoid editing the TSVs by hand — drift between languages and accidental column-shift are the typical failure modes.

To send to testers: open the relevant TSV in Excel and **File → Save As → `.xlsx`** (or use Google Sheets' import + download flow). The xlsx is the artifact that goes to QA; the TSV is what lives under git.
