// LQ-F: difference-in-differences from group means over two pre-periods and one post-period: the estimate, changes, counterfactual, pre-trend gap.
// Lecture 8 (difference-in-differences).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { t: number[]; c: number[] } // group mean outcomes at t = -2, -1, 0 (post), in tenths

export const did = (t: number[], c: number[]) => (t[2] - t[1]) - (c[2] - c[1])

export function sample(rng: Rng): Params {
  const bt = rng.int(150, 300), bc = rng.int(100, 250), trend = rng.int(0, 30)
  const t = [bt, bt + trend + rng.int(-6, 6), bt + 2 * trend + rng.int(10, 50)]
  const c = [bc, bc + trend + rng.int(-6, 6), bc + 2 * trend + rng.int(-6, 6)]
  return { t, c }
}

export function build({ t, c }: Params): LQInstance {
  const T = t.map((v) => v / 10), C = c.map((v) => v / 10)
  const est = did(T, C)
  const dT = T[2] - T[1], dC = C[2] - C[1]
  const cf = T[1] + dC
  const preGap = (T[1] - C[1]) - (T[0] - C[0])
  const tbl = String.raw`\begin{array}{c|ccc} & t=-2 & t=-1 & t=0\ (\text{post}) \\ \hline \text{treated} & ${T.map(dec).join(' & ')} \\ \text{control} & ${C.map(dec).join(' & ')} \end{array}`

  return {
    intro: 'A policy is introduced for the treated group between ' + tex('t=-1') + ' and ' + tex('t=0') + '. Mean outcomes are $$' + tbl + '$$ Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the difference-in-differences estimate using ' + tex('t=-1') + ' as the pre-period and ' + tex('t=0') + ' as the post period.',
        answer: est, tolerance: tol3, lecture: 8,
        explanation: tex('(' + dec(T[2]) + '-' + dec(T[1]) + ')-(' + dec(C[2]) + '-' + dec(C[1]) + ')') + ' = ' + dec(est) + '.',
      },
      {
        prompt: 'Find the change in the treated group\'s mean from ' + tex('t=-1') + ' to ' + tex('t=0') + '.',
        answer: dT, tolerance: tol3, lecture: 8,
        explanation: tex(dec(T[2]) + '-' + dec(T[1])) + ' = ' + dec(dT) + '.',
      },
      {
        prompt: 'Find the change in the control group\'s mean over the same period.',
        answer: dC, tolerance: tol3, lecture: 8,
        explanation: tex(dec(C[2]) + '-' + dec(C[1])) + ' = ' + dec(dC) + '.',
      },
      {
        prompt: 'Under parallel trends, what would the treated group\'s mean at ' + tex('t=0') + ' have been without the policy (its ' + tex('t=-1') + ' mean plus the control group\'s change)?',
        answer: cf, tolerance: tol3, lecture: 8,
        explanation: tex(dec(T[1]) + '+' + dec(dC)) + ' = ' + dec(cf) + ', so the effect is ' + dec(T[2]) + '-' + dec(cf) + ' = ' + dec(est) + '.',
      },
      {
        prompt: 'As a pre-trend check, find the change in the treated-minus-control gap from ' + tex('t=-2') + ' to ' + tex('t=-1') + ', ' + tex('(T_{-1}-C_{-1})-(T_{-2}-C_{-2})') + '. Values far from zero cast doubt on parallel trends.',
        answer: preGap, tolerance: tol3, lecture: 8,
        explanation: tex('(' + dec(T[1]) + '-' + dec(C[1]) + ')-(' + dec(T[0]) + '-' + dec(C[0]) + ')') + ' = ' + dec(preGap) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'ci-lq-f-did', generate: (rng) => build(sample(rng)) }
