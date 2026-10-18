// LQ-I: order statistics of a uniform sample and a distribution-free confidence interval for the median.
// Lecture 1 (order statistics, distribution-free confidence intervals for quantiles).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; cMax: number; cMin: number; k: number; cK: number; r: number }

export function sample(rng: Rng): Params {
  const n = rng.pick([6, 8, 10])
  return {
    n,
    cMax: rng.pick([6, 7, 8, 9]) / 10,
    cMin: rng.pick([1, 2, 3, 4]) / 10,
    k: rng.int(2, n - 2),
    cK: rng.pick([3, 4, 5, 6, 7]) / 10,
    r: rng.pick([2, 3]),
  }
}

const choose = (n: number, j: number) => { let c = 1; for (let i = 1; i <= j; i++) c = (c * (n - j + i)) / i; return Math.round(c) }

export function build({ n, cMax, cMin, k, cK, r }: Params): LQInstance {
  const pMax = cMax ** n
  const pMin = 1 - (1 - cMin) ** n
  let pK = 0
  for (let j = k; j <= n; j++) pK += choose(n, j) * cK ** j * (1 - cK) ** (n - j)
  const eK = k / (n + 1)
  const s = n + 1 - r
  let ways = 0
  for (let j = r; j <= s - 1; j++) ways += choose(n, j)
  const cover = ways / 2 ** n

  return {
    intro: 'Let ' + tex('X_1,\\dots,X_{' + n + '}') + ' be independent observations from the uniform distribution on ' + tex('(0,1)') + ', with order statistics ' + tex('X_{(1)}<\\cdots<X_{(' + n + ')}') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('P(X_{(' + n + ')}\\le ' + dec(cMax) + ')') + ', the probability that the sample maximum is at most ' + tex(dec(cMax)) + '.',
        answer: pMax, tolerance: tol4, lecture: 1,
        explanation: 'The maximum is at most ' + tex(dec(cMax)) + ' exactly when all ' + tex(n) + ' observations are, so the probability is ' + tex(dec(cMax) + '^{' + n + '}') + ' = ' + dec(pMax) + '.',
      },
      {
        prompt: 'Find ' + tex('P(X_{(1)}\\le ' + dec(cMin) + ')') + ', the probability that the sample minimum is at most ' + tex(dec(cMin)) + '.',
        answer: pMin, tolerance: tol4, lecture: 1,
        explanation: 'The minimum exceeds ' + tex(dec(cMin)) + ' only if every observation does, so the probability is ' + tex('1-(1-' + dec(cMin) + ')^{' + n + '}') + ' = ' + dec(pMin) + '.',
      },
      {
        prompt: 'Find ' + tex('P(X_{(' + k + ')}\\le ' + dec(cK) + ')') + '. (Hint: ' + tex('X_{(' + k + ')}\\le ' + dec(cK)) + ' exactly when at least ' + tex(k) + ' of the ' + tex(n) + ' observations are at most ' + tex(dec(cK)) + '.)',
        answer: pK, tolerance: tol4, lecture: 1,
        explanation: 'The number of observations at most ' + tex(dec(cK)) + ' is binomial ' + tex('(' + n + ',' + dec(cK) + ')') + ', so the probability is ' + tex('\\sum_{j=' + k + '}^{' + n + '}\\binom{' + n + '}{j}' + dec(cK) + '^j' + dec(1 - cK) + '^{' + (n) + '-j}') + ' = ' + dec(pK) + '.',
      },
      {
        prompt: 'Find the mean ' + tex('E[X_{(' + k + ')}]') + '. (Hint: for a uniform sample, ' + tex('X_{(j)}') + ' has a Beta distribution with parameters ' + tex('j') + ' and ' + tex('n+1-j') + '.)',
        answer: eK, tolerance: tol4, lecture: 1,
        explanation: 'The mean of ' + tex('\\text{Beta}(' + k + ',' + (n + 1 - k) + ')') + ' is ' + tex(k + '/' + (n + 1)) + ' = ' + dec(eK) + '.',
      },
      {
        prompt: 'For a continuous distribution with median ' + tex('m') + ', the interval ' + tex('(X_{(' + r + ')},X_{(' + s + ')})') + ' is used as a confidence interval for ' + tex('m') + '. Find its exact coverage probability, which does not depend on the distribution.',
        answer: cover, tolerance: tol4, lecture: 1,
        explanation: 'The interval covers ' + tex('m') + ' when between ' + tex(r) + ' and ' + tex(s - 1) + ' observations fall below ' + tex('m') + ', and that count is binomial ' + tex('(' + n + ',1/2)') + ': ' + tex('\\sum_{j=' + r + '}^{' + (s - 1) + '}\\binom{' + n + '}{j}/2^{' + n + '}=' + ways + '/' + 2 ** n) + ' = ' + dec(cover) + '.',
      },
    ],
  }
}

export const genI: LQGenerator = { id: 'np-lq-i-orderstat', generate: (rng) => build(sample(rng)) }
