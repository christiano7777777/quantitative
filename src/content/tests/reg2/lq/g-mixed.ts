// LQ-G: a balanced random-intercept model: ANOVA variance components, intraclass correlation and a BLUP.
// Lecture 10 (mixed-effects models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { data: number[][] } // m clusters, r observations each

export function stats(data: number[][]) {
  const m = data.length, r = data[0].length
  const means = data.map((row) => row.reduce((s, v) => s + v, 0) / r)
  const grand = means.reduce((s, v) => s + v, 0) / m
  const msw = data.reduce((s, row, i) => s + row.reduce((t, v) => t + (v - means[i]) ** 2, 0), 0) / (m * (r - 1))
  const msb = (r * means.reduce((s, v) => s + (v - grand) ** 2, 0)) / (m - 1)
  return { m, r, means, grand, msw, msb }
}

export function sample(rng: Rng): Params {
  const m = rng.pick([3, 4]), r = 3
  for (;;) {
    const data = Array.from({ length: m }, () => { const c = rng.int(4, 16); return Array.from({ length: r }, () => c + rng.int(-3, 3)) })
    const s = stats(data)
    if (s.msb > s.msw * 1.3 && s.msw > 0) return { data }
  }
}

export function build({ data }: Params): LQInstance {
  const { m, r, means, grand, msw, msb } = stats(data)
  const su = (msb - msw) / r
  const icc = su / (su + msw)
  const shrink = su / (su + msw / r)
  const blup = shrink * (means[0] - grand)

  return {
    intro:
      'In a random-intercept model ' + tex('y_{ij}=\\mu+u_i+\\varepsilon_{ij}') + ' with ' + tex('u_i\\sim N(0,\\sigma_u^2)') + ' and ' + tex('\\varepsilon_{ij}\\sim N(0,\\sigma^2)') + ', there are ' + tex(m) + ' clusters with ' + tex(r) + ' observations each:' +
      data.map((row, i) => ' cluster ' + (i + 1) + ': ' + row.join(', ')).join(';') + '. Use the analysis-of-variance estimators and give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the within-cluster mean square ' + tex('MS_W=\\dfrac{\\sum_{i,j}(y_{ij}-\\bar y_{i\\cdot})^2}{m(r-1)}') + ', which estimates ' + tex('\\sigma^2') + '.',
        answer: msw, tolerance: tol3, lecture: 10,
        explanation: 'Cluster means are ' + means.map(dec).join(', ') + '. The pooled within-cluster sum of squares over ' + tex(m * (r - 1)) + ' degrees of freedom gives ' + dec(msw) + '.',
      },
      {
        prompt: 'Find the between-cluster mean square ' + tex('MS_B=\\dfrac{r\\sum_i(\\bar y_{i\\cdot}-\\bar y)^2}{m-1}') + '.',
        answer: msb, tolerance: tol3, lecture: 10,
        explanation: tex('\\bar y=' + dec(grand)) + ', so ' + tex('MS_B=' + r + '\\sum(\\bar y_i-\\bar y)^2/' + (m - 1)) + ' = ' + dec(msb) + '.',
      },
      {
        prompt: 'Since ' + tex('E[MS_B]=\\sigma^2+r\\sigma_u^2') + ', estimate ' + tex('\\sigma_u^2') + ' by ' + tex('(MS_B-MS_W)/r') + '.',
        answer: su, tolerance: tol3, lecture: 10,
        explanation: tex('(' + dec(msb) + '-' + dec(msw) + ')/' + r) + ' = ' + dec(su) + '.',
      },
      {
        prompt: 'Find the estimated intraclass correlation ' + tex('\\hat\\sigma_u^2/(\\hat\\sigma_u^2+\\hat\\sigma^2)') + ', using ' + tex('\\hat\\sigma^2=MS_W') + '.',
        answer: icc, tolerance: tol3, lecture: 10,
        explanation: tex(dec(su) + '/(' + dec(su) + '+' + dec(msw) + ')') + ' = ' + dec(icc) + ', the share of variance between clusters.',
      },
      {
        prompt: 'The BLUP of the random effect of cluster 1 is ' + tex('\\hat u_1=\\dfrac{\\hat\\sigma_u^2}{\\hat\\sigma_u^2+\\hat\\sigma^2/r}(\\bar y_{1\\cdot}-\\bar y)') + '. Find it.',
        answer: blup, tolerance: tol3, lecture: 10,
        explanation: 'The shrinkage factor is ' + tex(dec(su) + '/(' + dec(su) + '+' + dec(msw) + '/' + r + ')=' + dec(shrink)) + ', applied to ' + tex('\\bar y_1-\\bar y=' + dec(means[0] - grand)) + ': ' + dec(blup) + '. The raw deviation is shrunk towards zero.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'reg2-lq-g-mixed', generate: (rng) => build(sample(rng)) }
