// LQ-N: distribution-free interval for the median from order statistics, and a confidence interval for a cdf value.
// Lecture 3 (confidence intervals for the median and the cdf).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { n: number; r: number; m: number; c: number; x0: number }

export function sample(rng: Rng): Params {
  const n = rng.int(10, 15)
  const m = rng.pick([40, 50, 60, 80, 100])
  return { n, r: rng.int(2, 4), m, c: Math.round(m * rng.pick([0.3, 0.4, 0.55, 0.6, 0.7])) + rng.int(-2, 2), x0: rng.int(10, 90) }
}

/** P(Bin(n, 1/2) <= j) */
function cdfHalf(n: number, j: number): number {
  let s = 0
  for (let i = 0; i <= j; i++) {
    let c = 1
    for (let t = 1; t <= i; t++) c = (c * (n - i + t)) / t
    s += c / 2 ** n
  }
  return s
}

export function build({ n, r, m, c, x0 }: Params): LQInstance {
  const cover = 1 - 2 * cdfHalf(n, r - 1)
  let best = 1
  for (let k = 1; k <= n / 2; k++) if (1 - 2 * cdfHalf(n, k - 1) >= 0.95) best = k
  const have = 1 - 2 * cdfHalf(n, best - 1) >= 0.95
  const rBest = have ? best : 0
  const f = c / m
  const se = Math.sqrt((f * (1 - f)) / m)
  const upper = f + 1.96 * se

  return {
    intro: 'Let ' + tex('X_{(1)}<\\dots<X_{(n)}') + ' be the order statistics of a sample from a continuous distribution with median ' + tex('\\theta') + ', so the number of observations below ' + tex('\\theta') + ' is ' + tex('\\mathrm{Bin}(n,\\tfrac12)') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'With ' + tex('n=' + n) + ' find the exact coverage of the interval ' + tex('(X_{(' + r + ')},\\ X_{(' + (n + 1 - r) + ')})') + ' as a confidence interval for ' + tex('\\theta') + ', ' + tex('1-2P(\\mathrm{Bin}(' + n + ',\\tfrac12)\\le' + (r - 1) + ')') + '.',
        answer: cover, tolerance: tol4, lecture: 1,
        explanation: tex('P(\\mathrm{Bin}(' + n + ',\\tfrac12)\\le' + (r - 1) + ')=' + dec(cdfHalf(n, r - 1))) + ', so the coverage is ' + tex('1-2\\times' + dec(cdfHalf(n, r - 1))) + ' = ' + dec(cover) + '.',
      },
      {
        prompt: 'For ' + tex('n=' + n) + ' find the largest ' + tex('k') + ' such that ' + tex('(X_{(k)},\\ X_{(' + (n + 1) + '-k)})') + ' has coverage at least ' + tex('0.95') + ' (the shortest such symmetric interval). Give ' + tex('k') + ' as a whole number, or ' + tex('0') + ' if no such interval exists.',
        answer: rBest, tolerance: tolInt, lecture: 1,
        explanation: 'The coverage ' + tex('1-2P(\\mathrm{Bin}(' + n + ',\\tfrac12)\\le k-1)') + ' falls as ' + tex('k') + ' grows. ' + (have ? 'It is still at least 0.95 at ' + tex('k=' + rBest) + ' (' + dec(1 - 2 * cdfHalf(n, rBest - 1)) + ') and drops below at ' + tex('k=' + (rBest + 1)) + '.' : 'Even ' + tex('(X_{(1)},X_{(' + n + ')})') + ' only covers ' + dec(1 - 2 * cdfHalf(n, 0)) + ', so no interval reaches 0.95.'),
      },
      {
        prompt: 'In a sample of ' + tex(m) + ' observations, ' + tex(c) + ' are at most ' + tex(x0) + '. Find the empirical cdf value ' + tex('\\hat F(' + x0 + ')') + '.',
        answer: f, tolerance: tol4, lecture: 1,
        explanation: tex('\\hat F(' + x0 + ')=' + c + '/' + m) + ' = ' + dec(f) + '. The count of observations at most ' + tex(x0) + ' is ' + tex('\\mathrm{Bin}(' + m + ',F(' + x0 + '))') + '.',
      },
      {
        prompt: 'Find the estimated standard error of ' + tex('\\hat F(' + x0 + ')') + ', ' + tex('\\sqrt{\\hat F(1-\\hat F)/' + m + '}') + '.',
        answer: se, tolerance: tol4, lecture: 1,
        explanation: tex('\\sqrt{' + dec(f) + '\\times' + dec(1 - f) + '/' + m + '}') + ' = ' + dec(se) + '.',
      },
      {
        prompt: 'Find the upper end of the approximate 95% confidence interval for ' + tex('F(' + x0 + ')') + ', ' + tex('\\hat F+1.96\\,\\mathrm{SE}') + '.',
        answer: upper, tolerance: tol4, lecture: 1,
        explanation: tex(dec(f) + '+1.96\\times' + dec(se)) + ' = ' + dec(upper) + '.',
      },
    ],
  }
}

export const genN: LQGenerator = { id: 'np-lq-n-cicdf', generate: (rng) => build(sample(rng)) }
