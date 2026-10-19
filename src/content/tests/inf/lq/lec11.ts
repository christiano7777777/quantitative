// inf lecture 11 (the bootstrap): one story. An estimate and 19 bootstrap replicates: bootstrap standard error and bias, a bias-corrected
// estimate, percentile and basic interval ends, and the probability that the bootstrap maximum equals the sample maximum.
// Lecture 11.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { theta: number; reps: number[]; n: number }

export function sample(rng: Rng): Params {
  const theta = rng.int(10, 40)
  const reps = rng.sample(Array.from({ length: 61 }, (_, i) => i - 25), 19).map((e) => theta + e / 10)
  return { theta, reps, n: rng.pick([8, 10, 12, 15]) }
}

export function build({ theta, reps, n }: Params): LQInstance {
  const B = reps.length
  const mean = reps.reduce((a, b) => a + b, 0) / B
  const se = Math.sqrt(reps.reduce((s, v) => s + (v - mean) ** 2, 0) / (B - 1))
  const bias = mean - theta
  const corrected = theta - bias
  const sorted = [...reps].sort((a, b) => a - b)
  const percLow = sorted[0]
  const basicLow = 2 * theta - sorted[B - 1]
  const pMax = 1 - (1 - 1 / n) ** n

  return {
    intro: 'An estimator computed from a sample of ' + tex('n=' + n) + ' observations has value ' + tex('\\hat\\theta=' + theta) + '. Resampling the data with replacement ' + tex(B) + ' times and recomputing the estimator gives the bootstrap replicates ' + tex(reps.join(',\\ ')) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the bootstrap standard error: the sample standard deviation (divisor ' + tex(B - 1) + ') of the replicates.',
        answer: se, tolerance: tol4, lecture: 11,
        explanation: 'The replicates have mean ' + dec(mean) + ' and variance ' + dec(se * se) + ' (divisor ' + tex(B - 1) + '), so ' + tex('\\widehat{\\mathrm{SE}}=' + dec(se)) + '.',
      },
      {
        prompt: 'Find the bootstrap estimate of bias, ' + tex('\\overline{\\theta^*}-\\hat\\theta') + '.',
        answer: bias, tolerance: tol4, lecture: 11,
        explanation: tex(dec(mean) + '-' + theta) + ' = ' + dec(bias) + '.',
      },
      {
        prompt: 'Find the bias-corrected estimate ' + tex('\\hat\\theta-\\widehat{\\mathrm{bias}}') + '.',
        answer: corrected, tolerance: tol4, lecture: 11,
        explanation: tex(theta + '-(' + dec(bias) + ')') + ' = ' + dec(corrected) + '.',
      },
      {
        prompt: 'With ' + tex(B) + ' replicates the 5th and 95th percentiles are the smallest and largest. Find the lower end of the 90% percentile interval.',
        answer: percLow, tolerance: tol4, lecture: 11,
        explanation: 'The smallest replicate is ' + dec(percLow) + '.',
      },
      {
        prompt: 'The basic interval is ' + tex('(2\\hat\\theta-\\theta^*_{(95\\%)},\\ 2\\hat\\theta-\\theta^*_{(5\\%)})') + '. Find its lower end.',
        answer: basicLow, tolerance: tol4, lecture: 11,
        explanation: tex('2\\times' + theta + '-' + dec(sorted[B - 1])) + ' = ' + dec(basicLow) + '.',
      },
      {
        prompt: 'For the sample maximum of ' + tex(n) + ' observations, the maximum of a bootstrap resample equals the sample maximum whenever that observation is drawn at least once. Find that probability, ' + tex('1-(1-1/n)^n') + '. It stays near ' + tex('0.632') + ' however large ' + tex('n') + ' is, which is why the nonparametric bootstrap fails for this statistic.',
        answer: pMax, tolerance: tol4, lecture: 11,
        explanation: tex('1-(1-1/' + n + ')^{' + n + '}') + ' = ' + dec(pMax) + '. The true distribution of the maximum is continuous, but the bootstrap distribution has an atom of this size at the sample maximum.',
      },
    ],
  }
}

export const genLec11: LQGenerator = { id: 'inf-lq-lec11', generate: (rng) => build(sample(rng)) }
