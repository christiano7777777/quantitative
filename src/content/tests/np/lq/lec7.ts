// np lecture 7 (the bootstrap: standard errors, bias and simple intervals): one story. An estimate and 19 bootstrap replicates of it:
// bootstrap standard error and bias, a bias-corrected estimate, and normal, percentile and basic 90% interval ends.
// Lecture 7.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { theta: number; reps: number[] }

export function sample(rng: Rng): Params {
  const theta = rng.int(30, 60)
  // 19 replicates, all different, scattered around theta with a small upward shift (so there is some bias)
  const reps = rng.sample(Array.from({ length: 61 }, (_, i) => i - 25), 19).map((e) => theta + e / 10)
  return { theta, reps }
}

export function build({ theta, reps }: Params): LQInstance {
  const B = reps.length
  const mean = reps.reduce((a, b) => a + b, 0) / B
  const se = Math.sqrt(reps.reduce((s, v) => s + (v - mean) ** 2, 0) / (B - 1))
  const bias = mean - theta
  const corrected = theta - bias
  const normalUp = theta + 1.645 * se
  const sorted = [...reps].sort((a, b) => a - b)
  const percLow = sorted[0]
  const basicLow = 2 * theta - sorted[B - 1]

  return {
    intro: 'A statistician estimates a population median by ' + tex('\\hat\\theta=' + theta) + ' from one sample. Resampling the sample with replacement ' + tex(B) + ' times and recomputing the median each time gives the bootstrap replicates ' + tex(reps.join(',\\ ')) + '. Use them to describe the uncertainty of ' + tex('\\hat\\theta') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the bootstrap standard error: the sample standard deviation (divisor ' + tex(B - 1) + ') of the ' + tex(B) + ' replicates.',
        answer: se, tolerance: tol4, lecture: 7,
        explanation: 'The replicates have mean ' + dec(mean) + '; the sum of squared deviations divided by ' + tex(B - 1) + ' gives variance ' + dec(se * se) + ', so ' + tex('\\widehat{\\mathrm{SE}}=' + dec(se)) + '.',
      },
      {
        prompt: 'Find the bootstrap estimate of bias, ' + tex('\\overline{\\theta^*}-\\hat\\theta') + '.',
        answer: bias, tolerance: tol4, lecture: 7,
        explanation: tex(dec(mean) + '-' + theta) + ' = ' + dec(bias) + '.',
      },
      {
        prompt: 'Find the bias-corrected estimate ' + tex('\\hat\\theta-\\widehat{\\mathrm{bias}}') + '.',
        answer: corrected, tolerance: tol4, lecture: 7,
        explanation: tex(theta + '-(' + dec(bias) + ')') + ' = ' + dec(corrected) + '.',
      },
      {
        prompt: 'Find the upper end of the normal-based 90% interval ' + tex('\\hat\\theta\\pm1.645\\,\\widehat{\\mathrm{SE}}') + '.',
        answer: normalUp, tolerance: tol4, lecture: 7,
        explanation: tex(theta + '+1.645\\times' + dec(se)) + ' = ' + dec(normalUp) + '.',
      },
      {
        prompt: 'The percentile interval takes the 5th and 95th percentiles of the replicates. With ' + tex(B) + ' replicates these are the smallest and the largest (the ' + tex('(B+1)\\alpha=1') + 'st and ' + tex(B) + 'th ordered values). Find the lower end of the 90% percentile interval.',
        answer: percLow, tolerance: tol4, lecture: 7,
        explanation: 'The smallest replicate is ' + dec(percLow) + '.',
      },
      {
        prompt: 'The basic (residual) interval reflects the percentiles around ' + tex('\\hat\\theta') + ': it is ' + tex('(2\\hat\\theta-\\theta^*_{(95\\%)},\\ 2\\hat\\theta-\\theta^*_{(5\\%)})') + '. Find its lower end.',
        answer: basicLow, tolerance: tol4, lecture: 7,
        explanation: tex('2\\times' + theta + '-' + dec(sorted[B - 1])) + ' = ' + dec(basicLow) + '.',
      },
    ],
  }
}

export const genLec7: LQGenerator = { id: 'np-lq-lec7', generate: (rng) => build(sample(rng)) }
