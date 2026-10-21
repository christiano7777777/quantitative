// Short typed questions for lecture 3 (Mathematical typesetting II): render mode for matrices, cases and aligned
// displays, tokens mode for theorem environments and equation numbering.
import { BOX } from '../../../shared/typed'
import type { BlankQuestion } from '../../../../lib/types'

const ask = 'Type the code for this formula (with or without `\\[ \\]`).'

export const blanksLec3: BlankQuestion[] = [
  {
    id: 'latex-3-01', lecture: 3, kind: 'picture', prompt: 'An identity matrix. ' + ask,
    picture: '\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}',
    blank: {
      mode: 'render', key: '\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}',
      traps: [{ text: '\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}', misconception: 'pmatrix draws round brackets; square ones are bmatrix' }],
    },
    explanation: 'The matrix environments differ only in their brackets: `pmatrix` ( ), `bmatrix` [ ], `vmatrix` | |.',
  },
  {
    id: 'latex-3-02', lecture: 3, kind: 'picture', prompt: 'A determinant. ' + ask,
    picture: '\\det A = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
    blank: {
      mode: 'render', key: '\\det A = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
      traps: [
        { text: '\\det A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', misconception: 'a determinant is drawn with vertical bars: vmatrix' },
        { text: 'det A = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', misconception: 'det is an operator name: \\det' },
      ],
    },
    explanation: '`vmatrix` draws the bars; `\\det` sets the operator name upright.',
  },
  {
    id: 'latex-3-03', lecture: 3, kind: 'picture', prompt: 'The absolute value, defined piece by piece. ' + ask,
    picture: '|x| = \\begin{cases} x & \\text{if } x \\ge 0 \\\\ -x & \\text{otherwise} \\end{cases}',
    blank: {
      mode: 'render', key: '|x| = \\begin{cases} x & \\text{if } x \\ge 0 \\\\ -x & \\text{otherwise} \\end{cases}',
      traps: [{ text: '|x| = \\begin{cases} x & \\text{if } x \\ge 0 \\\\ -x & otherwise \\end{cases}', misconception: 'a word in maths needs \\text, otherwise it is a string of italic variables' }],
    },
    explanation: '`cases` takes one line per piece: value, `&`, condition. Words go in `\\text{...}`.',
  },
  {
    id: 'latex-3-04', lecture: 3, kind: 'picture', prompt: 'A general matrix. ' + ask,
    picture: '\\begin{pmatrix} a_{11} & \\cdots & a_{1n} \\\\ \\vdots & \\ddots & \\vdots \\\\ a_{m1} & \\cdots & a_{mn} \\end{pmatrix}',
    blank: {
      mode: 'render', key: '\\begin{pmatrix} a_{11} & \\cdots & a_{1n} \\\\ \\vdots & \\ddots & \\vdots \\\\ a_{m1} & \\cdots & a_{mn} \\end{pmatrix}',
      traps: [{ text: '\\begin{pmatrix} a_{11} & \\ldots & a_{1n} \\\\ \\vdots & \\ddots & \\vdots \\\\ a_{m1} & \\ldots & a_{mn} \\end{pmatrix}', misconception: '\\ldots sits on the baseline; between matrix entries the dots are centred, \\cdots' }],
    },
    explanation: 'Horizontal `\\cdots`, vertical `\\vdots` and diagonal `\\ddots` fill the gaps of a general matrix.',
  },
  {
    id: 'latex-3-05', lecture: 3, kind: 'picture', prompt: 'A short derivation. ' + ask,
    picture: '\\begin{aligned} a &= b + c \\\\ &= d \\end{aligned}',
    blank: {
      mode: 'render', key: '\\begin{aligned} a &= b + c \\\\ &= d \\end{aligned}', accept: ['\\begin{align*} a &= b + c \\\\ &= d \\end{align*}'],
      traps: [
        { text: '\\begin{aligned} a = b + c \\\\ = d \\end{aligned}', misconception: 'without & the equals signs are not aligned' },
        { text: '\\begin{aligned} a =& b + c \\\\ =& d \\end{aligned}', misconception: 'the & goes before the =, so the = keeps its spacing as a relation' },
      ],
    },
    explanation: 'Put `&` just before each `=` and end every line but the last with `\\\\`.',
  },
  {
    id: 'latex-3-06', lecture: 3, kind: 'name',
    prompt: 'Which package provides `\\theoremstyle` and the `proof` environment?',
    template: '\\usepackage{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'amsthm',
      traps: [{ text: 'amsmath', misconception: 'amsmath is for displayed maths; theorem tools are in amsthm' }],
    },
    explanation: '`amsthm` extends `\\newtheorem` with styles and adds `proof`.',
  },
  {
    id: 'latex-3-07', lecture: 3, kind: 'template',
    prompt: 'Define a remark environment whose results are not numbered.',
    template: BOX + '{remark}{Remark}',
    blank: {
      mode: 'tokens', key: '\\newtheorem*',
      traps: [{ text: '\\newtheorem', misconception: 'without the star the remarks are numbered' }],
    },
    explanation: 'The starred `\\newtheorem*` (amsthm) defines an unnumbered environment.',
  },
  {
    id: 'latex-3-08', lecture: 3, kind: 'template',
    prompt: 'Theorems are the environment thm. Lemmas should share their counter (Theorem 1, Lemma 2, Theorem 3).',
    template: '\\newtheorem{lemma}' + BOX + '{Lemma}',
    blank: {
      mode: 'tokens', key: '[thm]',
      traps: [
        { text: '[section]', misconception: 'this would share the section counter, not the one of theorems' },
        { text: '{thm}', misconception: 'the shared counter is an optional argument, in square brackets between the two braces' },
      ],
    },
    explanation: 'The optional argument between the braces names an existing counter to share.',
  },
  {
    id: 'latex-3-09', lecture: 3, kind: 'template',
    prompt: 'Definitions should be set in upright text, not in italics.',
    template: '\\theoremstyle{' + BOX + '}\n\\newtheorem{defn}{Definition}',
    blank: {
      mode: 'tokens', key: 'definition',
      traps: [{ text: 'plain', misconception: 'plain (the default) sets the body in italics' }],
    },
    explanation: 'amsthm has three styles: `plain` (italic body), `definition` (upright body) and `remark` (upright, lighter heading).',
  },
  {
    id: 'latex-3-10', lecture: 3, kind: 'template',
    prompt: 'Display one formula, numbered, so that the text can refer to it.',
    template: '\\begin{' + BOX + '}\n  P = \\sum_{t} c_t e^{-rt}\n\\end{...}',
    blank: {
      mode: 'tokens', key: 'equation',
      traps: [
        { text: 'equation*', misconception: 'the star removes the number' },
        { text: 'displaymath', misconception: 'displaymath is unnumbered' },
      ],
    },
    explanation: '`equation` numbers its display; `equation*` and `\\[ \\]` do not.',
  },
  {
    id: 'latex-3-11', lecture: 3, kind: 'template',
    prompt: 'In an align environment, stop the first line from getting a number.',
    template: '\\begin{align}\n  y &= a + b ' + BOX + ' \\\\\n    &= c\n\\end{align}',
    blank: {
      mode: 'tokens', key: '\\nonumber', accept: ['\\notag'],
      traps: [{ text: '*', misconception: 'a star belongs to the environment name (align*) and would remove every number' }],
    },
    explanation: '`\\nonumber` (or `\\notag`) on a line suppresses that line\'s number only.',
  },
  {
    id: 'latex-3-12', lecture: 3, kind: 'fix',
    prompt: 'This display does not compile: "\\begin{align} ended by \\end{aligned}". Type the corrected last line.',
    broken: '\\begin{align}\n  x &= 1 \\\\\n  y &= 2\n\\end{aligned}',
    blank: {
      mode: 'tokens', key: '\\end{align}',
      traps: [{ text: '\\end{aligned}', misconception: 'every \\begin needs an \\end with the same name' }],
    },
    explanation: 'Environments must be closed by the same name they were opened with.',
  },
]
