// LQ-C: independent variables X_n = n with probability n^{-s}, else 0 (modes of convergence, Borel-Cantelli).
// Lectures 5 (Borel-Cantelli) and 6 (modes of convergence).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params {
  s: number // P(X_n = n) = n^{-s}
  q: number // moment order in (b)
  nb: number // index in (b)
  tau: number // tail target in (c)
  m: number // number of variables in (d), (e)
}

export function sample(rng: Rng): Params {
  const s = rng.pick([2, 3, 4])
  const q = s === 2 ? 1 : rng.pick([1, 2])
  const tau = { 2: [0.01, 0.005, 0.02], 3: [0.001, 0.0005, 0.002], 4: [0.0002, 0.0001, 0.0005] }[s as 2 | 3 | 4]
  return { s, q, nb: rng.pick([4, 5, 8, 10]), tau: rng.pick(tau), m: rng.pick([3, 4, 5]) }
}

/** zeta(s) for the three exponents used. */
const zeta = (s: number) => (s === 2 ? Math.PI ** 2 / 6 : s === 3 ? 1.2020569031595942 : Math.PI ** 4 / 90)

/** Smallest N with sum_{n>=N} n^{-s} <= tau, using Euler-Maclaurin beyond M. */
function tailIndex(s: number, tau: number): number {
  const M = 2000
  let tail = M ** (1 - s) / (s - 1) + M ** -s / 2 // sum_{n>=M}
  const tails: number[] = new Array(M + 1)
  tails[M] = tail
  for (let n = M - 1; n >= 1; n--) { tail += n ** -s; tails[n] = tail }
  for (let n = 1; n <= M; n++) if (tails[n] <= tau) return n
  throw new Error('tail target too small')
}

export function build({ s, q, nb, tau, m }: Params): LQInstance {
  const total = zeta(s)
  const moment = nb ** (q - s)
  const N = tailIndex(s, tau)
  let allZero = 1
  for (let n = 2; n <= m + 1; n++) allZero *= 1 - n ** -s
  let expected = 0
  for (let n = 1; n <= m; n++) expected += n ** -s

  const pn = tex('P(X_n=n)=n^{-' + s + '}')
  return {
    intro:
      'The random variables ' + tex('X_1,X_2,\\dots') + ' are independent, with ' + pn + ' and ' + tex('X_n=0') + ' otherwise. Give decimal answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find ' + tex('\\sum_{n=1}^{\\infty}P(X_n\\neq0)') + '. (It is finite, so by Borel-Cantelli ' + tex('X_n\\to0') + ' almost surely.)',
        answer: total, tolerance: tol4, lecture: 6,
        explanation: tex('\\sum_{n\\ge1}n^{-' + s + '}=\\zeta(' + s + ')') + ' = ' + dec(total) + '.',
      },
      {
        prompt: 'Find ' + tex('E[X_{' + nb + '}^{' + q + '}]') + '.',
        answer: moment, tolerance: tol4, lecture: 6,
        explanation: tex('X_n^{' + q + '}') + ' equals ' + tex('n^{' + q + '}') + ' with probability ' + tex('n^{-' + s + '}') + ', so ' + tex('E[X_n^{' + q + '}]=n^{' + (q - s) + '}') + '; for ' + tex('n=' + nb) + ' this is ' + dec(moment) + '.',
      },
      {
        prompt: 'Find the smallest integer ' + tex('N') + ' such that ' + tex('\\sum_{n\\ge N}P(X_n\\neq0)\\le' + dec(tau)) + ' (an upper bound for the probability that some ' + tex('X_n') + ' with ' + tex('n\\ge N') + ' is non-zero).',
        answer: N, tolerance: tolInt, lecture: 6,
        explanation: 'By the union bound, ' + tex('P(\\exists n\\ge N:X_n\\ne0)\\le\\sum_{n\\ge N}n^{-' + s + '}\\approx\\dfrac{1}{' + (s - 1) + '(N-\\frac12)^{' + (s - 1) + '}}') + '. Adding terms and checking where the tail first drops below ' + dec(tau) + ' gives ' + tex('N=' + N) + '.',
      },
      {
        prompt: 'Find the probability that ' + tex('X_2=X_3=\\cdots=X_{' + (m + 1) + '}=0') + '.',
        answer: allZero, tolerance: tol4, lecture: 5,
        explanation: 'By independence, ' + tex('\\prod_{n=2}^{' + (m + 1) + '}(1-n^{-' + s + '})') + ' = ' + dec(allZero) + '.',
      },
      {
        prompt: 'Let ' + tex('K_m') + ' be the number of indices ' + tex('n\\le' + m) + ' with ' + tex('X_n\\ne0') + '. Find ' + tex('E[K_{' + m + '}]') + '.',
        answer: expected, tolerance: tol4, lecture: 5,
        explanation: tex('K_m=\\sum_{n\\le m}1_{\\{X_n\\ne0\\}}') + ', so by linearity ' + tex('E[K_m]=\\sum_{n=1}^{' + m + '}n^{-' + s + '}') + ' = ' + dec(expected) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'p3-lq-c-modes', generate: (rng) => build(sample(rng)) }
