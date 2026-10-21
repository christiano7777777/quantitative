# Task: write the real Big Exam questions for the "Quantitative" app

You are writing exam content for a self-study app. The student is an undergraduate statistics / quantitative finance student at a Hong Kong university who is studying at a high standard. The app has a **Big Exam** for each topic: a **written part** (about 2 hours, typed in LaTeX, marked by AI against your marking scheme) and a **coding part** (Python in the browser, marked by automatic tests). Your job is to write both parts, as data files, for the topic(s) named at the end of this message.

You cannot run code. Everything you write will be checked by a validator that runs your reference solutions, so correctness matters more than volume. Work carefully and do the self-check at the end before you answer.

---

## 0. What you must produce

For each topic `<id>` (a short lowercase id such as `bay`, `inf`, `np`):

- `content/exams/<id>.written.json` (schema in section 2)
- `content/exams/<id>.coding.json` (schema in section 3), **unless the topic is written-only** (the student will tell you; then produce only the written file)

**Output format (strict):** for every file write one heading line with the exact file name, then one fenced ```json block holding the complete file, and nothing else inside the block. The student saves each block as a file and runs `npm run validate-exams`. Do not add comments inside the JSON (JSON has none). Put any remarks outside the code blocks, after all files.

**JSON escaping, the most common cause of failure:**
- Every backslash in LaTeX or Python must be doubled inside a JSON string: write `\\frac{1}{2}`, `\\theta`, `\\begin{align}`, `\\\\` for a LaTeX line break, and `\\n` inside a Python string literal.
- Line breaks inside a string are written `\n` (a JSON string cannot contain a real newline).
- Double quotes inside a string are written `\"`. Prefer single quotes in Python code to avoid this.
- Do not use trailing commas. Numbers such as `0.05` are plain JSON numbers.

---

## 1. Sources you must follow

### 1.1 The topic's lecture syllabus

Follow the topic's actual lecture syllabus, not a generic textbook. Every question must be answerable from material in the outline below; use the outline's own notation and terminology and the order in which ideas are introduced. Spread the questions over the whole syllabus, not just the first lectures. If a question needs a result that the outline does not cover, state that result in the question text.

Paste the lecture outline for each topic here before you send this prompt:

**Topic `bay` (Bayesian Statistics) lecture outline:**
```
<<<PASTE THE LECTURE OUTLINE FOR bay HERE>>>
```

**Topic `inf` (Statistical Inference) lecture outline:**
```
<<<PASTE THE LECTURE OUTLINE FOR inf HERE>>>
```

**Topic `np` (Nonparametric Statistics) lecture outline:**
```
<<<PASTE THE LECTURE OUTLINE FOR np HERE>>>
```

**Topic `<other id>` (phase 2 topics) lecture outline:**
```
<<<PASTE THE LECTURE OUTLINE HERE>>>
```

If a marker above still says PASTE, do not invent a syllabus: ask the student to paste it.

### 1.2 Originality

Write new questions in the style of university past papers. Do not reproduce questions from any real exam, assignment or textbook exercise.

---

## 2. The written file

### 2.1 Style rules

- **Past-paper style, about 2 hours.** A good paper has 4 or 5 questions worth about 100 marks in total (set `totalMarks` to the exact sum and `durationMinutes` to about 120). A student who knows the material should need most of the 2 hours.
- **Multi-part questions.** Each question has a shared setup (`text`) and 3 to 5 lettered parts (`a`, `b`, `c`, ...), each with its own marks. Parts should build on each other, with later parts allowed to use earlier results (say so in the text).
- **Include proofs.** At least one proof or derivation in every question, and across the paper at least a quarter of the marks on parts with `"type": "proof"`. Typical proofs: unbiasedness, sufficiency, a distributional result, an inequality, a property of an estimator or test, a convergence statement. Mix them with calculations and short explanations (`"type": "explanation"`: "state the assumption and say when it fails").
- **Difficulty mix per question:** one or two routine parts (recall a definition, apply a formula), one or two standard parts (a derivation from the lectures), one harder part (a proof or a twist not seen in the lectures but solvable from them).
- **Marks:** whole or half marks only. Marks per part are typically 3 to 8. Total per question typically 20 to 25.
- **Self-contained and unambiguous.** Define every symbol. State the model, the parameter space and what may be assumed. If a numeric answer is expected, say how to give it (exact fraction, or 3 decimal places).
- **Numbers that work out.** Choose numbers so that a student can finish by hand with a scientific calculator and no code. Compute them yourself and check them twice.

### 2.2 Marking scheme (per part)

`markingScheme` is a list of steps, each with the marks it earns; **the step marks must add up exactly to the part's marks.** Write steps the way an examiner would: one mark for each separable piece of correct reasoning ("writes the likelihood", "differentiates and sets to zero", "checks the second derivative", "identifies the distribution and gives both parameters"). A step must be checkable from the student's text alone. An AI marker will follow this scheme literally, so make it precise: name the exact expression or conclusion that earns the mark. Where more than one method is valid, say so in the step ("by any valid method").

### 2.3 Model answer (per part)

`modelAnswer` is a complete worked answer, not a sketch: every step of the scheme visible, every non-trivial algebra step shown, the final result stated. It is shown to the student after marking and given to the AI marker as the reference.

### 2.4 LaTeX and Markdown that render in the app

Question text, parts, marking-scheme steps and model answers are **Markdown with LaTeX**, rendered by KaTeX. Use only what KaTeX supports.

