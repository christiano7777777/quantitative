// LQ-D: Spearman's rho, Kendall's tau and Pearson's r for six pairs of observations.
// Lecture 6 (rank correlation).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { x: number[]; y: number[] }

export function sample(rng: Rng): Params {
  const x = rng.sample(Array.from({ length: 40 }, (_, i) => i + 1), 6)
  const y = rng.sample(Array.from({ length: 40 }, (_, i) => i + 1), 6)
  return { x, y }
}

const ranks = (v: number[]) => v.map((a) => v.filter((b) => b < a).length + 1)

export function build({ x, y }: Params): LQInstance {
  const n = 6
  const rx = ranks(x), ry = ranks(y)
  const d2 = rx.reduce((a, r, i) => a + (r - ry[i]) ** 2, 0)
  const rho = 1 - (6 * d2) / (n * (n * n - 1))
  let C = 0, D = 0
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const s = (x[i] - x[j]) * (y[i] - y[j]); if (s > 0) C++; else D++ }
  const tau = (C - D) / ((n * (n - 1)) / 2)
  const mx = x.reduce((a, v) => a + v, 0) / n, my = y.reduce((a, v) => a + v, 0) / n
  const r = x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0) / Math.sqrt(x.reduce((a, v) => a + (v - mx) ** 2, 0) * y.reduce((a, v) => a + (v - my) ** 2, 0))

  return {
    intro: 'Six units have pairs ' + tex(x.map((v, i) => '(' + v + ',' + y[i] + ')').join(',\\ ')) + '. All values are distinct within each variable. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find Spearman\'s rank correlation ' + tex('\\rho_S=1-6\\sum d_i^2/\\{n(n^2-1)\\}') + ', where ' + tex('d_i') + ' is the difference between the two ranks of unit ' + tex('i') + '.',
        answer: rho, tolerance: tol3, lecture: 12,
        explanation: 'Ranks of ' + tex('x') + ': ' + rx.join(',') + '; of ' + tex('y') + ': ' + ry.join(',') + '; ' + tex('\\sum d_i^2=' + d2) + ', so ' + tex('\\rho_S=1-6\\cdot' + d2 + '/210') + ' = ' + dec(rho) + '.',
      },
      {
        prompt: 'How many of the 15 pairs of units are concordant (the two variables are ordered the same way)?',
        answer: C, tolerance: tolInt, lecture: 13,
        explanation: 'A pair is concordant when ' + tex('(x_i-x_j)(y_i-y_j)>0') + '; counting gives ' + C + '.',
      },
      {
        prompt: 'How many pairs are discordant?',
        answer: D, tolerance: tolInt, lecture: 13,
        explanation: tex('15-' + C) + ' = ' + D + ' (no ties).',
      },
      {
        prompt: 'Find Kendall\'s ' + tex('\\tau=(C-D)/15') + '.',
        answer: tau, tolerance: tol3, lecture: 13,
        explanation: tex('(' + C + '-' + D + ')/15') + ' = ' + dec(tau) + '.',
      },
      {
        prompt: 'For comparison find the ordinary Pearson correlation of the raw values.',
        answer: r, tolerance: tol3, lecture: 12,
        explanation: tex('\\sum(x-\\bar x)(y-\\bar y)/\\sqrt{\\sum(x-\\bar x)^2\\sum(y-\\bar y)^2}') + ' = ' + dec(r) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'np-lq-d-rankcorr', generate: (rng) => build(sample(rng)) }
