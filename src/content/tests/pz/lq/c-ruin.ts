// LQ-C: gambler's ruin (fair and biased), return to the origin of a symmetric walk, and the ballot theorem.
// Lecture 5 (random walks and ruin).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { N: number; i: number; p: number; n: number; a: number; b: number } // p in hundredths

export function sample(rng: Rng): Params {
  const N = rng.pick([8, 10, 12, 15, 20])
  const b = rng.int(2, 6)
  return { N, i: rng.int(2, N - 2), p: rng.pick([40, 45, 55, 60]), n: rng.int(2, 6), a: b + rng.int(2, 6), b }
}

export const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }

export function build({ N, i, p, n, a, b }: Params): LQInstance {
  const P = p / 100, Q = 1 - P, r = Q / P
  const fair = i / N
  const dur = i * (N - i)
  const biased = (1 - r ** i) / (1 - r ** N)
  const ret = choose(2 * n, n) / 4 ** n
  const ballot = (a - b) / (a + b)

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A gambler with ' + tex(i) + ' dollars bets ' + tex(1) + ' dollar per round on a fair coin, and stops on reaching ' + tex(N) + ' dollars or ' + tex(0) + '. Find the probability of reaching ' + tex(N) + ' dollars.',
        answer: fair, tolerance: tol4, lecture: 5,
        explanation: 'The fortune is a martingale, so ' + tex('P=i/N=' + i + '/' + N) + ' = ' + dec(fair) + '.',
      },
      {
        prompt: 'Find the expected number of rounds until the game in part (a) ends, ' + tex('i(N-i)') + '.',
        answer: dur, tolerance: tol3, lecture: 5,
        explanation: tex(i + '\\cdot' + (N - i)) + ' = ' + dur + '.',
      },
      {
        prompt: 'Now the gambler wins each round with probability ' + tex(dec(P)) + ' (and loses with ' + tex(dec(Q)) + '). With ' + tex('r=q/p') + ', the probability of reaching ' + tex(N) + ' dollars from ' + tex(i) + ' dollars is ' + tex('(1-r^i)/(1-r^N)') + '. Find it.',
        answer: biased, tolerance: tol4, lecture: 5,
        explanation: tex('r=' + dec(r) + ',\\ (1-' + dec(r) + '^{' + i + '})/(1-' + dec(r) + '^{' + N + '})') + ' = ' + dec(biased) + '.',
      },
      {
        prompt: 'A symmetric simple random walk takes ' + tex(2 * n) + ' steps. Find the probability that it is back at the origin at the end, ' + tex('\\binom{' + 2 * n + '}{' + n + '}/2^{' + 2 * n + '}') + '.',
        answer: ret, tolerance: tol4, lecture: 5,
        explanation: tex(choose(2 * n, n) + '/' + 4 ** n) + ' = ' + dec(ret) + '.',
      },
      {
        prompt: 'In an election, candidate A gets ' + tex(a) + ' votes and B gets ' + tex(b) + ' votes, counted in uniformly random order. Find the probability that A is strictly ahead throughout the count (ballot theorem, ' + tex('(a-b)/(a+b)') + ').',
        answer: ballot, tolerance: tol4, lecture: 5,
        explanation: tex('(' + a + '-' + b + ')/(' + a + '+' + b + ')') + ' = ' + dec(ballot) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'pz-lq-c-ruin', generate: (rng) => build(sample(rng)) }
