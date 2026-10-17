// LQ-E: two small samples given as raw data: pooled variance, a pooled t interval and statistic, Welch's statistic, the F ratio.
// Lectures 10 (t and F tests) and 7 (confidence interval for a difference of means).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  x: number[]
  y: number[]
}

/** 97.5% points of Student's t for the pooled degrees of freedom that occur (checked numerically in the tests). */
export const T975: Record<number, number> = { 8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201 }

export function sample(rng: Rng): Params {
  const n1 = rng.pick([5, 6])
  const n2 = rng.pick([5, 6, 7])
  const c1 = rng.int(10, 18)
  const c2 = c1 + rng.int(-5, 5)
  let x: number[], y: number[]
  do {
    x = Array.from({ length: n1 }, () => rng.int(c1 - 6, c1 + 6))
    y = Array.from({ length: n2 }, () => rng.int(c2 - 7, c2 + 7))
  } while (new Set(x).size < 4 || new Set(y).size < 4)
  return { x, y }
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
const svar = (a: number[]) => {
  const m = mean(a)
  return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)
}

export function build({ x, y }: Params): LQInstance {
  const n1 = x.length, n2 = y.length
  const m1 = mean(x), m2 = mean(y), v1 = svar(x), v2 = svar(y)
  const df = n1 + n2 - 2
  const sp2 = ((n1 - 1) * v1 + (n2 - 1) * v2) / df
  const tq = T975[df]
  const half = tq * Math.sqrt(sp2 * (1 / n1 + 1 / n2))
  const tPool = (m1 - m2) / Math.sqrt(sp2 * (1 / n1 + 1 / n2))
  const tWelch = (m1 - m2) / Math.sqrt(v1 / n1 + v2 / n2)
  const F = v1 / v2

  return {
    intro:
      'Two independent samples are assumed normal. Sample 1: ' + x.join(', ') + '. Sample 2: ' + y.join(', ') + '. Let ' + tex('\\bar x,\\bar y') + ' be the sample means and ' + tex('s_1^2,s_2^2') +
      ' the sample variances (divisor ' + tex('n-1') + '). Do not round intermediate values; give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the pooled variance ' + tex('s_p^2=\\dfrac{(n_1-1)s_1^2+(n_2-1)s_2^2}{n_1+n_2-2}') + '.',
        answer: sp2, tolerance: tol3, lecture: 10,
        explanation: tex('\\bar x=' + dec(m1) + ',\\ s_1^2=' + dec(v1) + ',\\ \\bar y=' + dec(m2) + ',\\ s_2^2=' + dec(v2)) + ', so ' + tex('s_p^2=(' + (n1 - 1) + '\\cdot' + dec(v1) + '+' + (n2 - 1) + '\\cdot' + dec(v2) + ')/' + df) + ' = ' + dec(sp2) + '.',
      },
      {
        prompt: 'The 97.5% point of the ' + tex('t_{' + df + '}') + ' distribution is ' + tex(tq) + '. Find the half-width ' + tex(tq + '\\,s_p\\sqrt{1/n_1+1/n_2}') + ' of the 95% confidence interval for ' + tex('\\mu_1-\\mu_2') + ' under equal variances.',
        answer: half, tolerance: tol3, lecture: 7,
        explanation: tex(tq + '\\sqrt{' + dec(sp2) + '(1/' + n1 + '+1/' + n2 + ')}') + ' = ' + dec(half) + '. The interval is ' + tex(dec(m1 - m2) + '\\pm' + dec(half)) + '.',
      },
      {
        prompt: 'Find the pooled two-sample ' + tex('t') + ' statistic ' + tex('t=\\dfrac{\\bar x-\\bar y}{s_p\\sqrt{1/n_1+1/n_2}}') + ' for testing ' + tex('H_0:\\mu_1=\\mu_2') + '.',
        answer: tPool, tolerance: tol3, lecture: 10,
        explanation: tex('t=(' + dec(m1) + '-' + dec(m2) + ')/\\sqrt{' + dec(sp2) + '(1/' + n1 + '+1/' + n2 + ')}') + ' = ' + dec(tPool) + ', compared with ' + tex('t_{' + df + '}') + '.',
      },
      {
        prompt: 'Find Welch\'s statistic ' + tex('t_W=\\dfrac{\\bar x-\\bar y}{\\sqrt{s_1^2/n_1+s_2^2/n_2}}') + ', which does not assume equal variances.',
        answer: tWelch, tolerance: tol3, lecture: 10,
        explanation: tex('t_W=(' + dec(m1 - m2) + ')/\\sqrt{' + dec(v1) + '/' + n1 + '+' + dec(v2) + '/' + n2 + '}') + ' = ' + dec(tWelch) + '.',
      },
      {
        prompt: 'Find the statistic ' + tex('F=s_1^2/s_2^2') + ' for testing equal variances.',
        answer: F, tolerance: tol3, lecture: 10,
        explanation: tex('F=' + dec(v1) + '/' + dec(v2)) + ' = ' + dec(F) + ', to be compared with ' + tex('F_{' + (n1 - 1) + ',' + (n2 - 1) + '}') + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'p2-lq-e-twosample', generate: (rng) => build(sample(rng)) }