- Inline maths `$...$`, display maths `$$...$$`, and aligned derivations as `\\begin{align} a &= b \\\\ &= c \\end{align}` (also `align*`, `gather`, `equation`). Do **not** use `eqnarray` or `multline` (not supported).
- Use `\\text{...}` for words inside maths, `\\operatorname{...}` for operator names, `\\mathbb{R}`, `\\mathcal{N}`, `\\mathbf{x}`, `\\mid`, `\\sim`, `\\xrightarrow{d}`, `\\overset{...}{...}`, `\\binom`, `\\sum`, `\\prod`, `\\int`, `\\boldsymbol`, `\\begin{cases}`, `\\begin{pmatrix}`.
- Do **not** use `\\newcommand` inside a question. Define macros once in the file-level `preamble` (for example `\\newcommand{\\E}{\\mathbb{E}}`) and use them everywhere. The student's own answers can use them too.
- Do not use packages, `\\label`, `\\ref`, `\\cite`, `\\tag` or `\\href`. Do not write a bare `$` in text (it starts maths); write `\\$`.
- Markdown allowed: paragraphs (blank line), `**bold**`, `*italic*`, `` `code` ``, fenced code blocks, `-` bullet lists and `1.` numbered lists, `### headings`. HTML is not rendered.
- Keep each formula on its own `$...$`; a missing closing `$` is the most common rendering error. The validator renders every formula and fails on any that KaTeX rejects.

