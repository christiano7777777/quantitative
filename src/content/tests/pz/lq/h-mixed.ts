// LQ-H: a mixed timed set: dice sums, expected maximum of two dice, points on a circle, waiting for a run of heads, derangements.
// Lecture 10 (timed mixed sets).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { s: number; m: number; pts: number; run: number; n: number }

export function sample(rng: Rng): Params {
  return { s: rng.int(2, 12), m: rng.pick([4, 6, 8, 10, 12, 20]), pts: rng.int(3, 8), run: rng.pick([2, 3, 4, 5]), n: rng.pick([4, 5, 6, 7]) }
}

export const derangements = (n: number) => { let a = 1, b = 0; for (let i = 2; i <= n; i++) { const c = (i - 1) * (a + b); a = b; b = c } return n === 0 ? 1 : n === 1 ? 0 : b }

export function build({ s, m, pts, run, n }: Params): LQInstance {
  const ways = 6 - Math.abs(s - 7)
  const pSum = ways / 36
  const emax = ((m + 1) * (4 * m - 1)) / (6 * m)
  const circle = pts / 2 ** (pts - 1)
  const runE = 2 ** (run + 1) - 2
  let fact = 1
  for (let i = 2; i <= n; i++) fact *= i
  const der = derangements(n) / fact

  return {
    intro: 'A mixed set of short problems. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Two fair six-sided dice are rolled. Find the probability that the sum is ' + tex(s) + '.',
        answer: pSum, tolerance: tol4, lecture: 10,
        explanation: 'There are ' + tex(ways) + ' of 36 equally likely outcomes with sum ' + tex(s) + ': ' + tex(ways + '/36') + ' = ' + dec(pSum) + '.',
      },
      {
        prompt: 'Two fair ' + tex(m) + '-sided dice (faces ' + tex('1,\\dots,' + m) + ') are rolled. Find the expected value of the larger, ' + tex('\\dfrac{(m+1)(4m-1)}{6m}') + '.',
        answer: emax, tolerance: tol4, lecture: 10,
        explanation: tex('E[\\max]=\\sum_{j}P(\\max\\ge j)') + ' gives ' + tex('(' + (m + 1) + ')(' + (4 * m - 1) + ')/(' + 6 * m + ')') + ' = ' + dec(emax) + '.',
      },
      {
        prompt: tex(pts) + ' points are chosen independently and uniformly on a circle. Find the probability that they all lie in some semicircle, ' + tex('n/2^{n-1}') + '.',
        answer: circle, tolerance: tol4, lecture: 10,
        explanation: tex(pts + '/2^{' + (pts - 1) + '}') + ' = ' + dec(circle) + ': for each point, the others must all lie in the half-circle clockwise from it, probability ' + tex('2^{-(n-1)}') + '; these events are disjoint.',
      },
      {
        prompt: 'A fair coin is tossed until ' + tex(run) + ' heads appear in a row. Find the expected number of tosses, ' + tex('2^{k+1}-2') + ' for a run of ' + tex('k') + '.',
        answer: runE, tolerance: tol4, lecture: 10,
        explanation: tex('2^{' + (run + 1) + '}-2') + ' = ' + runE + '.',
      },
      {
        prompt: 'A random permutation of ' + tex(n) + ' objects is chosen. Find the probability that no object stays in its original place (a derangement), ' + tex('D_n/n!') + ' with ' + tex('D_n=' + derangements(n)) + '.',
        answer: der, tolerance: tol4, lecture: 10,
        explanation: tex(derangements(n) + '/' + fact) + ' = ' + dec(der) + ', already close to ' + tex('1/e=0.3679') + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'pz-lq-h-mixed', generate: (rng) => build(sample(rng)) }
