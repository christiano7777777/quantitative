// LQ-W: the single question of STAT3620 lecture 1 (why nonparametric; the sign test; intervals for the median and the cdf).
// One story: delivery times of a courier firm against a claimed median. Six parts follow the lecture: ties and the sign statistic,
// exact one- and two-sided p-values, the coverage of an order-statistic interval for the median, and a confidence limit for the
// cdf at a point.
// Lecture 1.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { m0: number; x: number[]; r: number; x0: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const m0 = rng.int(20, 60)
    const n = rng.int(11, 14)
    const x = Array.from({ length: n }, () => m0 + rng.int(-15, 15))
    const ties = x.filter((v) => v === m0).length
    const others = x.filter((v) => v !== m0)
    const above = x.filter((v) => v > m0).length
    const nn = n - ties
    const x0 = m0 + rng.int(-8, 8)
    const c = x.filter((v) => v <= x0).length
    const f = c / n
    const limit = f + 1.96 * Math.sqrt((f * (1 - f)) / n)
    // 1 or 2 ties, a majority above m0 but not all, and a cdf point with 2 to n-2 observations at or below it whose
    // upper confidence limit is a sensible probability (below 1)
    // no ties other than those at m0, so the order statistics are distinct apart from the value m0
    if (ties >= 1 && ties <= 2 && new Set(others).size === others.length && above > nn / 2 && above < nn && c >= 2 && c <= n - 2 && limit < 1) {
      return { m0, x, r: rng.pick([2, 3]), x0 }
    }
  }
}

/** P(Bin(n, p) >= k) by summing the pmf term by term. */
function tailUp(n: number, k: number, p: number): number {
  let s = 0
  for (let j = k; j <= n; j++) {
    let c = 1
    for (let i = 1; i <= j; i++) c = (c * (n - j + i)) / i
    s += c * p ** j * (1 - p) ** (n - j)
  }
  return s
}

export function build({ m0, x, r, x0 }: Params): LQInstance {
  const n = x.length
  const nn = x.filter((v) => v !== m0).length
  const k = x.filter((v) => v > m0).length
  const upper = tailUp(nn, k, 0.5)
  const two = Math.min(1, 2 * upper)
  // coverage of (X_(r), X_(n+1-r)): the median lies inside unless at most r-1 or at least n-r+1 observations are below it
  const cover = 1 - 2 * (1 - tailUp(n, r, 0.5))
  const c = x.filter((v) => v <= x0).length
  const f = c / n
  const se = Math.sqrt((f * (1 - f)) / n)
  const up = f + 1.96 * se

  return {
    intro: 'A courier firm claims that the median delivery time of its parcels is ' + tex(m0) + ' minutes. The delivery times (minutes) of ' + tex(n) + ' parcels, a random sample from a continuous distribution recorded to the nearest minute, are ' + tex(x.join(',\\ ')) + '. Test ' + tex('H_0:\\text{median}=' + m0) + ' with the sign test: drop observations equal to ' + tex(m0) + ', let ' + tex('n_0') + ' be the number left and ' + tex('B') + ' the number above ' + tex(m0) + '. Under ' + tex('H_0') + ', ' + tex('B\\sim\\mathrm{Bin}(n_0,\\tfrac12)') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'How many observations remain after dropping those equal to ' + tex(m0) + '? (This is ' + tex('n_0') + '.) Give a whole number.',
        answer: nn, tolerance: tolInt, lecture: 1,
        explanation: tex(n) + ' observations minus ' + (n - nn) + ' equal to ' + tex(m0) + ' leaves ' + tex('n_0=' + nn) + '. Observations equal to the hypothesised median carry no information about which side the median is on.',
      },
      {
        prompt: 'How many of the remaining observations are above ' + tex(m0) + '? (This is ' + tex('B') + '.) Give a whole number.',
        answer: k, tolerance: tolInt, lecture: 1,
        explanation: 'The values above ' + tex(m0) + ' are ' + x.filter((v) => v > m0).join(', ') + ', so ' + tex('B=' + k) + '.',
      },
      {
        prompt: 'Find the exact one-sided p-value for ' + tex('H_1:\\text{median}>' + m0) + ', ' + tex('P(B\\ge' + k + ')') + ' with ' + tex('B\\sim\\mathrm{Bin}(' + nn + ',\\tfrac12)') + '.',
        answer: upper, tolerance: tol4, lecture: 1,
        explanation: 'Sum ' + tex('\\binom{' + nn + '}{j}/2^{' + nn + '}') + ' for ' + tex('j=' + k + ',\\dots,' + nn) + ': ' + dec(upper) + '.',
      },
      {
        prompt: 'Find the exact two-sided p-value: twice the smaller tail probability, capped at 1.',
        answer: two, tolerance: tol4, lecture: 1,
        explanation: 'Since ' + tex('B') + ' is above ' + tex(nn / 2) + ', the smaller tail is the upper one: ' + tex('2\\times' + dec(upper)) + ' = ' + dec(two) + (two === 1 ? ' (capped at 1)' : '') + '.',
      },
      {
        prompt: 'Let ' + tex('X_{(1)}\\le\\dots\\le X_{(' + n + ')}') + ' be the ordered delivery times (all ' + tex(n) + ' of them). The number of observations below the true median is ' + tex('\\mathrm{Bin}(' + n + ',\\tfrac12)') + '. Find the exact coverage of the interval ' + tex('(X_{(' + r + ')},\\ X_{(' + (n + 1 - r) + ')})') + ' as a confidence interval for the median.',
        answer: cover, tolerance: tol4, lecture: 1,
        explanation: 'The interval misses the median only if at most ' + tex(r - 1) + ' observations lie below it or at least ' + tex(n - r + 1) + ' do; by symmetry the coverage is ' + tex('1-2P(\\mathrm{Bin}(' + n + ',\\tfrac12)\\le' + (r - 1) + ')') + ' = ' + dec(cover) + '.',
      },
      {
        prompt: 'In the same sample, ' + tex(c) + ' of the ' + tex(n) + ' delivery times are at most ' + tex(x0) + ' minutes. Estimate ' + tex('F(' + x0 + ')') + ' by the empirical cdf ' + tex('\\hat F(' + x0 + ')') + ' and find the upper end of the approximate 95% confidence interval ' + tex('\\hat F+1.96\\sqrt{\\hat F(1-\\hat F)/' + n + '}') + '.',
        answer: up, tolerance: tol4, lecture: 1,
        explanation: tex('\\hat F(' + x0 + ')=' + c + '/' + n) + ' = ' + dec(f) + ' (the count at most ' + tex(x0) + ' is ' + tex('\\mathrm{Bin}(' + n + ',F(' + x0 + '))') + '). The standard error is ' + tex('\\sqrt{' + dec(f) + '\\times' + dec(1 - f) + '/' + n + '}') + ' = ' + dec(se) + ', so the upper limit is ' + tex(dec(f) + '+1.96\\times' + dec(se)) + ' = ' + dec(up) + '.',
      },
    ],
  }
}

export const genW: LQGenerator = { id: 'np-lq-w-signci', generate: (rng) => build(sample(rng)) }
