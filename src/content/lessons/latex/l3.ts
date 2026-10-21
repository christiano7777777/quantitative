// Lesson for lecture 3 (Mathematical typesetting II). Verbatim format. Order of the long question: matrices, cases,
// aligned derivations, then theorem environments and proofs.
import type { Lesson } from '../../../lib/types'

export const lessonLec3: Lesson = {
  verbatim: true,
  teach: [
    'You are typesetting the model section of a paper. Single formulas were lecture 2. Here the formulas have structure on two dimensions (matrices, piecewise definitions, derivations over several lines), and the results get their own numbered environments: lemmas, propositions and their proofs. All of it comes from two packages: amsmath for the displays and amsthm for the results.',
    '## Matrices',
    'amsmath has one matrix environment per kind of bracket: `pmatrix` ( ), `bmatrix` [ ], `Bmatrix` { }, `vmatrix` | | for determinants, `Vmatrix` ‖ ‖ for norms, and plain `matrix` with no brackets. Inside, `&` separates the entries of a row and `\\\\` ends a row. `\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}` gives $\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$. For a general matrix, fill the gaps with `\\cdots`, `\\vdots` and `\\ddots`.',
    '## Piecewise definitions',
    'The `cases` environment draws the left brace and lines up two columns: each line is a value, `&`, then its condition. Words in a condition are text, so they go in `\\text{...}`, including their spaces:',
    '```latex\nf(x) = \\begin{cases} 0 & \\text{if } x < 0 \\\\ x^{2} & \\text{if } x \\ge 0 \\end{cases}\n```',
    'which gives $f(x) = \\begin{cases} 0 & \\text{if } x < 0 \\\\ x^{2} & \\text{if } x \\ge 0 \\end{cases}$. Without `\\text`, "if" would be the italic variables $i$ and $f$.',
    '## Derivations over several lines',
    'A display that spans lines with the relations under each other uses an alignment. As a whole display, `align*` (unnumbered) or `align` (every line numbered) does it. Inside another display, use `aligned`. In every line, `&` marks the alignment point, usually right before the `=`, and `\\\\` ends each line except the last:',
    '```latex\n\\begin{align*}\n  f(x) &= (x + 3)^{2} \\\\\n       &= x^{2} + 6x + 9\n\\end{align*}\n```',
    'Put the `&` before the relation, not after it: `&=` keeps the spacing of the equals sign. In a numbered `align`, `\\nonumber` (or `\\notag`) on a line removes the number of that line only. A single numbered equation is `equation`, and `equation*` or `\\[ \\]` is unnumbered. Never use the old `eqnarray`: it spaces the relations badly.',
    '## Theorem-like environments',
    'In the preamble, `\\newtheorem{lemma}{Lemma}` defines an environment called `lemma` that prints "Lemma 1", "Lemma 2", and so on. The first argument is the name you use in `\\begin{...}`, and the second is the heading that is printed. An optional argument at the end, `\\newtheorem{lemma}{Lemma}[section]`, numbers within sections (Lemma 2.1). An optional argument between the braces, `\\newtheorem{lemma}[theorem]{Lemma}`, makes lemmas share the counter of theorems. The starred `\\newtheorem*` (amsthm) gives an unnumbered environment such as a remark.',
    'amsthm also offers three styles, chosen with `\\theoremstyle{...}` before the definitions that should use it: `plain` (italic body, for theorems and lemmas), `definition` (upright body) and `remark`. When you use an environment, an optional title goes in square brackets: `\\begin{lemma}[Unbiasedness]` prints "Lemma 1 (Unbiasedness)."',
    '## Proofs',
    'The `proof` environment from amsthm prints "Proof." in italics and ends with a small box. Its optional argument replaces the heading: `\\begin{proof}[Sketch of proof]`. It is not numbered, so it needs no `\\newtheorem`.',
    '## How to work the whole problem',
    'For a picture, first name the structure: round brackets mean `pmatrix`, a left brace with conditions means `cases`, relations stacked under each other mean `aligned` (or `align*`). Write the environment with its `\\begin` and `\\end`, then fill it row by row with `&` between entries and `\\\\` between rows. For a result, write the `\\newtheorem` line from the environment name, the printed heading and the numbering asked for. Then open it with the name and a bracketed title, and follow it with `proof`.',
    '## Typical mistakes',
    'Using the wrong bracket environment, for example `bmatrix` for round brackets. Forgetting `\\\\` between rows, so that the matrix becomes one row. Leaving out `&` in `cases` or `aligned`, or writing `=&` instead of `&=`. Writing words in maths without `\\text`. Using `align` when no numbers are wanted. Swapping the two arguments of `\\newtheorem`, or putting `[section]` between them. Giving an optional title in braces. Closing an environment with a different name than it was opened with.',
  ],
  samples: [{ workedSeed: 'latex-3-worked', lqId: 'latex-lq-3' }],
  practice: [
    { prompt: 'A rotation matrix.', blank: { mode: 'render', key: '\\begin{pmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{pmatrix}' } },
    { prompt: 'A step function.', blank: { mode: 'render', key: 'H(x) = \\begin{cases} 0 & \\text{if } x < 0 \\\\ 1 & \\text{if } x \\ge 0 \\end{cases}' } },
  ],
}
