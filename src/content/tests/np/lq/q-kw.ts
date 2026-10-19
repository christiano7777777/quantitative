// LQ-Q: Kruskal-Wallis for three groups with a tied pair: mid-ranks, the statistic, the tie correction and the permutation count.
// Lecture 8 (K-sample methods).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { g: number[][] }

export function sample(rng: Rng): Params {
  for (;;) {
    const sizes = rng.pick([[3, 3, 3], [3, 3, 4], [2, 3, 4]])
    const N = sizes.reduce((a, b) => a + b, 0)
    const vals = rng.sample(Array.from({ length: 20 }, (_, i) => i + 1), N)
    // force exactly one tied pair across two groups
    const a = rng.int(0, N - 1)
    let b = rng.int(0, N - 1)
    while (b === a) b = rng.int(0, N - 1)
    vals[b] = vals[a]
    const g: number[][] = []
    let at = 0
    for (const s of sizes) { g.push(vals.slice(at, at + s)); at += s }
    const sorted = [...vals].sort((p, q) => p - q)
    const ties = sorted.filter((v, i) => i > 0 && v === sorted[i - 1]).length
    // want a non-trivial result: the tied pair must be in different groups, and group means of ranks must differ
    const groupOf = (idx: number) => g.findIndex((_, j) => idx < sizes.slice(0, j + 1).reduce((p, q) => p + q, 0))
    if (ties === 1 && groupOf(a) !== groupOf(b)) return { g }
  }
}

export const midRanks = (all: number[]) => all.map((v) => all.filter((w) => w < v).length + (all.filter((w) => w === v).length + 1) / 2)

export function build({ g }: Params): LQInstance {
  const all = g.flat()
  const N = all.length, k = g.length
  const R = midRanks(all)
  let at = 0
  const rs: number[] = []
  const sizes = g.map((x) => x.length)
  for (const s of sizes) { rs.push(R.slice(at, at + s).reduce((p, q) => p + q, 0)); at += s }
  const KW = (12 / (N * (N + 1))) * rs.reduce((s, r, i) => s + (r * r) / sizes[i], 0) - 3 * (N + 1)
  const counts = new Map<number, number>()
  all.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1))
  let tieSum = 0
  counts.forEach((t) => { tieSum += t ** 3 - t })
  const C = 1 - tieSum / (N ** 3 - N)
  const KWt = KW / C
  let perms = 1
  let left = N
  for (const s of sizes) {
    let c = 1
    for (let i = 1; i <= s; i++) c = (c * (left - s + i)) / i
    perms *= c
    left -= s
  }
  const show = (x: number[]) => x.join(',\\ ')

  return {
    intro: 'Three groups have observations ' + tex('A:\\ ' + show(g[0])) + '; ' + tex('B:\\ ' + show(g[1])) + '; ' + tex('C:\\ ' + show(g[2])) + ', with exactly one tied pair. Rank all ' + tex(N) + ' values together (ties get the average of the ranks they occupy, a mid-rank). Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the rank sum ' + tex('R_A') + ' of group ' + tex('A') + '.',
        answer: rs[0], tolerance: tol4, lecture: 4,
        explanation: 'Ranks of group ' + tex('A') + ': ' + R.slice(0, sizes[0]).map(dec).join(', ') + '. They sum to ' + dec(rs[0]) + '. (The rank sums of the three groups are ' + rs.map(dec).join(', ') + ', adding to ' + tex(N * (N + 1) / 2) + '.)',
      },
      {
        prompt: 'Find the Kruskal-Wallis statistic without any tie correction, ' + tex('KW=\\dfrac{12}{N(N+1)}\\sum_iR_i^2/n_i-3(N+1)') + ', using the mid-ranks.',
        answer: KW, tolerance: tol4, lecture: 4,
        explanation: tex('\\dfrac{12}{' + N * (N + 1) + '}(' + rs.map((r, i) => dec(r) + '^2/' + sizes[i]).join('+') + ')-' + 3 * (N + 1)) + ' = ' + dec(KW) + '.',
      },
      {
        prompt: 'Find the tie correction factor ' + tex('C=1-\\sum_{\\text{ties}}(t^3-t)/(N^3-N)') + ', where ' + tex('t') + ' is the size of each group of tied values.',
        answer: C, tolerance: tol4, lecture: 4,
        explanation: 'One tied pair has ' + tex('t=2') + ', so ' + tex('\\sum(t^3-t)=6') + ' and ' + tex('C=1-6/(' + N + '^3-' + N + ')=1-6/' + (N ** 3 - N)) + ' = ' + dec(C) + '.',
      },
      {
        prompt: 'Find the tie-adjusted statistic ' + tex('KW_{\\text{ties}}=KW/C') + '. (Compare it with a ' + tex('\\chi^2_{' + (k - 1) + '}') + ' critical value.)',
        answer: KWt, tolerance: tol4, lecture: 4,
        explanation: tex(dec(KW) + '/' + dec(C)) + ' = ' + dec(KWt) + '. The correction is small here but always increases the statistic.',
      },
      {
        prompt: 'How many distinct ways can the ' + tex(N) + ' observations be assigned to the three groups of sizes ' + tex(sizes.join(',')) + ' (the permutations used for an exact test)? Give a whole number.',
        answer: perms, tolerance: tolInt, lecture: 4,
        explanation: tex('\\dfrac{' + N + '!}{' + sizes.map((s) => s + '!').join('\\,') + '}=' + perms) + '.',
      },
    ],
  }
}

export const genQ: LQGenerator = { id: 'np-lq-q-kw', generate: (rng) => build(sample(rng)) }
