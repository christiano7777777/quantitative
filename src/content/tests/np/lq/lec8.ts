// np lecture 8 (bootstrap-t, regression, tests, failures): one story. A regression slope with its standard error and 19 studentised
// bootstrap values: the bootstrap-t interval ends, a bootstrap-t p-value, and two facts about resamples (an observation missing,
// the maximum present), the second showing why the bootstrap fails for the sample maximum.
// Lecture 8.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { theta: number; se: number; n: number; tstar: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const theta = rng.int(12, 38) / 10
    const se = rng.pick([0.4, 0.5, 0.6, 0.8])
    const tstar = rng.sample(Array.from({ length: 71 }, (_, i) => i - 35), 19).map((v) => v / 10)
    const tobs = theta / se
    const cnt = tstar.filter((t) => Math.abs(t) >= tobs).length
    if (tobs >= 2 && cnt >= 1 && cnt <= 6) return { theta, se, n: rng.pick([8, 10, 12]), tstar }
  }
}

export function build({ theta, se, n, tstar }: Params): LQInstance {
  const B = tstar.length
  const sorted = [...tstar].sort((a, b) => a - b)
  const lower = theta - sorted[B - 1] * se
  const upper = theta - sorted[0] * se
  const tobs = theta / se
  const cnt = tstar.filter((t) => Math.abs(t) >= tobs).length
  const pBoot = cnt / B
  const pMissing = (1 - 1 / n) ** n
  const pMax = 1 - pMissing

  return {
    intro: 'A regression of a response on a predictor with ' + tex('n=' + n) + ' observations gives the slope estimate ' + tex('\\hat\\beta=' + dec(theta)) + ' with estimated standard error ' + tex('\\widehat{\\mathrm{SE}}=' + dec(se)) + '. A paired bootstrap computes, for each of ' + tex(B) + ' resamples, the studentised value ' + tex('t^*=(\\hat\\beta^*-\\hat\\beta)/\\widehat{\\mathrm{SE}}^*') + ', giving ' + tex(tstar.map(dec).join(',\\ ')) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The bootstrap-t 90% interval is ' + tex('(\\hat\\beta-t^*_{(95\\%)}\\widehat{\\mathrm{SE}},\\ \\hat\\beta-t^*_{(5\\%)}\\widehat{\\mathrm{SE}})') + '. With ' + tex(B) + ' values the 95th and 5th percentiles are the largest and the smallest. Find the lower end.',
        answer: lower, tolerance: tol4, lecture: 8,
        explanation: 'The largest ' + tex('t^*') + ' is ' + dec(sorted[B - 1]) + ', so ' + tex(dec(theta) + '-' + dec(sorted[B - 1]) + '\\times' + dec(se)) + ' = ' + dec(lower) + '.',
      },
      {
        prompt: 'Find the upper end of the same interval.',
        answer: upper, tolerance: tol4, lecture: 8,
        explanation: 'The smallest ' + tex('t^*') + ' is ' + dec(sorted[0]) + ', so ' + tex(dec(theta) + '-(' + dec(sorted[0]) + ')\\times' + dec(se)) + ' = ' + dec(upper) + '. The interval is not symmetric: the bootstrap-t adapts to the skewness of the studentised statistic.',
      },
      {
        prompt: 'To test ' + tex('H_0:\\beta=0') + ' find the observed studentised value ' + tex('t_{\\text{obs}}=\\hat\\beta/\\widehat{\\mathrm{SE}}') + '.',
        answer: tobs, tolerance: tol4, lecture: 8,
        explanation: tex(dec(theta) + '/' + dec(se)) + ' = ' + dec(tobs) + '.',
      },
      {
        prompt: 'The bootstrap p-value for the two-sided test is the fraction of the ' + tex(B) + ' values with ' + tex('|t^*|\\ge t_{\\text{obs}}') + '. Find it.',
        answer: pBoot, tolerance: tol4, lecture: 8,
        explanation: cnt + ' of the ' + B + ' values have absolute value at least ' + dec(tobs) + ', so ' + tex('p=' + cnt + '/' + B) + ' = ' + dec(pBoot) + '.',
      },
      {
        prompt: 'In one bootstrap resample of size ' + tex(n) + ' drawn with replacement, find the probability that a particular observation is not selected at all, ' + tex('(1-1/n)^n') + '.',
        answer: pMissing, tolerance: tol4, lecture: 8,
        explanation: tex('(1-1/' + n + ')^{' + n + '}') + ' = ' + dec(pMissing) + ' (it tends to ' + tex('e^{-1}\\approx0.368') + ' as ' + tex('n') + ' grows).',
      },
      {
        prompt: 'The sample maximum of ' + tex(n) + ' observations is estimated by the maximum of the bootstrap resample, which equals the sample maximum whenever that observation is selected at least once. Find that probability, ' + tex('1-(1-1/n)^n') + '. (For the maximum of a ' + tex('U(0,\\theta)') + ' sample it shows why the bootstrap fails: the bootstrap distribution puts mass ' + tex('\\approx0.632') + ' on one point, but the true distribution of the maximum is continuous.)',
        answer: pMax, tolerance: tol4, lecture: 8,
        explanation: tex('1-' + dec(pMissing)) + ' = ' + dec(pMax) + '.',
      },
    ],
  }
}

export const genLec8: LQGenerator = { id: 'np-lq-lec8', generate: (rng) => build(sample(rng)) }
