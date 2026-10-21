# Contributing a topic test

A topic's test is a folder of files. Dropping it in `src/content/tests/<topicId>/` is all it takes: no other
code changes. Topics without a folder show "test coming soon". Topic ids are in `src/data/topics.json`
(for example `sp`, `p1`, `ml`).

```
src/content/tests/<topicId>/
  index.ts      default-exports a TestBank: { mc: MCQuestion[], lq: LQGenerator[] }
  mc.json       the multiple-choice bank
  lq/*.ts       one file per long-question generator, each with a test
```

`src/content/tests/sp/` is the worked example.

## Test format (set in `src/config/test.config.ts`)

- 20 multiple-choice questions (1 mark each) + 3 long questions (10 marks each, split evenly across the
  sub-questions) = 50 marks. Pass at 80% (40/50). An optional per-section minimum exists, off by default.
- Closed book, scientific calculator (no code), no time limit, unlimited retakes. Each retake draws new LQ numbers.
- **MC selection:** a strict quota per lecture. 20 questions over 11 lectures means every lecture gets 1 or 2 (which
  nine get 2 is random). Within a lecture, questions the student has not seen are preferred. Write at least
  3 MC questions per lecture (the structure test enforces it) and aim for a bank of about 60.
- **LQ selection:** optional blueprint `lqSlots` in `index.ts`: one list of generator ids per long-question slot
  (there must be `lqCount` slots, and each generator belongs to exactly one). Each attempt draws one generator from
  each slot, so every attempt spans the same parts of the syllabus. Group lectures into slots, and put
  interchangeable generators in the same slot. SP uses: slot 1 discrete chains (lectures 1-4), slot 2 ruin,
  branching and martingales (5, 10, 11), slot 3 continuous time, queues and renewal (6-9). Without `lqSlots`,
  generators are drawn uniformly at random, which can leave whole lectures untested in an attempt.

## Multiple choice: `mc.json`

MC questions are **conceptual**. No numerical answers; numbers belong in the long questions.

```json
{
  "id": "sp-2.2",
  "lecture": 2,
  "stem": "State $i$ of a Markov chain is recurrent. Which of the following must be true?",
  "correct": [
    "Starting from $i$, the chain returns to $i$ with probability 1.",
    "The probability that the chain ever comes back to $i$, given it starts there, equals 1."
  ],
  "distractors": [
    { "text": "The expected return time to $i$ is finite.", "misconception": "confuses recurrent with positive recurrent" }
  ],
  "explanation": "Recurrent means return probability 1. The expected return time can still be infinite."
}
```

Rules (a test in `src/content/banks.test.ts` enforces the structural ones):

- `lecture` is the 1-based lecture number from `topics.json`.
- **Exactly 2 `correct` entries**: two true statements that say the same thing in different words. Each attempt
  shows one of them.
- **Exactly 5 `distractors`**: each is false, and each has a `misconception` note saying the mistake it targets.
  Each attempt shows 3 of them. No distractor may be implied by, or equivalent to, a correct entry. Check this
  by hand: a statement that is true for a special case but false in general is fine only if the stem asks
  about the general case.
- Maths is KaTeX: `$inline$` and `$$display$$`. Write backslashes doubled in JSON (`\\frac`).
- No "all of the above" or "none of the above".
- **Do not let length give the answer away.** True wordings must not be systematically longer (or shorter) than
  the distractors. Write distractors as full, plausible sentences of about the same length as the true
  wordings, with a similar level of detail, and avoid putting an explanatory clause on the true option only.
  A test measures where the true option ranks by length among the 4 shown options: no question may have one
  rank above 80%, and bank-wide each rank (longest ... shortest) must stay between 15% and 35%.
- Mix easy and hard questions: include some that need two steps of reasoning or a subtle condition (for
  example a "finite-state" or "non-negative" assumption that changes the answer), not only definition recall.
- `explanation` is shown after the attempt; say why the correct answer is right.

## Long questions: `lq/*.ts`

A long question is a **generator**: a function that takes a seeded random number generator, picks the numbers,
and returns both the question and its answers, computed by the same function. The key therefore cannot drift
from what is shown.

```ts
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'

export function sample(rng: Rng): Params { /* choose numbers with rng.int / rng.pick / rng.shuffle */ }
export function build(params: Params): LQInstance { /* { intro, parts: [{ prompt, answer, tolerance, lecture, explanation }] } */ }
export const genA: LQGenerator = { id: 'sp-lq-a', generate: (rng) => build(sample(rng)) }
```

- Use only the `rng` you are given (`src/lib/rng.ts`), never `Math.random`, so an attempt can be rebuilt from its seed.
- Each part has a numeric `answer`, a `lecture` tag, and an `explanation` with the working.
- The student types only the final number: a decimal (`0.5`) or a single fraction (`1/2`). Percent signs and
  expressions are rejected. Say in the question how many decimal places you want.
- `tolerance` is `{ abs }` and/or `{ rel }`. For "3 decimal places" use `{ abs: 0.0005 }`. If omitted, the
  default in `test.config.ts` applies.
- Split `sample` (random parameters) from `build` (text and answers). The test then re-creates the same
  parameters and checks the answers.

### Every generator needs a unit test (vitest)

The test must check the answers against an **independent** computation over many seeds. Re-running the same
formula proves nothing. Good independent checks:

