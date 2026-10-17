// LQ-A: effect size, sample size for a two-group comparison, and the multiple-testing arithmetic of a strategy search.
// Lectures 1 (hypotheses, effect sizes) and 4 (multiple testing).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4, tolInt } from '../../../shared/format'

export interface Params { m1: number; m0: number; s1: number; s0: number; N: number; alpha: number }

export function sample(rng: Rng): Params {
  let p: Params
  do {
    p = { m1: rng.int(12, 30) / 10, m0: rng.int(0, 10) / 10, s1: rng.pick([2, 2.5, 3, 4]), s0: rng.pick([2, 2.5, 3, 4]), N: rng.pick([10, 20, 40, 100]), alpha: rng.pick([0.01, 0.05]) }
    const d = (p.m1 - p.m0) / Math.sqrt((p.s1 ** 2 + p.s0 ** 2) / 2)
    const need = 2 * (2.8 / d) ** 2
    if (d > 0.2 && Math.abs(need - Math.round(need)) > 0.01 && need < 400) return p
  } while (true)
}

export function build({ m1, m0, s1, s0, N, alpha }: Params): LQInstance {
  const sp = Math.sqrt((s1 * s1 + s0 * s0) / 2)
  const d = (m1 - m0) / sp
  const n = Math.ceil(2 * (2.8 / d) ** 2)
  const anyFp = 1 - (1 - alpha) ** N
  const bonf = alpha / N
  const expFp = N * alpha

  return {
    intro: 'Two groups of equal size have mean monthly returns ' + tex(dec(m1) + '\\%') + ' (signal on) and ' + tex(dec(m0) + '\\%') + ' (signal off), with standard deviations ' + tex(dec(s1) + '\\%') + ' and ' + tex(dec(s0) + '\\%') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find Cohen\'s ' + tex('d=(\\bar x_1-\\bar x_0)/s_p') + ', with pooled standard deviation ' + tex('s_p=\\sqrt{(s_1^2+s_0^2)/2}') + ' for equal group sizes.',
        answer: d, tolerance: tol4, lecture: 1,
        explanation: tex('s_p=' + dec(sp) + ',\\ d=' + dec(m1 - m0) + '/' + dec(sp)) + ' = ' + dec(d) + '.',
      },
      {
        prompt: 'For a two-sided test at the 5% level with 80% power, the group size needed is ' + tex('n=2\\{(1.96+0.84)/d\\}^2') + '. Find the smallest whole number of observations per group.',
        answer: n, tolerance: tolInt, lecture: 1,
        explanation: tex('2(2.8/' + dec(d) + ')^2=' + dec(2 * (2.8 / d) ** 2)) + ', rounded up to ' + n + '.',
      },
      {
        prompt: 'A researcher tests ' + tex(N) + ' independent signals that all have no effect, each at level ' + tex(dec(alpha)) + '. Find the probability that at least one is declared significant.',
        answer: anyFp, tolerance: tol4, lecture: 4,
        explanation: tex('1-(1-' + dec(alpha) + ')^{' + N + '}') + ' = ' + dec(anyFp) + '.',
      },
      {
        prompt: 'Find the Bonferroni per-test level that keeps the chance of any false positive at most ' + tex(dec(alpha)) + ' (4 decimal places).',
        answer: bonf, tolerance: { abs: 0.00005 }, lecture: 4,
        explanation: tex(dec(alpha) + '/' + N) + ' = ' + dec(bonf) + '.',
      },
      {
        prompt: 'Find the expected number of false positives among the ' + tex(N) + ' tests at the unadjusted level ' + tex(dec(alpha)) + '.',
        answer: expFp, tolerance: tol3, lecture: 4,
        explanation: tex(N + '\\cdot' + dec(alpha)) + ' = ' + dec(expFp) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'rm-lq-a-hypotheses', generate: (rng) => build(sample(rng)) }
