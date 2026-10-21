# LaTeX topic: build notes (Phase 2 framework + Phase 3 content)

## Phase 3: the content

The `latex` topic is complete: 10 lectures, each with a verbatim lesson, 11 or 12 short typed questions, one long-question generator (5 or 6 parts) and a generator test.

| Lecture | Short questions | LQ parts | Modes used |
|---|---|---|---|
| 1 Document structure | 11 | 6 | set, tokens |
| 2 Mathematical typesetting I | 12 | 6 | render |
| 3 Mathematical typesetting II | 12 | 6 | render (matrices, cases, aligned), tokens (theorems, numbering) |
| 4 Tables and figures | 11 (2 sections) | 6 | set (placement, options), tokens |
| 5 Plotting | 12 | 5 | set, tokens, exact (matplotlib call, file extension) |
| 6 Citations | 12 | 6 | exact (keys, program name), set (bib entry), tokens |
| 7 Cross-references and macros | 11 | 6 | tokens, render with the question's macros |
| 8 Paper structure | 11 | 5 | tokens |
| 9 Slides and posters | 11 | 6 | set, tokens |
| 10 Collaboration | 11 | 6 | exact (latexmk, git, .gitignore), tokens |

Files:
- `src/content/lessons/latex/l1.ts` to `l10.ts`, `index.ts`
- `src/content/tests/latex/blanks/l1.ts` to `l10.ts`
- `src/content/tests/latex/lq/lec1.ts` to `lec10.ts` with `lec<N>.test.ts`
- `lq/checks.ts`, the shared test helper
- `src/content/tests/latex/index.ts`. The final test uses `examSlots = buildExamSlots(bank, lessons, [[1,2,3,4],[5,6,7],[8,9,10]])`.
- `CONTRIBUTING.md`: new section "Typed-answer topics", which documents the exception.
- This file.

### Things you need to do by hand

1. **Delete `reports/latex-build/samples/`.** Lectures 2 and 4 now live in `src/content/` with corrected imports. The old sample files still pass their tests, but they are duplicates.
2. **`src/data/topics.json`: I never saw this file, so I did not touch it.** If the `latex` entry is missing, add one with the id `latex` and the 10 lecture titles of `topic-latex.md`, in that order. The bank and lesson tests need it to have exactly 10 lectures.
3. **Before running the tests:** `rm -rf node_modules/.vitest-cache`. Vitest caches the folder listing, so the new topic would otherwise be skipped.
4. **`src/pages/Topic.tsx`, unseen:** if it prints "multiple choice" or "MC" for every topic, it will say so for `latex` too. Paste it and I will patch it.

### Changes against the plan

- **`lq/checks.ts`**, a small shared test helper the plan did not list. Each `lec<N>.test.ts` is still its own test, with hand-written alternatives and fixed-parameter keys.
- **Questions reworded because the prompt or template showed the answer.** The bank rules caught these, which is what the rule is for. The shared-counter question became `\newtheorem{lemma}⟦⟧{Lemma}` with key `[thm]`.
- **Constant keys.** In lectures 8 and 5, one or two long-question parts have the same key in every seed: `\begin{abstract}`, `\appendix`, `pdf`. Their parameters vary elsewhere in the question. The tests check variation only on the parts that are parametrised.

## What I checked, and how

I used the same harness as in Phase 2: your files from the prompt, stubs for the files I was not given (`rng.ts`, `data/index.ts`, `context.tsx`, `graph.ts`, `Topic.tsx`, `Tree.tsx`, `testLogin.ts`, `tsconfig.json`, `vite.config.ts`), and the exact `package.json` versions. The stub `topics.json` has `latex` with 10 lectures.

Results with the topic live:
- `tsc --noEmit` gives 0 errors.
- `vitest run` gives 21 files and 205 tests passed. This includes:
  - the real `banks.test.ts`, with `checkBlankBank` on the full latex bank;
  - the real `lessons.test.ts`: every lecture's worked sample, quiz composition, marking 12/15, unlocking, the final-test coverage of every lecture;
  - the 10 generator tests, at 200 seeds each.