- exact rational arithmetic (BigInt fractions) in place of floating point;
- a different algorithm (for example a linear solve versus a closed form, or DFS versus Floyd-Warshall);
- Monte Carlo simulation of the system the question describes (this catches modelling mistakes such as a
  transposed matrix, which two algebraically equal computations would share).

See `src/content/tests/sp/lq/lq.test.ts`. A good habit: temporarily break the generator and confirm the test
fails.

## Lessons and lecture quizzes (optional, per topic)

A topic can also have a teaching layer: `src/content/lessons/<topicId>/index.ts` default-exports one `Lesson` per
lecture, in the order of `topics.json`. Without that folder the topic goes straight to its test.

```ts
{ teach: ['## Heading', 'A paragraph with $KaTeX$.'],        // at least 5 entries; "## " starts a sub-heading
  samples: [{ workedSeed: 'np-3-1-worked', lqId: 'np-lq-a-signed#0,1,2,3' }] }  // one worked sample per section of the lecture
```

- **A lecture is a real lecture** of the course (about one weekly 3-hour block of the notes), so a topic has 8 to 12 lectures (a test
  enforces this). A lecture usually merges several sections of the notes; give it one **sample** (generator `lqId`, optionally
  `id#0,2,3` to keep only some parts, plus a fixed `workedSeed`) per section.
- Each lecture page shows the lesson, one **worked sample** per section (with the working and answers shown), then the quiz.
  The quiz has **5 MC** (all with `lecture` = this lecture, spread over its sections using the optional `section` field of
  `mc.json`, unseen first) and **1 LQ** that combines the first three parts of every sample into one question (a composite id
  `a#0,1,2+b#0,1,2`, see `findGenerator` and `quizLqId`), so the quiz covers every section. 15 marks, pass at 12.
- The **final test** covers every lecture: its MC quota is per lecture, and its three long questions come from `examSlots`
  (built with `buildExamSlots`): each slot covers a range of lectures with composite questions made of the first two parts
  of one section of every lecture in the range. A test checks that every attempt asks something from every lecture.
- Lecture n unlocks when lecture n-1 is passed. The topic test unlocks when every lecture quiz is passed. Dev mode
  opens everything. Lecture attempts are stored under the key `<topicId>#L<n>`.
- A generator can serve two lectures by keeping only some parts: `id#0,1,2` keeps parts 0-2 with the numbers of the full
  question. Every kept part must carry `lecture` = the lecture it serves (a test enforces this), and a kept part must not
  depend on a part that is dropped (check the prompts and the intro). When no generator fits a lecture, write a small one
  with its own independent test and list it in the bank's `lectureLq` (never drawn for the topic test).
- Each lecture needs at least 5 MC questions in `mc.json`.
- When a topic's lectures are re-split or reordered, bump its entry in `lessonRevision` (`src/lib/lessons.ts`): lecture quiz progress saved for the old lectures is then ignored instead of being applied to different lectures. Also re-tag `lecture` in the MC bank and in the generator parts, and update any hard-coded career hour totals in the tests (hours are 3 per lecture).

## Typed-answer topics (an exception to "no coding questions")

The app's rule is theory and hand computation only, with no coding questions. **LaTeX & Research Writing (`latex`) is a
documented exception**: writing LaTeX is the skill it teaches, so every question is a typed answer (code, a command or
a file name), and there is no multiple choice. Other topics keep the rule.

A typed topic's bank has `mc: []` and `blanks: BlankQuestion[]` (short questions, 1 mark each, used where MC would be),
and its long-question parts are made with `typed()` from `src/content/shared/typed.ts` (`answer` is NaN; the part carries
a `blank` and a `view`). Attempts store the short questions' ids in `PaperSpec.mcIds` and their answers in
`Answers.blanks`. Lessons set `verbatim: true` and use `` `code` `` and ```` ``` ```` blocks (`src/lib/rich-text.ts`).

- Each blank has a `mode` (`src/lib/blank-grader.ts`): `render` (KaTeX output compared; maths lectures only:
  `RENDER_LECTURES` in `src/lib/blank-bank.ts`), `tokens` (TeX tokens; spaces between commands, `%` comments and braces
  around a single-token argument ignored), `set` (as tokens, with option and package lists and float placement letters
  in any order; give a `context` template when the box is only part of the command), or `exact` (plain text, for
  commands and file names; one token, never LaTeX maths).
- `key`, optional `accept` (other right answers) and `traps` (plausible wrong answers with a misconception, shown on the
  results page). `src/content/banks.test.ts` checks with `checkBlankBank`: the key and every accept pass, every trap
  fails as itself, at least 10 short questions per lecture, no answer visible in a prompt or template, and more.
- A picture is drawn with KaTeX's HTML output only, so the TeX source never reaches the page before submission. A live
  preview is allowed in lesson `practice` boxes, never in a quiz or test.
- Each generator test checks over many seeds that keys, accepts and hand-written alternative answers pass and traps
  fail, that the parameters vary, and the keys of three fixed parameter sets (`src/content/tests/latex/lq/checks.ts`).
- In lecture 1 of a typed topic, leave out `section` on the short questions (the retake test expects strict unseen-first).

## Checking your work

```
npm test         # all unit tests, including the bank structure checks
                 # after ADDING a new topic folder, first delete node_modules/.vitest-cache: vitest caches the
                 # folder listing in src/lib/content.ts, so a new topic is silently skipped by the bank tests
npm run build    # type-check and production build
npm run dev      # try the test in the browser (turn on Dev mode in the header to unlock every topic)
```
