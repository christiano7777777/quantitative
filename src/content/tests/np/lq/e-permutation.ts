// LQ-E: an exact permutation test for a difference in means with three units per group (20 possible assignments).
// Lecture 7 (permutation tests).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { a: number[]; b: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const v = rng.sample(Array.from({ length: 30 }, (_, i) => i + 1), 6)
    const a = v.slice(0, 3), b = v.slice(3)
    if (a.reduce((s, q) => s + q, 0) !== b.reduce((s, q) => s + q, 0)) return { a, b }
  }
}

/** all 20 ways to choose which three of six values form "group A": returns the differences in means */
export function allDiffs(values: number[]): number[] {
  const out: number[] = []
  const tot = values.reduce((s, v) => s + v, 0)
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) for (let k = j + 1; k < 6; k++) {
    const sa = values[i] + values[j] + values[k]
    out.push(sa / 3 - (tot - sa) / 3)
  }
  return out
}

export function build({ a, b }: Params): LQInstance {
  const values = [...a, ...b]
  const obs = a.reduce((s, v) => s + v, 0) / 3 - b.reduce((s, v) => s + v, 0) / 3
  const diffs = allDiffs(values)
  const eps = 1e-9
  const oneSided = diffs.filter((d) => d >= obs - eps).length
  const twoSided = diffs.filter((d) => Math.abs(d) >= Math.abs(obs) - eps).length

  return {
    intro: 'Group A has values ' + tex(a.join(',')) + ' and group B has values ' + tex(b.join(',')) + '. Test whether group A has the larger mean with an exact permutation test: relabel the six values in all possible ways into two groups of three. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'How many distinct assignments of the six values to groups A and B (three each) are there?',
        answer: 20, tolerance: tolInt, lecture: 7,
        explanation: tex('\\binom63=20') + '.',
      },
      {
        prompt: 'Find the observed difference in means, ' + tex('\\bar x_A-\\bar x_B') + '.',
        answer: obs, tolerance: tol3, lecture: 7,
        explanation: tex(dec(a.reduce((s, v) => s + v, 0) / 3) + '-' + dec(b.reduce((s, v) => s + v, 0) / 3)) + ' = ' + dec(obs) + '.',
      },
      {
        prompt: 'In how many of the 20 assignments (the observed one included) is the difference in means at least as large as the observed difference?',
        answer: oneSided, tolerance: tolInt, lecture: 7,
        explanation: 'Because the total is fixed, the difference is large exactly when group A\'s sum is large; counting the splits with sum at least ' + dec(a.reduce((s, v) => s + v, 0)) + ' gives ' + oneSided + '.',
      },
      {
        prompt: 'Find the exact one-sided p-value.',
        answer: oneSided / 20, tolerance: tol3, lecture: 7,
        explanation: tex(oneSided + '/20') + ' = ' + dec(oneSided / 20) + '.',
      },
      {
        prompt: 'Find the exact two-sided p-value: the proportion of assignments with ' + tex('|\\bar x_A-\\bar x_B|') + ' at least as large as the observed absolute difference.',
        answer: twoSided / 20, tolerance: tol3, lecture: 7,
        explanation: tex(twoSided + '/20') + ' = ' + dec(twoSided / 20) + '. The smallest possible two-sided p-value here is 0.1.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'np-lq-e-permutation', generate: (rng) => build(sample(rng)) }
