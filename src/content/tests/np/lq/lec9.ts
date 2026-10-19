// np lecture 9 (jackknife and statistical functionals): one story. Five observations and the plug-in variance (divisor n): a leave-one-out
// estimate, jackknife bias, jackknife standard error, the bias-corrected estimate, and the DKW half-width for the empirical cdf.
// Lecture 9.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[] }

export function sample(rng: Rng): Params {
  return { x: rng.sample(Array.from({ length: 20 }, (_, i) => i + 1), 5) }
}

/** The plug-in (divisor n) variance, the estimator being studied. */
const pv = (a: number[]) => { const m = a.reduce((s, v) => s + v, 0) / a.length; return a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length }

export function build({ x }: Params): LQInstance {
  const n = x.length
  const est = pv(x)
  const loo = x.map((_, i) => pv(x.filter((__, j) => j !== i)))
  const looMean = loo.reduce((a, b) => a + b, 0) / n
  const bias = (n - 1) * (looMean - est)
  const se = Math.sqrt(((n - 1) / n) * loo.reduce((s, v) => s + (v - looMean) ** 2, 0))
  const corrected = est - bias
  const dkw = Math.sqrt(Math.log(2 / 0.05) / (2 * n))

  return {
    intro: 'Five measurements are ' + tex(x.join(',\\ ')) + '. The plug-in estimate of the variance is ' + tex('\\hat\\sigma^2=\\frac1n\\sum(x_i-\\bar x)^2') + ' (divisor ' + tex('n') + '). Study its bias and variability with the jackknife, which recomputes the estimate leaving out one observation at a time. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the plug-in estimate ' + tex('\\hat\\sigma^2') + ' from all ' + tex(n) + ' observations.',
        answer: est, tolerance: tol4, lecture: 9,
        explanation: tex('\\bar x=' + dec(x.reduce((a, b) => a + b, 0) / n)) + ' and ' + tex('\\hat\\sigma^2=' + dec(est)) + '.',
      },
      {
        prompt: 'Leave out the first observation (' + tex(x[0]) + ') and recompute the plug-in variance of the remaining ' + tex(n - 1) + ' values (divisor ' + tex(n - 1) + '). Find this leave-one-out estimate ' + tex('\\hat\\sigma^2_{(1)}') + '.',
        answer: loo[0], tolerance: tol4, lecture: 9,
        explanation: 'The remaining values ' + x.slice(1).join(', ') + ' give ' + tex('\\hat\\sigma^2_{(1)}=' + dec(loo[0])) + '. The five leave-one-out estimates are ' + loo.map(dec).join(', ') + ' with mean ' + dec(looMean) + '.',
      },
      {
        prompt: 'Find the jackknife bias estimate ' + tex('(n-1)(\\bar\\theta_{(\\cdot)}-\\hat\\theta)') + ', where ' + tex('\\bar\\theta_{(\\cdot)}') + ' is the mean of the leave-one-out estimates.',
        answer: bias, tolerance: tol4, lecture: 9,
        explanation: tex('4\\times(' + dec(looMean) + '-' + dec(est) + ')') + ' = ' + dec(bias) + '. It is negative: the divisor-' + tex('n') + ' variance underestimates the true variance.',
      },
      {
        prompt: 'Find the jackknife standard error ' + tex('\\sqrt{\\dfrac{n-1}{n}\\sum_i(\\hat\\theta_{(i)}-\\bar\\theta_{(\\cdot)})^2}') + '.',
        answer: se, tolerance: tol4, lecture: 9,
        explanation: 'The sum of squared deviations of the leave-one-out estimates is ' + dec(loo.reduce((s, v) => s + (v - looMean) ** 2, 0)) + '; times ' + tex('4/5') + ' and square-rooted gives ' + dec(se) + '.',
      },
      {
        prompt: 'Find the bias-corrected jackknife estimate ' + tex('\\hat\\theta-\\widehat{\\mathrm{bias}}_{\\text{jack}}') + '.',
        answer: corrected, tolerance: tol4, lecture: 9,
        explanation: tex(dec(est) + '-(' + dec(bias) + ')') + ' = ' + dec(corrected) + ', which equals the unbiased sample variance with divisor ' + tex(n - 1) + ' (the jackknife removes the ' + tex('1/n') + ' bias of this statistic exactly).',
      },
      {
        prompt: 'The empirical cdf ' + tex('\\hat F_n') + ' of these ' + tex(n) + ' observations lies within ' + tex('\\varepsilon_n=\\sqrt{\\ln(2/\\alpha)/(2n)}') + ' of the true cdf everywhere with probability at least ' + tex('1-\\alpha') + ' (the DKW inequality). Find ' + tex('\\varepsilon_n') + ' for ' + tex('\\alpha=0.05') + '.',
        answer: dkw, tolerance: tol4, lecture: 9,
        explanation: tex('\\sqrt{\\ln(40)/10}') + ' = ' + dec(dkw) + '. The band ' + tex('\\hat F_n\\pm\\varepsilon_n') + ' is a distribution-free 95% confidence band.',
      },
    ],
  }
}

export const genLec9: LQGenerator = { id: 'np-lq-lec9', generate: (rng) => build(sample(rng)) }
