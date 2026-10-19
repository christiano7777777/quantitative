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
| `p2` Probability II (HKU SDST2602) | done: 55 MC, 7 LQ generators, slots `[A,B,H] [D,E] [F,G]`. Converted from the old `inf` test; lecture 2 (LLN, CLT) is new. MC not yet reviewed |
| `inf` Statistical Inference (HKU STAT3602) | **restructured 2026-10-19**: 18 lectures that follow the STAT3602 notes (decision theory 1-4, Bayesian approach 5-7, exponential families 8-9, sufficiency/likelihood/completeness 10-12), then the outline topics the notes have not reached (13-18: information inequality, MLE, UMP, UMPU, LRT/confidence sets, bootstrap). 94 MC (5+ per lecture), 20 LQ generators (8 new: m-decision, n-bayes, o-riskset, p-bayestest, q-nuisance, r-expfam, s-natural, t-likelihood; j, k, l moved from lectureLq into the exam), slots `[C,M,N,D,O,E,P,Q] [R,S,J,T,A,K,B] [F,G,H,I,L]`. `d-bayes-minimax` is now exam-only. MC not yet reviewed |
| `reg2` Regression II | done: 56 MC (6 in lecture 8), 7 LQ generators, slots `[A,B] [D,E] [F,G,H]`. MC not yet reviewed |
| `ts2` Time Series II | done: 50 MC, 8 LQ generators, slots `[A,B] [D,E,F] [G,H,I]`. MC not yet reviewed |
| `ml` Machine Learning | done: 55 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. Theory plus hand computation only; LQ-A part 5 is a short "read this gradient-descent procedure" item. MC not yet reviewed |
| `rm` Research Methods | done: 56 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `bay` Bayesian | done: 54 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]` (theory and hand computation only, no coding). MC not yet reviewed |
| `pf2` Portfolio & Asset Pricing II | done: 49 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `hd` High-dimensional Stats | done: 50 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `ci` Causal Inference | done: 49 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `np` Nonparametric (HKU STAT3620) | **restructured 2026-10-19**: 21 lectures that follow the STAT3620 lecture notes chapter by chapter (lectures 1-16), then the outline topics the notes have not reached (17-21: jackknife, functionals, KDE, regression, ranking). 107 MC (5+ per lecture), 22 LQ generators (11 new: l-intro, m-sign, n-cicdf, o-hl, p-scale, q-kw, r-mult, s-block, t-bootci, u-pivotal, v-bootreg), slots `[L,M,N,I,E,O,P,C] [Q,R,A,B,S,D] [T,U,V,F,J,G,H,K]`. MC not yet reviewed |
| `dl` Deep Learning | done: 55 MC, 8 LQ generators, slots `[A,B,C] [D,E,F] [G,H]` (no coding). MC not yet reviewed |
| `mc` Monte Carlo | done: 45 MC (4 per lecture, 5 in lecture 11, below the usual 55), 7 LQ generators, slots `[A,B] [C,D,E] [F,G]`. MC not yet reviewed |
| `algo` Algo / Quant Trading | done: 55 MC, 8 LQ generators, slots `[A,B,C] [D,E,F] [G,H]` (no coding). MC not yet reviewed |
| `pz` Probability Puzzles | done: 52 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `exp` Experimental Design | done: 55 MC, 8 LQ generators, slots `[A,B,C] [D,E] [F,G,H]`. MC not yet reviewed |
| `rl` Reinforcement Learning | done: 58 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `ms2` Microstructure II | done: 53 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `sc` Stochastic Calculus | done: 60 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `lt` Learning Theory | done: 50 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `it` Information Theory | done: 56 MC, 8 LQ generators, slots `[A,B,C] [D,E,F] [G,H]`. MC not yet reviewed |
| `ts1` Time Series I | done: 55 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `opt` Optimization | done: 55 MC, 8 LQ generators, slots `[A,B] [C,D,E] [F,G,H]`. MC not yet reviewed |
| `la2` Linear Algebra II | done: 58 MC, 8 LQ generators, slots `[A,B,C] [D,E,F] [G,H]`. MC not yet reviewed |
| `ra` Real Analysis | done: 56 MC, 8 LQ generators, slots `[A,B,C] [D,E,F] [G,H]`. Follows the topic data (measure theory and Lebesgue integration). MC not yet reviewed |
| `latex` LaTeX & Research Writing | **not built, waiting for the owner**: see "Proposal for `latex`" below |
| the other topics (prerequisites) | not started |

## Lessons and lecture quizzes (added 2026-10-19)
Topics `np`, `bay`, `inf` have lessons (`src/content/lessons/<id>/index.ts`; format in CONTRIBUTING.md). Owner's rules: each
lecture teaches the topic (lesson text), shows one worked sample, then a quiz of 5 MC + 1 LQ (15 marks, pass 12/15, i.e. 80%);
passing lecture n opens n+1; all lectures passed unlock the topic test (40/50); topics without lessons go straight to the test.
- The worked sample is the lesson's LQ generator at a fixed seed, so it is the same kind of question as the quiz.
- Long-question generators written only for lectures (`bay` I, J; `inf` J, K, L) live in the bank's `lectureLq`, so the topic
  exams are unchanged. `inf` `d-bayes-minimax` part 5 was retagged from lecture 1 to 2 so that the whole generator serves lecture 2.
- Added MC: `bay-1.5, 3.5, 4.5, 5.5, 7.5, 10.5, 11.5` (so every bay lecture has at least 5).
- The lesson texts are the author's own and have **not** been reviewed by a human or a second AI. Items to check: the Wilcoxon
- **np was restructured to follow the HKU lecture notes** (Downloads: `Chap0`-`Chap6`, T0-T4, midterm, assignments). Lecture quiz progress saved before the restructure is ignored (`lessonRevision` in `src/lib/lessons.ts`; bump it again whenever a topic's lectures are re-split). Lecture boundaries are my split of the chapters by section; check them against the real timetable. Slide items with no quiz yet: bootstrap hypothesis-test details beyond the p-value rule, the chi-square test in lecture 7, Cochran's Q / McNemar numerics.
- **inf was restructured the same way** (revision 2). Career hour totals changed because inf has 18 lectures instead of 11 (QR path 672 -> 693 h). Notation follows the notes: natural parameter of the normal is eta=(-1/(2 sigma^2), mu/sigma^2) with natural statistic (x^2, x). Lectures 13-18 are from the outline only.
  efficiency bounds (np 1), Friedman and Kruskal-Wallis formulas (np 5), the Mallows normalising constant (np 10), the
  Beta-tail/binomial identity (bay 4), the R-hat and ESS formulas (bay 9), the Basu statement (inf 4), the bootstrap-maximum
  remark (inf 11).
- `lq` quiz parts reuse the existing independent tests; the five new generators have `lq/lecture.test.ts` in their topic and
  were mutation-checked (every part's answer changed to `ans*1.02+0.02` makes a test fail).
- Not yet checked in a real browser: a full quiz played through with typed answers on a phone-width screen.

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
- New bonus topics (`exp, rl, ms2, sc, lt, it`) and the reshaped `p2`/`inf`: each builder's list of doubtful question ids is in that session's report; the subtlest are `sc-2.2` (Holder exponents), `sc-8.1` (Girsanov sign convention), `lt-8.3` (stability constant), `ms2-1.3` (Kyle informativeness), `inf-5.3` (admissibility wording), `rl-6.4` (offline lambda-return equivalence), `exp-8.1` (pooled variance in the CI).
- `inf`: (1) `inf-11.1` assumes the MLE is taken from the grouped counts; with MLE from ungrouped data the df lie between k-1-m and k-1
  (Chernoff-Lehmann). (2) `inf-4.5` (MSE-optimal divisor n+1 for normal data) and `inf-6.4` (Cramer-Rao fails for U(0,theta)) are the
  subtlest statements. (3) The LQ t table (`e-twosample.ts`, df 8-11) is printed in the question; the test checks it by integrating the t density.
  (4) Chained LQ answers (F, E) tell students not to round intermediate values and use 2-3 d.p. tolerances.
- `reg2`: `reg2-8.5`/`8.6` (selection bias of the minimum CV error, leakage in screening) and `reg2-7.5` (at most n nonzero lasso coefficients when p>n holds for a solution, not necessarily every solution under ties) are the subtler ones. The sign convention in `reg2-5.4` is stated in the stem. LQ-E's one-SE rule picks the largest lambda within one SE *at the minimum*; some texts use other conventions, and the question states this one.
- `ts2`: `ts2-4.5` says the LR test of gamma=0 is valid; if gamma is constrained to be nonnegative the null is on the boundary and the limit is a chi-square mixture, so check the wording. The MC bank has 50 questions (5 per lecture), a little below the usual 55. LQ-F's half-life and LQ-H's densities assume exactly the stated models.
- `ml`: `ml-4.5` says the 1-NN error is asymptotically at most twice the Bayes error (the sharper bound is `2R*(1-R*)`). `ml-7.3`'s "mainly reduces bias" is the usual heuristic, not a theorem. LQ-A part 5 (the gradient-descent procedure) is the only code-reading style item; LQ-G avoids ties in both k-means iterations.
- `rm`: `rm-8.2` (BIC penalises more than AIC once `n > e^2`, about 7.4) and `rm-6.6` (the square-root rule fails under serial correlation of either sign). LQ-E uses the standard error for a Sharpe ratio estimated from monthly returns, `sqrt((1+SR^2/24)/years)` for i.i.d. returns; the first draft used the annual-frequency formula and the Monte Carlo test caught it.
- `bay`: `bay-3.3` (credible versus confidence interval), `bay-11.4` (the "reverse KL" naming for `KL(q||p)`) and `bay-4.2` (improper flat priors) deserve a second read. Theory and hand computation only; the coding lines of the syllabus are left for the advanced part.
- `pf2`: `pf2-4.4` states the fundamental theorem in its finite-state form; `pf2-9.1` states the post-publication decline of anomaly returns as a general tendency. LQ-E treats asset 1 on its own (one absolute view), as the question says.
- `hd`: the Marchenko-Pastur edges and the BBP threshold (`hd-5.2`, `hd-6.1`) assume unit noise variance; `hd-2.2` relies on the Poisson and chi-square variables not being sub-Gaussian. The Wishart Monte Carlo test uses a finite-size tolerance for the smallest eigenvalue.
- `ci`: `ci-5.5` (doubly robust) needs overlap and regularity conditions that the wording leaves implicit; `ci-9.5` states the fixed-effects assumption informally.
- `np`: `np-1.2` quotes the Pitman efficiency 3/pi of the signed-rank test against the t test under normality; `np-6.5` says Spearman's rho is usually larger than Kendall's tau (about 1.5 times for moderate normal dependence).
- `pz`: `pz-9.1` and `pz-9.2` assume the standard Monty Hall host protocols; numeric puzzle answers were turned into conceptual questions (why the answer is what it is). LQ-C and LQ-H use plain "dollars" wording because a `\$` inside math breaks the `$` balance check.
- `mc`: only 45 MC questions (4 per lecture); `mc-6.2` is qualified to proportional allocation. LQ-D uses `exp(cU)` throughout so that every moment has a closed form, and the Euler strong-order test is a simulation.
- `dl`: LQ-C uses the usual Adam constants (0.9, 0.999, 1e-8). LQ-H's KL term is for a one-dimensional latent. The syllabus coding lines are not examined.
- `algo`: `algo-6.2` (square-root impact: per-share impact grows with the square root of size, so total cost grows faster than size). LQ-F's t-statistic uses `SR x sqrt(years)`, an approximation that ignores non-normality.
- Authoring tip that saved time: write each true wording at about the length of the average distractor (not longer). Starting from
  full-sentence true wordings gave 64% longest and needed a rewrite of 45 questions.

## Proposal for `latex` (needs the owner's decision before any build)
The syllabus lectures are about typesetting and workflow, not mathematics, so the "computation" lines are not hand-computable
numbers. The format needs a numeric final answer and independent recomputation, which does not fit most lectures. Proposal:
1. MC (conceptual, 2 correct and 5 distractors, about 55 questions) covers all ten lectures in the normal way.
2. LQ generators with a numeric answer are possible for a few lectures only: count the compiled pages or columns, the value of a
   counter after a sequence of commands (section/equation numbering, `\setcounter`, `\addtocounter`), the number of
   references after a bibliography key list, or lengths in a `tabular` column spec. A "read this LaTeX snippet and give the
   number" item would fit the "code reading" allowance, with an independent re-implementation of the counter rules in the test.
3. Lectures 8-10 (paper structure, slides, collaboration) have no numeric reading; they would rely on the MC only, or on counting
   items (frames, authors, merge conflicts) in a short described scenario.
Tell me whether you want (a) MC only, (b) MC plus the counter-style LQ generators above, or (c) something else.
