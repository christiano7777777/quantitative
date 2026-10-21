// Short typed questions for lecture 2 (Mathematical typesetting I). All in render mode: any code that draws the same
// formula is right. Prompts never show the formula as KaTeX text, only as a picture.
import type { BlankQuestion } from '../../../../lib/types'

const ask = 'Type the code for this formula (with or without the surrounding `$` signs).'

export const blanksLec2: BlankQuestion[] = [
  {
    id: 'latex-2-01', lecture: 2, kind: 'picture', prompt: 'A decay factor. ' + ask, picture: 'e^{-\\lambda t}',
    blank: {
      mode: 'render', key: 'e^{-\\lambda t}',
      traps: [
        { text: 'e^-\\lambda t', misconception: 'without braces only the minus sign is raised' },
        { text: 'e^{-lambda t}', misconception: 'without a backslash lambda is six italic letters' },
      ],
    },
    explanation: 'The whole exponent goes in braces after `^`, and the Greek letter is the command `\\lambda`.',
  },
  {
    id: 'latex-2-02', lecture: 2, kind: 'picture', prompt: 'An estimated coefficient. ' + ask, picture: '\\hat{\\beta}_{1}',
    blank: {
      mode: 'render', key: '\\hat{\\beta}_{1}',
      traps: [
        { text: '\\hat{\\beta_1}', misconception: 'this puts the hat over the subscript as well' },
        { text: '\\beta_1', misconception: 'the hat accent is part of the symbol' },
      ],
    },
    explanation: 'The accent `\\hat{...}` covers only what is in its braces; the subscript comes after it.',
  },
  {
    id: 'latex-2-03', lecture: 2, kind: 'picture', prompt: 'A condition in a proof. ' + ask, picture: 'a \\neq b',
    blank: {
      mode: 'render', key: 'a \\neq b', accept: [],
      traps: [
        { text: 'a != b', misconception: 'the programming operator prints as an exclamation mark and an equals sign' },
        { text: 'a =/= b', misconception: 'there is a dedicated symbol, \\neq (or \\ne)' },
      ],
    },
    explanation: '"Not equal" is `\\neq` (or `\\ne`); both draw the same symbol.',
  },
  {
    id: 'latex-2-04', lecture: 2, kind: 'picture', prompt: 'An expectation. ' + ask, picture: '\\mathbb{E}[X]',
    blank: {
      mode: 'render', key: '\\mathbb{E}[X]',
      traps: [
        { text: 'E[X]', misconception: 'an italic E is a variable; the expectation symbol in this note is blackboard bold' },
        { text: '\\mathbf{E}[X]', misconception: '\\mathbf is bold, not blackboard bold' },
      ],
    },
    explanation: 'Blackboard bold letters come from `\\mathbb{...}` (amssymb or amsfonts in a real document).',
  },
  {
    id: 'latex-2-05', lecture: 2, kind: 'picture', prompt: 'A geometric series. ' + ask, picture: '\\sum_{k=0}^{\\infty} q^{k}',
    blank: {
      mode: 'render', key: '\\sum_{k=0}^{\\infty} q^{k}',
      traps: [
        { text: '\\sum_{k=0}^{infty} q^{k}', misconception: 'infinity is the command \\infty' },
        { text: '\\sum_k=0^\\infty q^k', misconception: 'the lower limit k=0 has three tokens and needs braces' },
      ],
    },
    explanation: 'Limits of `\\sum` are a subscript and a superscript; infinity is `\\infty`.',
  },
  {
    id: 'latex-2-06', lecture: 2, kind: 'fix',
    prompt: 'This line does not compile. Type the corrected formula (it should draw the length of the vector $(x, y)$).',
    broken: '\\sqrt{x^2 + y^2',
    blank: {
      mode: 'render', key: '\\sqrt{x^2 + y^2}',
      traps: [{ text: '\\sqrt{x^2} + y^2', misconception: 'closing the brace early leaves y^2 outside the root' }],
    },
    explanation: 'Every `{` needs its `}`. The closing brace goes after the whole radicand.',
  },
  {
    id: 'latex-2-07', lecture: 2, kind: 'picture', prompt: 'The range of a probability. ' + ask, picture: '0 \\le p \\le 1',
    blank: {
      mode: 'render', key: '0 \\le p \\le 1', accept: [],
      traps: [{ text: '0 <= p <= 1', misconception: 'typed <= prints two symbols; use \\le (or \\leq)' }],
    },
    explanation: '"Less than or equal" is `\\le` or `\\leq`; the grader accepts either because they draw the same symbol.',
  },
  {
    id: 'latex-2-08', lecture: 2, kind: 'picture', prompt: 'A vector space. ' + ask, picture: 'x \\in \\mathbb{R}^{n}',
    blank: {
      mode: 'render', key: 'x \\in \\mathbb{R}^{n}',
      traps: [
        { text: 'x \\in R^n', misconception: 'an italic R is a variable; the real numbers are blackboard bold' },
        { text: 'x in \\mathbb{R}^n', misconception: '"in" without a backslash is the two letters i and n' },
      ],
    },
    explanation: 'Membership is `\\in`; the reals are `\\mathbb{R}`.',
  },
  {
    id: 'latex-2-09', lecture: 2, kind: 'picture', prompt: 'A partial derivative. ' + ask, picture: '\\frac{\\partial f}{\\partial x}',
    blank: {
      mode: 'render', key: '\\frac{\\partial f}{\\partial x}',
      traps: [
        { text: '\\frac{df}{dx}', misconception: 'd is the ordinary derivative; the curly symbol is \\partial' },
        { text: '\\partial f / \\partial x', misconception: 'a slash gives an inline fraction, not the stacked one in the picture' },
      ],
    },
    explanation: 'The curly d is `\\partial`; the stacked fraction is `\\frac{...}{...}`.',
  },
  {
    id: 'latex-2-10', lecture: 2, kind: 'picture', prompt: 'A confidence band. ' + ask, picture: '\\bar{x} \\pm 2\\sigma',
    blank: {
      mode: 'render', key: '\\bar{x} \\pm 2\\sigma',
      traps: [
        { text: '\\bar{x} +- 2\\sigma', misconception: 'plus-minus is one symbol, \\pm' },
        { text: '\\overline{x} \\pm 2\\sigma', misconception: '\\overline draws a longer bar than the accent \\bar' },
      ],
    },
    explanation: 'The mean accent is `\\bar{x}` and plus-minus is `\\pm`.',
  },
  {
    id: 'latex-2-11', lecture: 2, kind: 'picture', prompt: 'A variance. ' + ask, picture: '\\operatorname{Var}(X)',
    blank: {
      mode: 'render', key: '\\operatorname{Var}(X)', accept: ['\\mathrm{Var}(X)'],
      traps: [{ text: 'Var(X)', misconception: 'typed letters are italic variables V, a and r multiplied together' }],
    },
    explanation: 'A name without its own command is set upright with `\\operatorname{Var}` (amsmath); `\\mathrm{Var}` also looks right here.',
  },
  {
    id: 'latex-2-12', lecture: 2, kind: 'picture', prompt: 'A sum written out. ' + ask, picture: 'x_1 + \\cdots + x_n',
    blank: {
      mode: 'render', key: 'x_1 + \\cdots + x_n',
      traps: [{ text: 'x_1 + ... + x_n', misconception: 'three full stops sit on the baseline and are spaced like punctuation; between + signs use \\cdots' }],
    },
    explanation: 'Centred dots between operators are `\\cdots`; low dots (`\\ldots`) belong between commas.',
  },
]
