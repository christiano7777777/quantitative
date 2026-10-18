// LQ-B: the Mann-Whitney test from raw data, a Kruskal-Wallis statistic for three groups, and a Friedman statistic for four blocks.
// Lectures 3 (two-sample rank tests) and 4 (multi-sample tests).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[]; y: number[]; groups: number[][]; blocks: number[][] }

const distinct = (rng: Rng, k: number, lo: number, hi: number) => rng.sample(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), k)

export function sample(rng: Rng): Params {
  const all = distinct(rng, 9, 1, 60)
  const g = distinct(rng, 9, 1, 50)
  return {
    x: all.slice(0, 4), y: all.slice(4),
    groups: [g.slice(0, 3), g.slice(3, 6), g.slice(6)],
    blocks: Array.from({ length: 4 }, () => distinct(rng, 3, 1, 30)),
  }
}

export const ranksOf = (v: number[]) => v.map((a) => v.filter((b) => b < a).length + 1)

export function build({ x, y, groups, blocks }: Params): LQInstance {
  const n1 = x.length, n2 = y.length
  const r = ranksOf([...x, ...y])
  const W = r.slice(0, n1).reduce((a, b) => a + b, 0)
  const U1 = W - (n1 * (n1 + 1)) / 2
  const z = (U1 - (n1 * n2) / 2) / Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12)
  const flat = groups.flat()
  const rg = ranksOf(flat)
  const N = flat.length
  const Rsum = [0, 1, 2].map((j) => rg.slice(3 * j, 3 * j + 3).reduce((a, b) => a + b, 0))
  const H = (12 / (N * (N + 1))) * Rsum.reduce((a, R) => a + (R * R) / 3, 0) - 3 * (N + 1)
  const b = blocks.length, k = 3
  const R = [0, 1, 2].map((j) => blocks.reduce((a, row) => a + ranksOf(row)[j], 0))
  const chi = (12 / (b * k * (k + 1))) * R.reduce((a, v) => a + v * v, 0) - 3 * b * (k + 1)

  return {
    intro: 'All values below are distinct. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Sample 1 is ' + tex(x.join(',')) + ' and sample 2 is ' + tex(y.join(',')) + '. Rank the nine values together (1 = smallest) and find the rank sum ' + tex('W') + ' of sample 1.',
        answer: W, tolerance: { abs: 0.25 }, lecture: 4,
        explanation: 'The pooled ranks of sample 1 are ' + tex(r.slice(0, n1).join(',')) + ', which sum to ' + W + '.',
      },
      {
        prompt: 'Find the Mann-Whitney statistic ' + tex('U_1=W-n_1(n_1+1)/2') + ' (the number of pairs in which a sample-1 value exceeds a sample-2 value).',
        answer: U1, tolerance: { abs: 0.25 }, lecture: 4,
        explanation: tex(W + '-' + (n1 * (n1 + 1)) / 2) + ' = ' + U1 + ' of the ' + n1 * n2 + ' pairs.',
      },
      {
        prompt: 'Find the normal approximation ' + tex('z=(U_1-n_1n_2/2)/\\sqrt{n_1n_2(n_1+n_2+1)/12}') + '.',
        answer: z, tolerance: tol4, lecture: 4,
        explanation: tex('(' + U1 + '-' + (n1 * n2) / 2 + ')/\\sqrt{' + dec((n1 * n2 * (n1 + n2 + 1)) / 12) + '}') + ' = ' + dec(z) + '.',
      },
      {
        prompt: 'Three groups of three observations are ' + groups.map((g, j) => 'group ' + (j + 1) + ': ' + tex(g.join(','))).join('; ') + '. Rank all nine values together and compute the Kruskal-Wallis statistic ' + tex('H=\\frac{12}{N(N+1)}\\sum_iR_i^2/n_i-3(N+1)') + '.',
        answer: H, tolerance: tol4, lecture: 5,
        explanation: 'Group rank sums are ' + tex(Rsum.join(',')) + ', so ' + tex('H=\\frac{12}{90}(' + Rsum.map((v) => v * v + '/3').join('+') + ')-30') + ' = ' + dec(H) + ', to be compared with ' + tex('\\chi^2_2') + '.',
      },
      {
        prompt: 'Four subjects each try three treatments, with scores (treatment 1, 2, 3) ' + blocks.map((row, i) => 'subject ' + (i + 1) + ': ' + tex(row.join(','))).join('; ') + '. Rank the three scores within each subject and compute the Friedman statistic ' + tex('\\frac{12}{bk(k+1)}\\sum_jR_j^2-3b(k+1)') + ' from the treatment rank sums ' + tex('R_j') + '.',
        answer: chi, tolerance: tol4, lecture: 5,
        explanation: 'Treatment rank sums are ' + tex(R.join(',')) + ', so ' + tex('\\frac{12}{48}(' + R.map((v) => v * v).join('+') + ')-48') + ' = ' + dec(chi) + ', compared with ' + tex('\\chi^2_2') + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'np-lq-b-ranksum', generate: (rng) => build(sample(rng)) }
