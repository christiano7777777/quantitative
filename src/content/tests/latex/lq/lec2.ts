// LQ for lecture 2 (Mathematical typesetting I). One story: the formulas of a short results section arrive as pictures and
// the student types the code for each. Six parts in the order of the lesson: sub- and superscripts, a fraction with Greek
// letters, a sum with limits, a root over a whole expression, an operator name, growing brackets. Every part is graded in
// render mode, so any code that draws the same formula is right. Parts do not depend on each other.
// Lecture 2.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { typed } from '../../../shared/typed'

export interface Params {
  topic: string
  v: string // variable letter
  i: string // index letter
  e: number // two-digit exponent
  g1: string // Greek numerator
  g2: string // Greek denominator
  c: number // constant added in the denominator
  k: string // summation index
  top: string // upper limit
  w: [string, string] // the two letters multiplied in the sum
  a: string
  b: string // the two squared letters under the root
  fn: 'ln' | 'log' | 'exp' | 'sin' | 'cos'
  r: string // argument letter of the function
  p: string
  q: string // fraction inside the brackets
  pow: number // power of the bracket
}

const TOPICS = ['portfolio returns', 'a pricing model', 'a sampling experiment', 'an asset-allocation backtest', 'a volatility forecast']
const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'lambda', 'mu', 'sigma', 'theta', 'rho', 'kappa']

export function sample(rng: Rng): Params {
  for (;;) {
    const [v, a, b, p, q] = rng.sample(['x', 'y', 'z', 'u', 'a', 'b', 'c', 's'], 5)
    const [g1, g2] = rng.sample(GREEK, 2)
    const w = rng.sample(['w', 'x', 'p', 'r', 'q'], 2) as [string, string]
    const params: Params = {
      topic: rng.pick(TOPICS), v, i: rng.pick(['t', 'i', 'k', 'n']), e: rng.pick([10, 11, 12, 13, 14, 15, 16, 20, 21, 32]),
      g1, g2, c: rng.pick([2, 3, 4, 5, 7, 9]), k: rng.pick(['i', 'j', 'k']), top: rng.pick(['n', 'N', 'm', 'T']), w,
      a, b, fn: rng.pick(['ln', 'log', 'exp', 'sin', 'cos'] as const), r: rng.pick(['r', 'x', 't', 'h']), p, q, pow: rng.pick([2, 3, 4]),
    }
    // the index of the sum must differ from the letters it multiplies, so the picture is not ambiguous
    if (params.w.includes(params.k) || params.top === params.k) continue
    return params
  }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

export function keys(P: Params): PartKey[] {
  const sumBody = `${P.w[0]}_{${P.k}} ${P.w[1]}_{${P.k}}`
  return [
    {
      key: `${P.v}_{${P.i}}^{${P.e}}`,
      traps: [
        { text: `${P.v}_${P.i}^${P.e}`, misconception: `without braces only the first digit is raised: ^${P.e} reads ^${String(P.e)[0]} then ${String(P.e)[1]}` },
        { text: `${P.v}_{${P.i}^{${P.e}}}`, misconception: 'this puts the power on the index, not on the variable' },
      ],
    },
    {
      key: `\\frac{\\${P.g1}}{\\${P.g2} + ${P.c}}`,
      traps: [
        { text: `\\frac\\${P.g1}\\${P.g2} + ${P.c}`, misconception: 'without braces \\frac takes one token each, so only the Greek letter is in the denominator' },
        { text: `\\frac{${P.g1}}{${P.g2} + ${P.c}}`, misconception: 'Greek letters need a backslash; without it you get the Latin letters of the name' },
        { text: `\\${P.g1}/(\\${P.g2} + ${P.c})`, misconception: 'a slash gives an inline fraction, not the stacked one in the picture' },
      ],
    },
    {
      key: `\\sum_{${P.k}=1}^{${P.top}} ${sumBody}`,
      traps: [
        { text: `\\Sigma_{${P.k}=1}^{${P.top}} ${sumBody}`, misconception: '\\Sigma is the capital letter; the summation sign with limits is \\sum' },
        { text: `\\sum_${P.k}=1^${P.top} ${sumBody}`, misconception: 'without braces the lower limit is only the index letter; =1 falls out of it' },
      ],
    },
    {
      key: `\\sqrt{${P.a}^{2} + ${P.b}^{2}}`,
      traps: [
        { text: `\\sqrt{${P.a}^2} + ${P.b}^2`, misconception: 'the root covers only what is inside its braces' },
        { text: `\\sqrt(${P.a}^2 + ${P.b}^2)`, misconception: '\\sqrt takes its argument in braces; round brackets are printed and only ( is under the root' },
      ],
    },
    {
      key: `\\${P.fn}(1 + ${P.r}_{${P.i}})`,
      traps: [
        { text: `${P.fn}(1 + ${P.r}_{${P.i}})`, misconception: `without a backslash the letters ${P.fn} are a product of variables, set in italics` },
        { text: `\\text{${P.fn}}(1 + ${P.r}_{${P.i}})`, misconception: `\\text gives upright letters but not the spacing of an operator name; use \\${P.fn}` },
      ],
    },
    {
      key: `\\left(\\frac{${P.p}}{${P.q}}\\right)^{${P.pow}}`,
      traps: [
        { text: `(\\frac{${P.p}}{${P.q}})^{${P.pow}}`, misconception: 'plain brackets keep their text size; \\left( and \\right) grow with the fraction' },
        { text: `\\left(\\frac{${P.p}}{${P.q}}\\right)`, misconception: `the power ${P.pow} is part of the formula` },
      ],
    },
  ]
}

const PROMPTS = [
  'The first term in the text. Type the code for this formula.',
  'A ratio from the model section. Type the code for this formula.',
  'The weighted total in the display. Type the code for this formula.',
  'A length in the robustness check. Type the code for this formula.',
  'A transformed rate in the text. Type the code for this formula.',
  'The squared ratio in the final display. Type the code for this formula.',
]

const WORKING = [
  'Subscript with `_`, superscript with `^`. Each takes one token, so a two-digit power needs braces: `^{..}`. The order of `_` and `^` does not matter.',
  'A stacked fraction is `\\frac{numerator}{denominator}`, and Greek letters are commands such as `\\lambda`. The whole denominator goes inside the second pair of braces.',
  'The summation sign is `\\sum`; its limits are a subscript and a superscript. The lower limit has three tokens, so it needs braces.',
  '`\\sqrt{...}` covers exactly its braced argument, so the whole sum goes inside the braces.',
  'Function names are commands (`\\ln`, `\\log`, `\\exp`, `\\sin`, `\\cos`): upright, with operator spacing.',
  '`\\left(` and `\\right)` make the brackets as tall as what they enclose; the power goes after `\\right)`.',
]

export function build(P: Params): LQInstance {
  const ks = keys(P)
  return {
    intro: 'You are writing the results section of a short note on ' + P.topic + '. Your co-author sent each formula as a picture. ' +
      'Type the LaTeX code for each one: the maths only, with or without the surrounding `$` signs.',
    parts: ks.map((k, n) => typed({
      prompt: PROMPTS[n], lecture: 2,
      explanation: WORKING[n] + ' One right answer: `' + k.key + '`.',
      view: { kind: 'picture', picture: k.key },
      blank: { mode: 'render', key: k.key, accept: k.accept, traps: k.traps },
    })),
  }
}

export const genLec2: LQGenerator = { id: 'latex-lq-2', generate: (rng) => build(sample(rng)) }
