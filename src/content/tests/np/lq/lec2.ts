// np lecture 2 (two-sample location): one story. Two groups, in the order of the HKU notes: the permutation count, the Wilcoxon rank
// sum and its exact p-value, Mann-Whitney U, its z statistic and the Hodges-Lehmann shift estimate, all on the same data.
// Lecture 2.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; y: number[] }

/** Rank sum W of x in the pooled ranking, and the number of the C(N, m) rank subsets with sum at least W. */
function rankSumTail(x: number[], y: number[]) {
  const m = x.length, N = m + y.length
  const sorted = [...x, ...y].sort((a, b) => a - b)
  const w = x.reduce((s, v) => s + sorted.indexOf(v) + 1, 0)
  let ge = 0, total = 0
  for (let mask = 0; mask < 1 << N; mask++) {
    let bits = 0, rs = 0
    for (let i = 0; i < N; i++) if (mask & (1 << i)) { bits++; rs += i + 1 }
    if (bits !== m) continue
    total++
    if (rs >= w) ge++
  }
  return { sorted, w, ge, total }
}

export function sample(rng: Rng): Params {
  for (;;) {
    const vals = rng.sample(Array.from({ length: 50 }, (_, i) => i + 10), 9)
    const x = vals.slice(0, 4), y = vals.slice(4)
    // the new recipe should look slower, so the upper tail is short enough to count by hand (at most 12 of 126 subsets)
    if (rankSumTail(x, y).ge <= 12) return { x, y }
  }
}

const median = (a: number[]) => { const s = [...a].sort((p, q) => p - q), h = s.length; return h % 2 ? s[(h - 1) / 2] : (s[h / 2 - 1] + s[h / 2]) / 2 }

export function build({ x, y }: Params): LQInstance {
  const m = x.length, n = y.length, N = m + n
  const { sorted, w, ge, total } = rankSumTail(x, y)
  const U = w - (m * (m + 1)) / 2
  const p = ge / total
  const z = (U - (m * n) / 2) / Math.sqrt((m * n * (N + 1)) / 12)
  const diffs = x.flatMap((a) => y.map((b) => a - b))
  const hl = median(diffs)

  return {
    intro: 'A bakery compares the baking times (minutes) of a new recipe, ' + tex('X:\\ ' + x.join(',\\ ')) + ' (' + tex('m=' + m) + '), with the old recipe, ' + tex('Y:\\ ' + y.join(',\\ ')) + ' (' + tex('n=' + n) + '). All values are distinct. Test whether the new recipe tends to take longer, using ranks of the pooled ' + tex(N) + ' values. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'If the two recipes were the same, every choice of which ' + tex(m) + ' of the ' + tex(N) + ' pooled values belong to ' + tex('X') + ' would be equally likely. How many choices are there? Give a whole number.',
        answer: total, tolerance: tolInt, lecture: 2,
        explanation: tex('\\binom{' + N + '}{' + m + '}=' + total) + '.',
      },
      {
        prompt: 'Find the Wilcoxon rank sum ' + tex('W') + ' of the ' + tex('X') + ' values in the pooled ranking (smallest value has rank 1). Give a whole number.',
        answer: w, tolerance: tolInt, lecture: 2,
        explanation: 'Sorted data ' + sorted.join(', ') + '. The ' + tex('X') + ' ranks are ' + x.map((v) => sorted.indexOf(v) + 1).join(', ') + ', with sum ' + tex(w) + '.',
      },
      {
        prompt: 'Find the exact one-sided permutation p-value ' + tex('P(W\\ge' + w + ')') + ' by counting the choices of ' + tex(m) + ' of the ranks ' + tex('1,\\dots,' + N) + ' whose sum is at least ' + tex(w) + '.',
        answer: p, tolerance: tol4, lecture: 2,
        explanation: ge + ' of the ' + total + ' equally likely choices have rank sum at least ' + w + ', so ' + tex('p=' + ge + '/' + total) + ' = ' + dec(p) + '.',
      },
      {
        prompt: 'Find the Mann-Whitney statistic ' + tex('U=W-m(m+1)/2') + '. Give a whole number.',
        answer: U, tolerance: tolInt, lecture: 2,
        explanation: tex(w + '-' + (m * (m + 1)) / 2 + '=' + U) + '. It counts the pairs ' + tex('(X_i,Y_j)') + ' with ' + tex('X_i>Y_j') + '.',
      },
      {
        prompt: 'Find the normal-approximation statistic ' + tex('z=\\dfrac{U-mn/2}{\\sqrt{mn(N+1)/12}}') + ' (no ties).',
        answer: z, tolerance: tol4, lecture: 2,
        explanation: tex('mn/2=' + (m * n) / 2) + ' and ' + tex('\\sqrt{' + m * n + '\\times' + (N + 1) + '/12}=' + dec(Math.sqrt((m * n * (N + 1)) / 12))) + ', so ' + tex('z=(' + U + '-' + (m * n) / 2 + ')/' + dec(Math.sqrt((m * n * (N + 1)) / 12))) + ' = ' + dec(z) + '.',
      },
      {
        prompt: 'Find the Hodges-Lehmann estimate of the shift: the median of all ' + tex(m * n) + ' differences ' + tex('X_i-Y_j') + '.',
        answer: hl, tolerance: tol4, lecture: 2,
        explanation: 'The ' + tex(m * n) + ' differences sorted are ' + [...diffs].sort((a, b) => a - b).join(', ') + '; their median is ' + dec(hl) + '.',
      },
    ],
  }
}

export const genLec2: LQGenerator = { id: 'np-lq-lec2', generate: (rng) => build(sample(rng)) }
