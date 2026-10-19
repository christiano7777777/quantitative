// LQ-R: multiple comparisons (number of pairs, Bonferroni level) and the Jonckheere-Terpstra statistic with its null moments.
// Lecture 9 (multiple comparisons and ordered alternatives).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { g: number[][]; kc: number; alpha: number }

export function sample(rng: Rng): Params {
  const sizes = rng.pick([[3, 3, 3], [3, 3, 4], [2, 3, 4], [3, 4, 4]])
  const N = sizes.reduce((a, b) => a + b, 0)
  const vals = rng.sample(Array.from({ length: 30 }, (_, i) => i + 1), N)
  // build an increasing trend: add a group effect
  const g: number[][] = []
  let at = 0
  sizes.forEach((s, j) => { g.push(vals.slice(at, at + s).map((v) => v + 3 * j)); at += s })
  const all = g.flat()
  if (new Set(all).size < all.length) return sample(rng)
  return { g, kc: rng.pick([4, 5, 6]), alpha: rng.pick([0.05, 0.1, 0.01]) }
}

export function build({ g, kc, alpha }: Params): LQInstance {
  const sizes = g.map((x) => x.length)
  const N = sizes.reduce((a, b) => a + b, 0)
  const pairs = (kc * (kc - 1)) / 2
  const bon = alpha / pairs
  let JT = 0
  for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) for (const a of g[i]) for (const b of g[j]) if (a < b) JT++
  const s2 = sizes.reduce((s, n) => s + n * n, 0)
  const E = (N * N - s2) / 4
  const V = (N * N * (2 * N + 3) - sizes.reduce((s, n) => s + n * n * (2 * n + 3), 0)) / 72
  const z = (JT - E) / Math.sqrt(V)
  const show = (x: number[]) => x.join(',\\ ')

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise. Parts (a) and (b) concern an experiment with ' + tex(kc) + ' treatments compared in all pairs at overall level ' + tex('\\alpha=' + dec(alpha)) + '. Parts (c) to (e) use three treatments expected to give increasing values: ' + tex('1:\\ ' + show(g[0])) + '; ' + tex('2:\\ ' + show(g[1])) + '; ' + tex('3:\\ ' + show(g[2])) + '.',
    parts: [
      {
        prompt: 'How many pairwise comparisons ' + tex('k(k-1)/2') + ' are there among the ' + tex(kc) + ' treatments? Give a whole number.',
        answer: pairs, tolerance: tolInt, lecture: 9,
        explanation: tex(kc + '\\times' + (kc - 1) + '/2=' + pairs) + '.',
      },
      {
        prompt: 'Find the Bonferroni level for each pairwise test, ' + tex('\\alpha/\\{k(k-1)/2\\}') + ' (4 decimal places; this guarantees family-wise error at most ' + tex(dec(alpha)) + ').',
        answer: bon, tolerance: tol4, lecture: 9,
        explanation: tex(dec(alpha) + '/' + pairs) + ' = ' + dec(bon) + '. The union bound ' + tex('P(\\cup E_j)\\le\\sum P(E_j)') + ' is what makes this work, and it is conservative when there are many pairs.',
      },
      {
        prompt: 'Find the Jonckheere-Terpstra statistic ' + tex('JT=\\sum_{i<j}T_{ij}') + ', where ' + tex('T_{ij}') + ' counts the pairs with the observation from treatment ' + tex('i') + ' smaller than the one from treatment ' + tex('j') + '. Give a whole number.',
        answer: JT, tolerance: tolInt, lecture: 9,
        explanation: 'Pair counts: 1 vs 2: ' + g[0].reduce((s, a) => s + g[1].filter((b) => a < b).length, 0) + ', 1 vs 3: ' + g[0].reduce((s, a) => s + g[2].filter((b) => a < b).length, 0) + ', 2 vs 3: ' + g[1].reduce((s, a) => s + g[2].filter((b) => a < b).length, 0) + '. Their sum is ' + tex('JT=' + JT) + '.',
      },
      {
        prompt: 'Find the null mean ' + tex('E(JT)=(N^2-\\sum n_i^2)/4') + '.',
        answer: E, tolerance: tol4, lecture: 9,
        explanation: tex('N=' + N + ',\\ \\sum n_i^2=' + s2) + ', so ' + tex('(' + N * N + '-' + s2 + ')/4') + ' = ' + dec(E) + '.',
      },
      {
        prompt: 'Find the normal approximation ' + tex('z=(JT-E(JT))/\\sqrt{\\mathrm{Var}(JT)}') + ' with ' + tex('\\mathrm{Var}(JT)=\\{N^2(2N+3)-\\sum n_i^2(2n_i+3)\\}/72') + '.',
        answer: z, tolerance: tol4, lecture: 9,
        explanation: tex('\\mathrm{Var}(JT)=(' + N * N + '\\times' + (2 * N + 3) + '-' + sizes.reduce((s, n) => s + n * n * (2 * n + 3), 0) + ')/72=' + dec(V)) + ', so ' + tex('z=(' + JT + '-' + dec(E) + ')/' + dec(Math.sqrt(V))) + ' = ' + dec(z) + '. A large positive ' + tex('z') + ' supports an increasing order.',
      },
    ],
  }
}

export const genR: LQGenerator = { id: 'np-lq-r-mult', generate: (rng) => build(sample(rng)) }
