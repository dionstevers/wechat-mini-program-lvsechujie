# Testing artifacts

## What's current

Three flavours of the same 96 test cases covering the experiment mini-program as of master `97082db`. All are tab-separated, UTF-8 with BOM, and identical in scope — pick whichever matches the tester's language preference. Chinese (the team's working language) sits at the root; the other two languages are tucked under [`other-languages/`](other-languages/).

| File | Columns | Use when |
|---|---|---|
| [`test-cases-cn.tsv`](test-cases-cn.tsv) | 8 (Chinese only) | Mainland team running the QA pass — primary file |
| [`other-languages/test-cases-bilingual.tsv`](other-languages/test-cases-bilingual.tsv) | 12 (CN + EN side-by-side) | Bilingual reference; both languages on one row |
| [`other-languages/test-cases-en.tsv`](other-languages/test-cases-en.tsv) | 8 (English only) | Operator / supervisor reading along |

Modules covered:

- Bootstrap & re-entry routing (loading dispatcher)
- Landing / consent / registration
- Entry survey (incl. assignCondition)
- News-feed video overlay (treatment vs control)
- News-feed exit-timer (2-min countdown + skip)
- Article viewer
- Exit survey (incl. block randomisation)
- Debriefing (scroll-to-bottom gate)
- Reward — happy path + error path (yaoyaola)
- Coin overlay (pulse, pop, idle-glow, drag)
- Welcome-back banner (single-shot)
- Home capsule (mid-flow re-bootstrap)
- Tab bar
- Trip records (home tab)
- Personal centre (个人积分)
- Contact-us form (participant_feedback)
- Re-entry scenarios (one row per route in getParticipantState)
- Edge cases (network drop, force-kill, double-tap, vendor DNS fail, timeout)

## How to use

### Open in Excel directly

Double-click the `.tsv`. Excel auto-detects tab-delimited; BOM ensures Chinese characters render. If columns appear merged, use **Data → Text to Columns → Delimited → Tab**.

### Paste into a fresh xlsx / Google Sheet

1. Open the file in any text editor; select all; copy.
2. In Excel/Sheets, click cell **A1**.
3. Paste — all 12 columns + 97 rows (header + 96 cases) populate correctly.

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

## Updating the bilingual TSV

Re-run [`/tmp/build_test_tsv.py`](../../tmp/build_test_tsv.py) (the authoring script is one-shot and lives outside the repo by default). To make permanent changes:

1. Either edit cells directly in Excel/Sheets and re-save as TSV (UTF-8, tab-delimited, BOM).
2. Or update the `ROWS` list in the Python script and re-run — the script re-emits the full file.
