# Handoff: quantitative skill-tree app

For a fresh session (for example a cloud session) that has none of the earlier conversation. Read `CONTRIBUTING.md` first;
it defines the test format. This file records decisions and gotchas that are not in the code.

## What this is
Open-source skill-tree web app (Vite + React + TypeScript + KaTeX + vitest). 72 topics in `src/data/topics.json`. A topic is
passed by scoring 40/50 on its test; passing unlocks dependants. A topic with no folder in `src/content/tests/` shows
"test coming soon". `npm test`, `npm run build`, `npm run dev` (Dev mode toggle in the header unlocks every topic).

## Decisions made by the owner (keep to them)
- **MC is conceptual only** (no numeric answers). Each question: exactly 2 correct wordings + 5 distractors with a
  misconception note each. An attempt shows 1 correct + 3 distractors. Unseen questions preferred on retakes. Full answer
  key shown after every attempt.
- **MC selection:** strict per-lecture quota (20 questions over the topic's lectures: every lecture 1 or 2). Write at least
  3 per lecture, aim for about 5 (so a bank of about 55).
- **LQ selection:** blueprint slots (`lqSlots`), one generator drawn per slot. Aim for 2 generators per slot where a slot
  covers several lectures; each generator should touch the lectures of its slot.
- **LQ answers are checked in tests by independent computation** (exact fractions, a different algorithm, Monte Carlo).
  Re-running the generator's own formula proves nothing. Habit: temporarily break a generator and confirm the test fails.
- The calculator is always a *scientific* calculator (no code).

## Current scope (Stage 2, set 2026-10-17)
Build tests for the **8 required QR topics** `p3, inf, reg2, ts2, ml, rm, bay, pf2` and the **8 bonus topics**
`hd, ci, np, dl, mc, algo, pz, latex` first. The prerequisite topics (`calc, la1, la2, mvc, opt, p1, p2, pf1, py, ra, reg1,
ts1`, and `ms1`, `dm` which `algo` and `pz` need) come later. Because of that, these topics stay locked in real use until the
prerequisites have tests; use Dev mode to try them.

## Status
| Topic | State |
|---|---|
| `sp` Stochastic Processes | done, MC bank rewritten after an external AI review |
| `p3` Probability III | done (pilot): 55 MC, 5 LQ generators, slots `[A] [B,C] [D,E]`. **MC content not yet reviewed by a human or a second AI** |
| `inf` Statistical Inference | done: 55 MC, 6 LQ generators, slots `[A,B] [D,E] [F,G]`. MC not yet reviewed by a human or second AI |
| `reg2` Regression II | done: 56 MC (6 in lecture 8), 7 LQ generators, slots `[A,B] [D,E] [F,G,H]`. MC not yet reviewed |
| `ts2` Time Series II | done: 50 MC, 8 LQ generators, slots `[A,B] [D,E,F] [G,H,I]`. MC not yet reviewed |
| the other 12 scope topics | not started |

## Workflow that worked (per topic)
1. Read the topic's lectures in `src/data/topics.json` (use UTF-8 when printing; the Windows console chokes on accents).
2. Write the MC bank in a few part files, then merge into `src/content/tests/<id>/mc.json`.
3. Run `npx vitest run`. The structure tests include a length-leak test: the true option tends to come out too long
   (about 50% longest at first). Shorten the true wordings or lengthen distractors until each rank is between 15% and 35%
   bank-wide and no question exceeds 80%. A small script that prints each question's rank profile makes this quick.
4. Write the LQ generators in `lq/` plus `lq/lq.test.ts` with independent checks. `src/content/shared/format.ts` has `tex`,
   `dec`, tolerances and a normal cdf; `src/content/shared/fraction.ts` has exact fractions for tests.
5. Mutation-check, run `npm run build`, open the test in a browser with Dev mode on.

## Gotchas
- **After adding a new topic folder, delete `node_modules/.vitest-cache`** before `npm test`. Vitest caches the folder
  listing in `src/lib/content.ts`, so the new topic is silently skipped by the bank tests.
- **LaTeX through a shell corrupts backslashes** (`\r` and `\n` become control characters, `\\` collapses). Write JSON and
  TypeScript containing LaTeX with a file-writing tool, not shell heredocs. A test forbids control characters in banks.
- Keep tolerance for whole-number answers at `tolInt` and for "3 d.p." answers at half a unit of the last place.
- `docs/review-prompt.md` is stale on purpose; do not regenerate it.

## Open items
- Nobody but the author of each bank has read the MC content for truth. Have a human or a second AI review `sp` and `p3`.
- Not checked in a browser: a realistic 3-decimal typed answer against the grading tolerance; export/import of progress;
  phone width.
- A retake picks repeated questions only from recent attempts rather than the oldest ones; worth reading
  `selectPaper` in `src/lib/test-builder.ts` to see whether least-recently-seen should be preferred.

## Items for a human or second-AI reviewer, per topic
- `inf`: (1) `inf-11.1` assumes the MLE is taken from the grouped counts; with MLE from ungrouped data the df lie between k-1-m and k-1
  (Chernoff-Lehmann). (2) `inf-4.5` (MSE-optimal divisor n+1 for normal data) and `inf-6.4` (Cramer-Rao fails for U(0,theta)) are the
  subtlest statements. (3) The LQ t table (`e-twosample.ts`, df 8-11) is printed in the question; the test checks it by integrating the t density.
  (4) Chained LQ answers (F, E) tell students not to round intermediate values and use 2-3 d.p. tolerances.
- `reg2`: `reg2-8.5`/`8.6` (selection bias of the minimum CV error, leakage in screening) and `reg2-7.5` (at most n nonzero lasso coefficients when p>n holds for a solution, not necessarily every solution under ties) are the subtler ones. The sign convention in `reg2-5.4` is stated in the stem. LQ-E's one-SE rule picks the largest lambda within one SE *at the minimum*; some texts use other conventions, and the question states this one.
- `ts2`: `ts2-4.5` says the LR test of gamma=0 is valid; if gamma is constrained to be nonnegative the null is on the boundary and the limit is a chi-square mixture, so check the wording. The MC bank has 50 questions (5 per lecture), a little below the usual 55. LQ-F's half-life and LQ-H's densities assume exactly the stated models.
- Authoring tip that saved time: write each true wording at about the length of the average distractor (not longer). Starting from
  full-sentence true wordings gave 64% longest and needed a rewrite of 45 questions.