### 2.5 Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://quantitative.local/schema/written.schema.json",
  "title": "Big Exam: written part (content/exams/<topic-id>.written.json)",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "topicId",
    "title",
    "durationMinutes",
    "totalMarks",
    "instructions",
    "questions"
  ],
  "properties": {
    "$schema": {
      "type": "string"
    },
    "schemaVersion": {
      "const": 1
    },
    "topicId": {
      "type": "string",
      "pattern": "^[a-z0-9]+$",
      "description": "id in src/data/topics.json; must equal the file name prefix"
    },
    "placeholder": {
      "type": "boolean",
      "description": "true on example files that must be replaced before real use"
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "durationMinutes": {
      "type": "integer",
      "minimum": 15,
      "maximum": 300,
      "description": "soft limit, about 120"
    },
    "totalMarks": {
      "type": "number",
      "exclusiveMinimum": 0,
      "description": "must equal the sum of the question marks"
    },
    "instructions": {
      "type": "string",
      "minLength": 1,
      "description": "Markdown + LaTeX shown above the questions"
    },
    "preamble": {
      "type": "string",
      "description": "optional \\newcommand lines; they apply to question text and to the student's answer preview"
    },
    "questions": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "title",
          "text",
          "marks",
          "parts"
        ],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^q[0-9]+$"
          },
          "title": {
            "type": "string",
            "minLength": 1
          },
          "text": {
            "type": "string",
            "minLength": 1,
            "description": "shared setup of the question, Markdown + LaTeX"
          },
          "marks": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "must equal the sum of the part marks"
          },
          "parts": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "id",
                "text",
                "marks",
                "markingScheme",
                "modelAnswer"
              ],
              "properties": {
                "id": {
                  "type": "string",
                  "pattern": "^[a-z]$|^[a-z][ivx]+$",
                  "description": "a, b, c ... (or ai, aii for sub-sub-parts)"
                },
                "text": {
                  "type": "string",
                  "minLength": 1
                },
                "marks": {
                  "type": "number",
                  "exclusiveMinimum": 0
                },
                "type": {
                  "enum": [
                    "calculation",
                    "derivation",
                    "proof",
                    "explanation",
                    "other"
                  ]
                },
                "markingScheme": {
                  "type": "array",
                  "minItems": 1,
                  "description": "mark allocation per step; the step marks must add up to the part marks",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": [
                      "step",
                      "marks"
                    ],
                    "properties": {
                      "step": {
                        "type": "string",
                        "minLength": 1
                      },
                      "marks": {
                        "type": "number",
                        "exclusiveMinimum": 0
                      }
                    }
                  }
                },
                "modelAnswer": {
                  "type": "string",
                  "minLength": 1,
                  "description": "full worked answer, Markdown + LaTeX"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### 2.6 Worked example (a complete, valid written file)

This is the pipeline's placeholder file. It shows the exact shape and the level of detail expected in a marking scheme and a model answer. **Do not reuse its content.** Your questions must be longer and harder: this example has only one short question, a real paper has 4 or 5.

```json
{
  "$schema": "./schema/written.schema.json",
  "schemaVersion": 1,
  "topicId": "bay",
  "placeholder": true,
  "title": "PLACEHOLDER: Bayesian Statistics, written exam",
  "durationMinutes": 120,
  "totalMarks": 20,
  "instructions": "**PLACEHOLDER EXAM.** This file only proves that the pipeline works; replace it with real questions.\n\nAnswer in LaTeX. Write $...$ for inline maths and `\\begin{align} ... \\end{align}` for displayed derivations. Show every step: marks are given for the working, not only for the final answer.",
  "preamble": "\\newcommand{\\E}{\\mathbb{E}}\n\\newcommand{\\Var}{\\operatorname{Var}}",
  "questions": [
    {
      "id": "q1",
      "title": "Beta-Bernoulli model (placeholder)",
      "text": "Let $Y_1,\\dots,Y_n$ be conditionally independent given $\\theta$, with $Y_i\\mid\\theta\\sim\\text{Bernoulli}(\\theta)$, and let the prior be $\\theta\\sim\\text{Beta}(a,b)$ with $a,b>0$, so that\n$$\\pi(\\theta)=\\frac{\\theta^{a-1}(1-\\theta)^{b-1}}{B(a,b)},\\qquad 0<\\theta<1.$$\nWrite $s=\\sum_{i=1}^n y_i$ for the observed number of successes.",
      "marks": 20,
      "parts": [
        {
          "id": "a",
          "type": "derivation",
          "text": "Derive the posterior distribution of $\\theta$ given $y_1,\\dots,y_n$, and state its parameters.",
          "marks": 5,
          "markingScheme": [
            {
              "step": "Writes the likelihood $p(y\\mid\\theta)=\\theta^{s}(1-\\theta)^{n-s}$",
              "marks": 1
            },
            {
              "step": "Writes the prior kernel $\\theta^{a-1}(1-\\theta)^{b-1}$ and drops constants not involving $\\theta$",
              "marks": 1
            },
            {
              "step": "Multiplies: $\\pi(\\theta\\mid y)\\propto\\theta^{s+a-1}(1-\\theta)^{n-s+b-1}$",
              "marks": 1
            },
            {
              "step": "Recognises the kernel of a Beta distribution and states $\\text{Beta}(a+s,\\,b+n-s)$",
              "marks": 2
            }
          ],
          "modelAnswer": "By Bayes' theorem the posterior is proportional to likelihood times prior. The likelihood is\n$$p(y\\mid\\theta)=\\prod_{i=1}^n\\theta^{y_i}(1-\\theta)^{1-y_i}=\\theta^{s}(1-\\theta)^{n-s}.$$\nHence, dropping every factor that does not depend on $\\theta$,\n\\begin{align}\n\\pi(\\theta\\mid y)&\\propto \\theta^{s}(1-\\theta)^{n-s}\\cdot\\theta^{a-1}(1-\\theta)^{b-1}\\\\\n&=\\theta^{a+s-1}(1-\\theta)^{b+n-s-1},\\qquad 0<\\theta<1.\n\\end{align}\nThis is the kernel of a Beta density, so $\\theta\\mid y\\sim\\text{Beta}(a+s,\\;b+n-s)$."
        },
        {
          "id": "b",
          "type": "proof",
          "text": "Show that the posterior mean is a weighted average of the prior mean $a/(a+b)$ and the sample mean $\\bar y=s/n$, and give the weight on the prior mean.",
          "marks": 5,
          "markingScheme": [
            {
              "step": "States the posterior mean $\\E[\\theta\\mid y]=\\dfrac{a+s}{a+b+n}$ (uses the mean of a Beta distribution)",
              "marks": 2
            },
            {
              "step": "Splits the numerator and rewrites $a=(a+b)\\cdot\\frac{a}{a+b}$ and $s=n\\bar y$",
              "marks": 2
            },
            {
              "step": "Identifies the weight $w=\\dfrac{a+b}{a+b+n}$ on the prior mean and $1-w$ on $\\bar y$",
              "marks": 1
            }
          ],
          "modelAnswer": "The mean of $\\text{Beta}(\\alpha,\\beta)$ is $\\alpha/(\\alpha+\\beta)$, so\n$$\\E[\\theta\\mid y]=\\frac{a+s}{a+b+n}.$$\nWrite $a=(a+b)\\frac{a}{a+b}$ and $s=n\\bar y$. Then\n\\begin{align}\n\\E[\\theta\\mid y]&=\\frac{(a+b)}{a+b+n}\\cdot\\frac{a}{a+b}+\\frac{n}{a+b+n}\\cdot\\bar y\\\\\n&=w\\,\\frac{a}{a+b}+(1-w)\\,\\bar y,\\qquad w=\\frac{a+b}{a+b+n}\\in(0,1).\n\\end{align}\nSo the posterior mean is a convex combination of the prior mean and the sample mean; the weight on the prior mean is $w=(a+b)/(a+b+n)$, which tends to $0$ as $n\\to\\infty$. $\\blacksquare$"
        },
        {
          "id": "c",
          "type": "proof",
          "text": "Prove that under squared error loss $L(\\theta,d)=(\\theta-d)^2$ the Bayes estimator (the minimiser of the posterior expected loss) is the posterior mean.",
          "marks": 5,
          "markingScheme": [
            {
              "step": "Writes the posterior expected loss $\\E[(\\theta-d)^2\\mid y]$ as the function to minimise over $d$",
              "marks": 1
            },
            {
              "step": "Adds and subtracts $m=\\E[\\theta\\mid y]$ and expands the square",
              "marks": 1
            },
            {
              "step": "Shows the cross term has zero expectation, giving $\\Var(\\theta\\mid y)+(m-d)^2$",
              "marks": 2
            },
            {
              "step": "Concludes the minimum is at $d=m$ because $(m-d)^2\\ge 0$ with equality only at $d=m$",
              "marks": 1
            }
          ],
          "modelAnswer": "Let $m=\\E[\\theta\\mid y]$. For any fixed $d$,\n\\begin{align}\n\\E[(\\theta-d)^2\\mid y]&=\\E[((\\theta-m)+(m-d))^2\\mid y]\\\\\n&=\\E[(\\theta-m)^2\\mid y]+2(m-d)\\,\\E[\\theta-m\\mid y]+(m-d)^2\\\\\n&=\\Var(\\theta\\mid y)+(m-d)^2,\n\\end{align}\nbecause $\\E[\\theta-m\\mid y]=0$. The first term does not depend on $d$ and the second is non-negative and zero only for $d=m$. Hence the posterior expected loss is minimised uniquely at $d=m$, the posterior mean. $\\blacksquare$"
        },
        {
          "id": "d",
          "type": "calculation",
          "text": "Take $a=b=2$, $n=10$ and $s=7$. Give the posterior distribution, the Bayes estimate under squared error loss and the posterior variance.",
          "marks": 5,
          "markingScheme": [
            {
              "step": "Posterior is $\\text{Beta}(9,5)$",
              "marks": 2
            },
            {
              "step": "Bayes estimate $9/14\\approx 0.643$",
              "marks": 1.5
            },
            {
              "step": "Posterior variance $\\dfrac{9\\cdot 5}{14^2\\cdot 15}=\\dfrac{3}{196}\\approx 0.0153$",
              "marks": 1.5
            }
          ],
          "modelAnswer": "From part (a) the posterior is $\\text{Beta}(a+s,\\,b+n-s)=\\text{Beta}(2+7,\\,2+3)=\\text{Beta}(9,5)$.\n\nThe Bayes estimate under squared error loss is the posterior mean, $9/(9+5)=9/14\\approx 0.643$.\n\nFor $\\text{Beta}(\\alpha,\\beta)$ the variance is $\\alpha\\beta/\\big((\\alpha+\\beta)^2(\\alpha+\\beta+1)\\big)$, so\n$$\\Var(\\theta\\mid y)=\\frac{9\\cdot 5}{14^2\\cdot 15}=\\frac{45}{2940}=\\frac{3}{196}\\approx 0.0153.$$"
        }
      ]
    }
  ]
}
```

---

## 3. The coding file

### 3.1 What a coding question is

The student writes one or two Python functions in a browser editor, running on Pyodide (Python 3.14 with **numpy and scipy only**; no pandas, statsmodels, sklearn or matplotlib). The tests call the **main** function with keyword arguments and compare its return value with an expected value. The point is **knowing the algorithm's pseudocode**, not heavy software engineering: a good question can be solved in 10 to 40 lines by someone who knows the method.

### 3.2 Rules for each question

1. **No data sample is given.** The question states only what the statistician would know: the model (for example the density `f(y | p)`), the prior, the estimand, the algorithm's fixed settings. The student builds the likelihood, the unnormalised posterior, the statistic and so on **themselves**. Data appear only as the **test input**, passed to the main function as an argument.
2. **One tested function.** `functions` lists what the student writes. Exactly one has `"main": true`; only its output is tested. Other functions are optional helpers (for example `log_posterior`); they are never tested directly.
3. **Simple outputs.** The main function returns one number, one list or one array. For MCMC, bootstrap or permutation questions it returns **one array** of draws or resampled statistics. Say exactly what it returns, including its length.
4. **Fixed, stated constants.** Iteration counts, burn-in, step sizes, number of bootstrap resamples, starting values, grid sizes: all fixed, **stated in the question text** and defined as constants in `helperCode` (for example `N_ITER = 20000`). They are not arguments the tests vary.
5. **Seeds.** Every test has an integer `seed`. If the question is random, set `"rngArg": "rng"` (or another name): the harness then passes a seeded `numpy.random.Generator` under that keyword, and the question text must say "use `rng` for all randomness". The harness also seeds `random` and `numpy.random` with the same seed.
6. **`skeleton`:** the code the student starts from: the `def` lines with docstrings, a `# YOUR CODE HERE` comment and `raise NotImplementedError`. It must define every function in `functions`. The untouched skeleton must not earn marks: the validator errors if it passes every test and warns if it passes any.
7. **`helperCode`:** read-only code that runs first: imports (`import numpy as np`, `from scipy import stats`), the constants, and any helper the student may call but does not write. Keep it short.
8. **`docs`:** notes shown beside the editor. Put the algorithm's **pseudocode** here (in a fenced block), the relevant formulas, and any convention the tests rely on (for example "sample standard deviation uses `ddof=1`").
9. **`referenceSolution`:** complete working code for **every** function in `functions` (the helperCode is prepended automatically; do not repeat it). It is hidden until the student submits and is the code the validator runs against all tests.
10. **`difficultyNotes`:** one or two sentences for the author: what the question tests and the typical mistakes.
11. **Marks:** every question has `marks` (typically 10 to 15); `totalMarks` is their sum. The student's score is 50% from the share of visible tests passed and 50% from the share of hidden tests passed.

### 3.3 Tests: visible and hidden

- Write **2 or 3 visible tests** (ids `v1`, `v2`, ...) and **3 to 5 hidden tests** (ids `h1`, `h2`, ...). Visible tests let the student debug; hidden tests catch solutions that only work on the visible cases.
- Hidden tests must use **different inputs** and must probe the edge cases a correct algorithm handles but a sloppy one does not: ties, small `n`, all-equal data, data that put the answer near a boundary, a different sample size, a numpy array input. Never make a hidden test depend on something the question does not state.
- `input` is an object whose keys are exactly the main function's parameter names (except the `rngArg`). Values are JSON: numbers, lists, nested lists, strings. A value `{"$ndarray": [..]}` is passed as a numpy array. Write data out literally; keep samples small (5 to 50 numbers).
- Every test needs `compare` (below) and `expected`.

### 3.4 Comparison types (per test, chosen in `compare`)

**Deterministic outputs**

- `{"type": "exact"}`: the output must equal `expected` exactly (integers, booleans, strings, lists of those; `1` equals `1.0`). Use for ranks, counts, decisions ("reject" / "accept"), integer or half-integer statistics.
- `{"type": "numeric", "abs": 1e-6}` and/or `"rel"`: elementwise `|got - expected| <= abs + rel * |expected|`, shapes must match. Use for estimators, test statistics, p-values, risks, anything computed in floating point. Use `abs: 1e-6` for closed-form results and `abs: 1e-4` when an optimiser or a numerical integral is involved.

**Stochastic outputs (seeded, compared through summaries, never draw by draw)**

- `{"type": "quantiles", "probs": [0.05, 0.5, 0.95], "abs": 0.02, "length": 18000}`: the harness takes `np.quantile` (linear interpolation) of the returned array and compares it with `expected` (one value per prob). `length` (optional but recommended) is the required length of the array.
- `{"type": "summary", "stats": ["mean", "sd"], "abs": 0.03, "length": 1000}`: compares summary statistics. `stats` can be `mean`, `sd` (ddof=1), `var` (ddof=1), `median`, `min`, `max`.

**Tolerances for stochastic tests must be statistically sound.** An honest correct solution must pass on essentially every seed. Work out the Monte Carlo standard error of the summary and set the tolerance to **at least 5 standard errors**, and also **no more than about a quarter of the posterior/sampling standard deviation**, so that a wrong algorithm is still caught. For MCMC use the effective sample size, not the number of iterations: a random-walk chain with 18,000 kept draws often has an ESS of 1,500 to 3,000. For quantiles, `se ≈ sqrt(p(1-p)/ESS) / f(q_p)`. The validator re-runs your reference solution on 8 other seeds for every stochastic test and **fails if any run misses**, so a tolerance tuned to one seed is caught.

### 3.5 Expected values: how to get them right when you cannot run code

- If you can compute `expected` exactly by hand or from a closed form, write the number (use at least 10 significant digits for deterministic tests).
- If you cannot (typical for MCMC, bootstrap, permutation tests), write `"expected": "$FROM_REFERENCE"` and **also write an `oracleSolution`**. The student will run `npm run validate-exams -- --fill-expected`, which fills the number in.
- **`oracleSolution` is an independent second computation of the expected value**, defining `expected_value(**input)` that returns the expected value **in the same shape as `expected`** (a list of quantiles for a `quantiles` test, a list of statistics for `summary`, the value for `exact`/`numeric`). It must not use the method the student is asked to implement: use numerical integration or a fine grid instead of MCMC, an exact enumeration instead of a permutation sample, a closed form instead of a bootstrap. The validator checks that the reference solution agrees with the oracle within the test's tolerance. An oracle that merely calls the reference solution defeats its purpose.
- Use `"$FROM_REFERENCE"` only together with an `oracleSolution` for stochastic tests. For deterministic tests, an oracle is still strongly recommended (a brute-force version of the same quantity).

### 3.6 What code may use

`referenceSolution`, `skeleton`, `helperCode` and `oracleSolution` may import only: `numpy`, `scipy`, `math`, `random`, `statistics`, `itertools`, `functools`, `collections`, `typing`, `dataclasses`, `heapq`, `bisect`, `fractions`, `decimal`, `operator`, `copy`, `cmath`. No file or network access, no `open`, `eval`, `exec`, `getattr`, `input`, no double-underscore attributes. The validator rejects anything else before running it. Code must be deterministic given the seed and finish in a few seconds: set `timeLimitSeconds` (default 10, at most 120) for slower questions, and keep loops to roughly 50,000 iterations of cheap work.

### 3.7 Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://quantitative.local/schema/coding.schema.json",
  "title": "Big Exam: coding part (content/exams/<topic-id>.coding.json)",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "topicId",
    "title",
    "totalMarks",
    "instructions",
    "questions"
  ],
  "definitions": {
    "compare": {
      "description": "how a test case compares the main function's output with `expected`",
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "type"
          ],
          "properties": {
            "type": {
              "const": "exact"
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "type"
          ],
          "properties": {
            "type": {
              "const": "numeric"
            },
            "abs": {
              "type": "number",
              "minimum": 0
            },
            "rel": {
              "type": "number",
              "minimum": 0
            }
          },
          "anyOf": [
            {
              "required": [
                "abs"
              ]
            },
            {
              "required": [
                "rel"
              ]
            }
          ]
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "type",
            "probs"
          ],
          "properties": {
            "type": {
              "const": "quantiles"
            },
            "probs": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "number",
                "exclusiveMinimum": 0,
                "exclusiveMaximum": 1
              }
            },
            "abs": {
              "type": "number",
              "minimum": 0
            },
            "rel": {
              "type": "number",
              "minimum": 0
            },
            "length": {
              "type": "integer",
              "minimum": 1,
              "description": "required length of the output array"
            }
          },
          "anyOf": [
            {
              "required": [
                "abs"
              ]
            },
            {
              "required": [
                "rel"
              ]
            }
          ]
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "type",
            "stats"
          ],
          "properties": {
            "type": {
              "const": "summary"
            },
            "stats": {
              "type": "array",
              "minItems": 1,
              "items": {
                "enum": [
                  "mean",
                  "sd",
                  "var",
                  "median",
                  "min",
                  "max"
                ]
              }
            },
            "abs": {
              "type": "number",
              "minimum": 0
            },
            "rel": {
              "type": "number",
              "minimum": 0
            },
            "length": {
              "type": "integer",
              "minimum": 1
            }
          },
          "anyOf": [
            {
              "required": [
                "abs"
              ]
            },
            {
              "required": [
                "rel"
              ]
            }
          ]
        }
      ]
    },
    "test": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "input",
        "seed",
        "compare",
        "expected"
      ],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[vh][0-9]+$",
          "description": "v1, v2 for visible tests; h1, h2 for hidden tests"
        },
        "description": {
          "type": "string"
        },
        "input": {
          "type": "object",
          "description": "keyword arguments of the main function; {\"$ndarray\": [...]} becomes a numpy array"
        },
        "seed": {
          "type": "integer",
          "minimum": 0,
          "description": "seeds random, numpy.random and the rng argument for this test"
        },
        "compare": {
          "$ref": "#/definitions/compare"
        },
        "expected": {
          "description": "exact/numeric: the value. quantiles: one value per prob. summary: one value per stat. The string \"$FROM_REFERENCE\" asks validate-exams --fill-expected to compute it."
        }
      }
    }
  },
  "properties": {
    "$schema": {
      "type": "string"
    },
    "schemaVersion": {
      "const": 1
    },
    "topicId": {
      "type": "string",
      "pattern": "^[a-z0-9]+$"
    },
    "placeholder": {
      "type": "boolean"
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "totalMarks": {
      "type": "number",
      "exclusiveMinimum": 0,
      "description": "must equal the sum of the question marks"
    },
    "instructions": {
      "type": "string",
      "minLength": 1
    },
    "questions": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "title",
          "text",
          "marks",
          "docs",
          "helperCode",
          "skeleton",
          "functions",
          "referenceSolution",
          "visibleTests",
          "hiddenTests"
        ],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^c[0-9]+$"
          },
          "title": {
            "type": "string",
            "minLength": 1
          },
          "text": {
            "type": "string",
            "minLength": 1,
            "description": "the task, Markdown + LaTeX; states every fixed constant (iterations, prior, model)"
          },
          "marks": {
            "type": "number",
            "exclusiveMinimum": 0
          },
          "docs": {
            "type": "string",
            "minLength": 1,
            "description": "notes shown beside the editor, e.g. algorithm pseudocode; Markdown + LaTeX, fenced code allowed"
          },
          "difficultyNotes": {
            "type": "string",
            "description": "author-only note on what the question tests; shown in preview mode only"
          },
          "helperCode": {
            "type": "string",
            "description": "Python run before the student's code (imports, helper functions); shown read-only"
          },
          "skeleton": {
            "type": "string",
            "minLength": 1,
            "description": "Python the student starts from, with the function stubs"
          },
          "functions": {
            "type": "array",
            "minItems": 1,
            "description": "the function(s) the student writes. Exactly one has main: true; only its output is tested.",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "name",
                "description"
              ],
              "properties": {
                "name": {
                  "type": "string",
                  "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
                },
                "main": {
                  "type": "boolean"
                },
                "description": {
                  "type": "string",
                  "minLength": 1
                }
              }
            }
          },
          "rngArg": {
            "type": "string",
            "pattern": "^[A-Za-z_][A-Za-z0-9_]*$",
            "description": "if set, the harness passes a numpy Generator seeded with the test seed under this keyword"
          },
          "timeLimitSeconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "maximum": 120
          },
          "referenceSolution": {
            "type": "string",
            "minLength": 1,
            "description": "complete working code for every function in `functions`"
          },
          "oracleSolution": {
            "type": "string",
            "description": "optional independent check: Python defining expected_value(**input) that returns the expected value some other way (e.g. numerical integration instead of MCMC)"
          },
          "visibleTests": {
            "type": "array",
            "minItems": 1,
            "items": {
              "$ref": "#/definitions/test"
            }
          },
          "hiddenTests": {
            "type": "array",
            "minItems": 1,
            "items": {
              "$ref": "#/definitions/test"
            }
          }
        }
      }
    }
  }
}
```

### 3.8 Worked example (a complete, valid coding file)

This is the Bayesian placeholder: Metropolis-Hastings for a Bernoulli probability with a truncated-normal prior. Note how it follows the rules: no data in the question; the sample `Y` is the test input; constants in `helperCode`; one tested function returning one array; `rng` seeded per test; quantile comparison with a justified tolerance and a fixed `length`; expected values left as `"$FROM_REFERENCE"` and cross-checked by a grid-based `oracleSolution` that does **not** use MCMC. (The values shown after filling are real outputs of the oracle.) **Do not reuse its content.**

```json
{
  "$schema": "./schema/coding.schema.json",
  "schemaVersion": 1,
  "topicId": "bay",
  "placeholder": true,
  "title": "PLACEHOLDER: Bayesian Statistics, coding exam",
  "totalMarks": 10,
  "instructions": "**PLACEHOLDER EXAM.** This file only proves that the pipeline works; replace it with real questions.\n\nWrite only the functions asked for. Every run is seeded, so your results are reproducible. The visible tests can be run as often as you like; the hidden tests run when you submit.",
  "questions": [
    {
      "id": "c1",
      "title": "Metropolis-Hastings for a Bernoulli probability",
      "text": "Binary data $Y_1,\\dots,Y_n$ are modelled as conditionally i.i.d. $Y_i\\mid p\\sim\\text{Bernoulli}(p)$, so\n$$f(y\\mid p)=p^{y}(1-p)^{1-y},\\qquad y\\in\\{0,1\\}.$$\nThe prior on $p$ is a normal distribution with mean $\\mu=0.5$ and standard deviation $\\sigma=0.2$ **truncated to $(0,1)$**, so that\n$$\\pi(p)\\propto \\exp\\!\\Big(-\\frac{(p-\\mu)^2}{2\\sigma^2}\\Big),\\qquad 0<p<1.$$\n\nWrite two functions.\n\n1. `log_posterior(p, Y)` returns the **unnormalised log posterior** of $p$ given the data array `Y`, and `-np.inf` when $p\\notin(0,1)$.\n2. `mh_posterior(Y, rng)` runs a **random-walk Metropolis-Hastings** chain for $p\\mid Y$ and returns **one numpy array**: the draws left after discarding the burn-in.\n\nThe constants `MU`, `SIGMA`, `STEP` (sd of the normal proposal), `P0` (starting value), `N_ITER` (iterations) and `BURN_IN` are already defined for you. The chain makes exactly `N_ITER` iterations, stores the state after every iteration (the current value if the proposal is rejected), and returns the last `N_ITER - BURN_IN` stored values. Use the generator `rng` for all randomness. Only the output of `mh_posterior` is tested, through its 5%, 50% and 95% quantiles.",
      "marks": 10,
      "docs": "**Random-walk Metropolis-Hastings.** Target density $\\tilde\\pi(p)=f(y\\mid p)\\,\\pi(p)$, known up to a constant.\n\n```\np <- P0\nfor t = 1, ..., N_ITER:\n    p* <- p + STEP * Z,   Z ~ N(0, 1)\n    u  <- Uniform(0, 1)\n    if log(u) < log pi~(p*) - log pi~(p):\n        p <- p*              # accept\n    store p                  # also when the proposal was rejected\nreturn the stored values after the first BURN_IN\n```\n\nThe proposal is symmetric, so the Hastings ratio reduces to $\\tilde\\pi(p^*)/\\tilde\\pi(p)$. Work on the log scale to avoid underflow. A proposal outside $(0,1)$ has log posterior $-\\infty$ and is always rejected.\n\nFor data $y$ with $s=\\sum y_i$ the log likelihood is $s\\log p+(n-s)\\log(1-p)$.",
      "difficultyNotes": "Placeholder. Tests whether the student can turn the model and the truncated prior into an unnormalised log posterior and write the MH loop from pseudocode.",
      "helperCode": "import numpy as np\nfrom scipy import stats\n\n# Constants fixed by the question. Do not change them.\nMU = 0.5        # prior mean (before truncation)\nSIGMA = 0.2     # prior standard deviation (before truncation)\nSTEP = 0.1      # sd of the random-walk proposal\nP0 = 0.5        # starting value of the chain\nN_ITER = 20000  # number of MH iterations\nBURN_IN = 2000  # draws discarded from the start of the chain\n",
      "skeleton": "def log_posterior(p, Y):\n    \"\"\"Unnormalised log posterior density of p given the 0/1 data Y.\n    Return -np.inf outside (0, 1).\"\"\"\n    # YOUR CODE HERE\n    raise NotImplementedError\n\n\ndef mh_posterior(Y, rng):\n    \"\"\"Random-walk Metropolis-Hastings for p | Y.\n    Return one numpy array: the N_ITER - BURN_IN draws that remain after the burn-in is discarded.\"\"\"\n    # YOUR CODE HERE\n    raise NotImplementedError\n",
      "functions": [
        {
          "name": "log_posterior",
          "description": "Unnormalised log posterior of p given Y (-inf outside (0, 1)). Helper: not tested directly."
        },
        {
          "name": "mh_posterior",
          "main": true,
          "description": "Random-walk MH; returns one array of N_ITER - BURN_IN draws. This is the tested function."
        }
      ],
      "rngArg": "rng",
      "timeLimitSeconds": 20,
      "referenceSolution": "def log_posterior(p, Y):\n    if p <= 0 or p >= 1:\n        return -np.inf\n    Y = np.asarray(Y)\n    loglik = np.sum(Y * np.log(p) + (1 - Y) * np.log(1 - p))\n    logprior = -0.5 * ((p - MU) / SIGMA) ** 2\n    return loglik + logprior\n\n\ndef mh_posterior(Y, rng):\n    p = P0\n    lp = log_posterior(p, Y)\n    draws = np.empty(N_ITER)\n    for t in range(N_ITER):\n        prop = p + STEP * rng.standard_normal()\n        lp_prop = log_posterior(prop, Y)\n        if np.log(rng.uniform()) < lp_prop - lp:\n            p, lp = prop, lp_prop\n        draws[t] = p\n    return draws[BURN_IN:]\n",
      "oracleSolution": "def expected_value(Y):\n    # independent of MCMC: normalise the posterior on a fine grid and read off the quantiles\n    Y = np.asarray(Y)\n    s, n = Y.sum(), len(Y)\n    p = np.linspace(1e-6, 1 - 1e-6, 400001)\n    logpost = s * np.log(p) + (n - s) * np.log1p(-p) - 0.5 * ((p - MU) / SIGMA) ** 2\n    w = np.exp(logpost - logpost.max())\n    cdf = np.cumsum(w)\n    cdf /= cdf[-1]\n    return [float(np.interp(q, cdf, p)) for q in (0.05, 0.5, 0.95)]\n",
      "visibleTests": [
        {
          "id": "v1",
          "description": "n = 10, 7 successes",
          "input": {
            "Y": [
              1,
              0,
              1,
              1,
              0,
              1,
              0,
              1,
              1,
              1
            ]
          },
          "seed": 11,
          "compare": {
            "type": "quantiles",
            "probs": [
              0.05,
              0.5,
              0.95
            ],
            "abs": 0.02,
            "length": 18000
          },
          "expected": [
            0.421544,
            0.620815,
            0.805641
          ]
        },
        {
          "id": "v2",
          "description": "n = 20, 4 successes",
          "input": {
            "Y": [
              0,
              0,
              1,
              0,
              0,
              0,
              1,
              0,
              0,
              0,
              0,
              1,
              0,
              0,
              0,
              0,
              0,
              1,
              0,
              0
            ]
          },
          "seed": 12,
          "compare": {
            "type": "quantiles",
            "probs": [
              0.05,
              0.5,
              0.95
            ],
            "abs": 0.02,
            "length": 18000
          },
          "expected": [
            0.135007,
            0.267967,
            0.426336
          ]
        }
      ],
      "hiddenTests": [
        {
          "id": "h1",
          "description": "n = 30, 22 successes",
          "input": {
            "Y": [
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              0,
              0,
              0,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              0,
              0,
              0,
              0,
              0
            ]
          },
          "seed": 21,
          "compare": {
            "type": "quantiles",
            "probs": [
              0.05,
              0.5,
              0.95
            ],
            "abs": 0.02,
            "length": 18000
          },
          "expected": [
            0.55844,
            0.692458,
            0.81091
          ]
        },
        {
          "id": "h2",
          "description": "n = 8, 1 success",
          "input": {
            "Y": [
              0,
              0,
              0,
              0,
              1,
              0,
              0,
              0
            ]
          },
          "seed": 22,
          "compare": {
            "type": "quantiles",
            "probs": [
              0.05,
              0.5,
              0.95
            ],
            "abs": 0.02,
            "length": 18000
          },
          "expected": [
            0.093169,
            0.279807,
            0.500396
          ]
        },
        {
          "id": "h3",
          "description": "n = 12, all successes: pushes the posterior towards the boundary",
          "input": {
            "Y": [
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1
            ]
          },
          "seed": 23,
          "compare": {
            "type": "quantiles",
            "probs": [
              0.05,
              0.5,
              0.95
            ],
            "abs": 0.02,
            "length": 18000
          },
          "expected": [
            0.688964,
            0.888565,
            0.989406
          ]
        }
      ]
    }
  ]
}
```

---

## 4. Topic guidance

Each topic needs, in the coding file, 3 or 4 questions that suit it, and in the written file questions that follow its syllabus. The lists below are the kinds of question that fit; choose and adapt them to the pasted outline, and drop any that the outline does not cover.

### 4.1 `bay`: Bayesian Statistics

Coding question types: posterior sampling (random-walk Metropolis-Hastings for a 1-D parameter with a non-conjugate or truncated prior; Gibbs sampler for a two-block model such as normal mean and variance; importance sampling or rejection sampling for a posterior mean), conjugate updates (Beta-Binomial, Gamma-Poisson, Normal-Normal: return posterior parameters or a credible interval), Bayes estimates and posterior summaries, posterior predictive probabilities, Bayes factors by numerical integration. Stochastic tests (`quantiles`, `summary`) for sampling questions; `numeric` for conjugate updates and posterior summaries.
Written question types: derive a posterior (conjugacy), Bayes estimator under a loss, credible versus confidence interval, prior sensitivity, Jeffreys prior, posterior consistency, exchangeability, Markov-chain properties of MH (detailed balance proof), Gibbs conditionals.

### 4.2 `inf`: Statistical Inference

Coding question types: maximum likelihood estimation (closed form or by a short numerical search; return the estimate), Bayes risk computation for a decision rule under a loss (sum or integrate the risk over a prior), likelihood ratio tests (statistic and decision at a given level using the chi-squared limit), Fisher information and standard errors, confidence intervals (exact or asymptotic), method of moments. Mostly deterministic comparison (`numeric` or `exact`); use stochastic comparison only for a bootstrap or simulation question.
Written question types: sufficiency and factorisation, completeness and UMVUE (Rao-Blackwell, Lehmann-Scheffé), Cramér-Rao bound, MLE properties and asymptotics, Neyman-Pearson and UMP tests, likelihood ratio test and Wilks' theorem, decision theory (risk, Bayes and minimax rules), confidence intervals by pivots.

### 4.3 `np`: Nonparametric Statistics

Coding question types: rank statistics (Wilcoxon rank-sum or signed-rank statistic, with ties handled by average ranks; Kendall's tau or Spearman's rho), permutation tests (the permutation distribution of a statistic: use a fixed number of seeded permutations, compare the p-value or summary of the returned array of permuted statistics), the bootstrap (percentile interval or standard error from a fixed number of resamples), kernel density estimation (evaluate a KDE with a given kernel and bandwidth at given points: deterministic, `numeric`), empirical CDF and the Kolmogorov-Smirnov statistic (deterministic), sign test counts. Use `exact` for rank and count statistics, `numeric` for KDE and KS values, `quantiles` or `summary` for permutation and bootstrap arrays.
Written question types: exact null distribution of rank statistics (mean and variance proofs), distribution-free property of the sign and rank tests, Pitman efficiency or power comparisons, consistency of the empirical CDF (Glivenko-Cantelli statement and DKW use), bias and variance of a kernel density estimator, bandwidth choice trade-off, bootstrap validity and failure cases.

### 4.4 Any other topic (phase 2): how to adapt

When the topic is not one of the three above, build the paper from its pasted outline in this order:

1. List the lectures and, for each, its 2 or 3 central results (the theorems the lecturer proves, the algorithms the lecturer states).
2. **Written part:** make each question cover a block of 2 or 3 consecutive lectures, with parts that move from definition to derivation to proof to a short interpretation. Take the proofs from the central results, varied enough that the student must reason rather than recall. Cover the whole syllabus across 4 or 5 questions.
3. **Coding part (only if the topic has a meaningful algorithm to implement):** pick the 3 or 4 central algorithms or estimators in the outline that have a clear pseudocode (an iterative method, an estimator, a test statistic, a simulation scheme, a pricing or risk routine). Give each a question in the format of section 3: fixed constants stated, model given, no data, one main function, deterministic output compared exactly or numerically when possible, seeded simulation compared through quantiles or summaries when not.
4. If the topic has **no meaningful coding part** (for example a purely conceptual or institutional topic), say so at the top of your answer and produce the written file only. The student will then set 100% weight on the written part for that topic.
5. Follow every rule in sections 2 and 3 unchanged.

---

## 5. Self-check: do all of this before you answer

Go through the list and fix every problem silently. Then, at the very end of your answer (outside the JSON blocks), print the checklist with a one-word result for each item (`done` / `fixed` / `n/a`) and list anything you are not sure about.

**Mathematics**
- [ ] Every model answer is mathematically correct. Re-derive each one independently; re-do every numerical value with a second method.
- [ ] Every final number quoted in a model answer or a marking scheme matches the number in the question.
- [ ] Every proof is complete, and uses only results available at that point in the syllabus (or stated in the question).
- [ ] Each question is answerable by hand, without code, in a reasonable time, and the whole paper fits about 2 hours.

**Marks**
- [ ] For every part: the marking-scheme steps add up to the part's marks.
- [ ] For every question: the part marks add up to the question's marks.
- [ ] `totalMarks` equals the sum of the question marks (written and coding separately).
- [ ] All marks are multiples of 0.5.

**Written format**
- [ ] Ids are `q1`, `q2`, ... and `a`, `b`, `c`, ... with no duplicates; `topicId` equals the file-name prefix.
- [ ] Every formula is KaTeX-compatible, `$` signs are balanced, macros come only from the `preamble`.
- [ ] No `eqnarray`, `multline`, `\\label`, `\\ref`, `\\href`, packages or HTML.

**Coding**
- [ ] No data sample appears in any question text; data are test inputs only.
- [ ] Exactly one function per question has `"main": true`; all constants are stated in the text and defined in `helperCode`.
- [ ] The reference solution defines every function in `functions`, imports only allowed modules, and, traced by hand on at least one visible test, returns the expected value.
- [ ] For every test: `input` keys equal the main function's parameter names (excluding `rngArg`); the output type matches the `compare` type; `expected` has one value per `probs` or `stats` entry.
- [ ] Every stochastic tolerance is at least 5 Monte Carlo standard errors (state your ESS and standard-error estimate in your closing notes), and every stochastic test has a `length`.
- [ ] Every `"$FROM_REFERENCE"` test is covered by an `oracleSolution` that does not use the method being tested; the student is told to run `--fill-expected`.
- [ ] 2 or 3 visible and 3 to 5 hidden tests per question; hidden tests use different inputs and include edge cases.
- [ ] The untouched skeleton passes no test (it raises `NotImplementedError`).

**JSON**
- [ ] Each file is valid JSON: backslashes doubled, no raw newlines in strings, no trailing commas, no comments.
- [ ] Each file validates against the schema in section 2.5 or 3.7 (no extra properties, required fields present).
- [ ] The file names are exactly `<topic-id>.written.json` and `<topic-id>.coding.json`.

---

## 6. After you answer (instructions for the student, not for you)

1. Save each block as `content/exams/<id>.written.json` / `<id>.coding.json`.
2. Run `npm run validate-exams -- --fill-expected` once (fills any `"$FROM_REFERENCE"` values), then `npm run validate-exams`. It must end with `0 error(s)`. Errors name the file, question and test.
3. Preview the exam as a student sees it at `#/exam-preview` in the app (also works for topics whose phase is not switched on yet).
4. Read the model answers and the reference solutions yourself: the validator proves the code agrees with the tests, not that the mathematics is what the lecturer taught.
5. Remove `"placeholder": true` from the files you replaced (real files do not carry it).

---

## 7. Your assignment

Topic id(s) to write: `<<<TOPIC IDS, e.g. bay>>>`
Written-only topics (no coding file): `<<<NONE, or list ids>>>`
Extra instructions from the student: `<<<OPTIONAL>>>`