- `vite build` succeeds.
- I applied the five part files to the Phase 2 state with a converter written to your block format and got the same result.

### Not verified

- **Facts not checked against a running TeX installation.** I used only behaviour I am confident of, and avoided version-dependent options (no `compat=`, no `axis cs:`). The two I am least sure of:
  - latexmk accepting `--pvc`, `--pdf` and the other two-hyphen spellings. These are only `accept` entries, so being wrong would only make the grader more lenient.
  - cleveref's default lower-case "section 2" from `\cref`. The questions only rely on `\Cref` capitalising, which is certain.
- **Your real `rng.ts`.** The generators use only `rng.pick` and `rng.sample`, the same as existing generators. The fixed-key tests use parameter sets, not seeds.
- **Phones and dark mode** (see Phase 2 below).

---

## Phase 2: the framework

### Files

New:

| File | What it is |
|---|---|
| `src/lib/tex-tokens.ts` | TeX tokeniser and the `tokens` / `set` / `exact` normalisers, plus `preNormalize` (phone punctuation) |
| `src/lib/blank-grader.ts` | `gradeBlank`, `canonical`, `equivalent`, `render` mode through KaTeX MathML, `BLANK_MARK`, `modeLabel` |
| `src/lib/rich-text.ts` | the Rich text format (`code`, ```blocks, `$math$`) used by typed content |
| `src/lib/blank-bank.ts` | structural rules of a typed bank (`checkBlankBank`), used by `banks.test.ts` |
| `src/content/shared/typed.ts` | `typed()` helper for typed long-question parts (`answer: NaN`) and `BOX` |
| `src/components/Rich.tsx`, `BlankInput.tsx`, `BlankPrompt.tsx`, `Practice.tsx`, `TypedReview.tsx` | the UI |
| tests: `src/lib/{tex-tokens,blank-grader,blank-bank,builder-blanks,progress-blanks}.test.ts`, `src/components/leak.test.tsx`, `src/pages/typed-pages.test.tsx` | |

Changed:
- `src/lib/types.ts`: additive only.
- `grader.ts`, `test-builder.ts` (`shortPool`), `lessons.ts`.
- `src/pages/Test.tsx`, `Result.tsx`, `Lecture.tsx`: branches for typed banks. Numeric topics render as before.
- `src/styles.css`: appended block.
- `banks.test.ts`, `lessons.test.ts`: typed-bank branches. The MC-bank checks are unchanged.

### Changes against the Phase 2 plan

- **New `Blank.context`.** Answers are compared after being put in place of the box, so `set` mode can sort float placement letters and option lists.
- **Unseen-first with sections.** In a lecture with sections, the round robin can repeat one seen question on a retake. That is the existing MC behaviour. So lecture 1 of a typed topic has no `section`.

### Known limits

- The bank ships in the JavaScript bundle. The leak rules only stop someone reading the page.
- **`render` compares KaTeX 0.19 MathML.** The bank tests re-check every key, accept and trap, so a KaTeX upgrade that changes equivalences fails `npm test` rather than silently mis-grading.
- **Known false rejects in `render`:**
  - `x'` vs `x^\prime`
  - `\mathbf` vs `\boldsymbol`
  - `a\,b` vs `a b`
  - `\|x\|` vs `\lVert x \rVert`
- **Known false rejects in `tokens`:**
  - `0.8` vs `.8`
  - `l rr` vs `lrr`
  - a space between `}` and a word character
- A space after a control symbol (`5\% in`) is treated as ignorable, which TeX does not do. This can only make the grader more lenient.
- Re-grading on view uses the current grader. The stored scores do not change.

## Commands

```
rm -rf node_modules/.vitest-cache   # once after adding the topic folder
npx tsc --noEmit
npm test
npm run build
```
