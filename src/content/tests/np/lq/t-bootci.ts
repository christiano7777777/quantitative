// LQ-T: bootstrap standard error, bias, and normal, percentile and basic (residual) intervals from B = 19 replicates.
// Lecture 14 (the bootstrap: standard errors, bias and simple intervals).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { theta: number; reps: number[] }

export function sample(rng: Rng): Params {
  const theta = rng.int(40, 80) / 10
  for (;;) {
    const reps = Array.from({ length: 19 }, () => Math.round((theta + (rng.int(-18, 22) / 10) + 0.1 * rng.int(-3, 3)) * 10) / 10)
    if (new Set(reps).size === 19) return { theta, reps }
  }
}

export function build({ theta, reps }: Params): LQInstance {
  const B = reps.length
  const mean = reps.reduce((a, b) => a + b, 0) / B
  const se = Math.sqrt(reps.reduce((s, v) => s + (v - mean) ** 2, 0) / (B - 1))
  const bias = mean - theta
  const lowN = theta - 1.645 * se
  const sorted = [...reps].sort((a, b) => a - b)
  const pctUpper = sorted[B - 1] // 95th percentile: (B+1)(0.95) = 19
  const basicLower = 2 * theta - sorted[B - 1]

  return {
    intro: 'An estimate is ' + tex('\\hat\\theta=' + dec(theta)) + '. The bootstrap gave ' + tex('B=' + B) + ' replicates ' + tex('\\hat\\theta^*_b') + ': ' + tex(reps.map(dec).join(',\\ ')) + '. Use 90% intervals, so ' + tex('\\alpha=0.1') + ', and note that the ' + tex('p') + '-th percentile of the replicates is the ' + tex('(B+1)p') + '-th smallest value. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the bootstrap standard error: the sample standard deviation of the ' + tex(B) + ' replicates (divisor ' + tex('B-1') + ').',
        answer: se, tolerance: tol4, lecture: 7,
        explanation: 'The replicate mean is ' + dec(mean) + ', the sum of squared deviations is ' + dec(se * se * (B - 1)) + ', so ' + tex('\\widehat{\\mathrm{SE}}=\\sqrt{' + dec(se * se * (B - 1)) + '/' + (B - 1) + '}') + ' = ' + dec(se) + '.',
      },
      {
        prompt: 'Find the bootstrap bias estimate ' + tex('\\frac1B\\sum_b\\hat\\theta^*_b-\\hat\\theta') + '.',
        answer: bias, tolerance: tol4, lecture: 7,
        explanation: tex(dec(mean) + '-' + dec(theta)) + ' = ' + dec(bias) + '. A positive value means ' + tex('\\hat\\theta') + ' tends to overestimate.',
      },
      {
        prompt: 'Find the lower end of the normal-based 90% interval ' + tex('\\hat\\theta\\pm1.645\\,\\widehat{\\mathrm{SE}}') + '.',
        answer: lowN, tolerance: tol4, lecture: 7,
        explanation: tex(dec(theta) + '-1.645\\times' + dec(se)) + ' = ' + dec(lowN) + '.',
      },
      {
        prompt: 'Find the upper end of the 90% percentile interval, the 95th percentile of the replicates (the ' + tex('(B+1)\\times0.95=19') + '-th smallest value).',
        answer: pctUpper, tolerance: tol4, lecture: 7,
        explanation: 'With ' + tex('B=19') + ' the 95th percentile is the largest replicate, ' + dec(pctUpper) + ' (and the 5th percentile is the smallest, ' + dec(sorted[0]) + ').',
      },
      {
        prompt: 'The basic (residual) interval is ' + tex('(2\\hat\\theta-\\hat\\theta^*_{0.95},\\ 2\\hat\\theta-\\hat\\theta^*_{0.05})') + '. Find its lower end.',
        answer: basicLower, tolerance: tol4, lecture: 7,
        explanation: tex('2\\times' + dec(theta) + '-' + dec(pctUpper)) + ' = ' + dec(basicLower) + '. It reflects the percentile interval about ' + tex('\\hat\\theta') + ', so it differs from it whenever the replicates are skewed.',
      },
    ],
  }
}

export const genT: LQGenerator = { id: 'np-lq-t-bootci', generate: (rng) => build(sample(rng)) }
