// LQ-P: Siegel-Tukey and Ansari-Bradley rank sums, the ratio of mean deviances, and an exact permutation p-value.
// Lecture 6 (tests for scale).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; y: number[] }

export function sample(rng: Rng): Params {
  const [m, n] = rng.pick([[4, 2], [3, 3]])
  for (;;) {
    const vals = rng.sample(Array.from({ length: 24 }, (_, i) => i + 1), m + n)
    const x = vals.slice(0, m), y = vals.slice(m)
    // X is the more spread-out sample (extreme values), so the tests have something to find
    const spread = (a: number[]) => Math.max(...a) - Math.min(...a)
    if (spread(x) > spread(y) && new Set(vals).size === vals.length) return { x, y }
  }
}

/** Siegel-Tukey scores for sorted positions 0..N-1: 1 to the smallest, 2,3 to the two largest, 4,5 to the next two smallest, ... */
export function siegelTukey(N: number): number[] {
  const score = new Array<number>(N).fill(0)
  let lo = 0, hi = N - 1, next = 1
  score[lo++] = next++
  let top = true
  while (lo <= hi) {
    for (let t = 0; t < 2 && lo <= hi; t++) {
      if (top) score[hi--] = next++
      else score[lo++] = next++
    }
    top = !top
  }
  return score
}

const median = (a: number[]) => {
  const s = [...a].sort((p, q) => p - q), h = s.length
  return h % 2 ? s[(h - 1) / 2] : (s[h / 2 - 1] + s[h / 2]) / 2
}

export function build({ x, y }: Params): LQInstance {
  const m = x.length, n = y.length, N = m + n
  const sorted = [...x, ...y].sort((a, b) => a - b)
  const st = siegelTukey(N)
  const wST = x.reduce((s, v) => s + st[sorted.indexOf(v)], 0)
  const wAB = x.reduce((s, v) => { const i = sorted.indexOf(v) + 1; return s + Math.min(i, N + 1 - i) }, 0)
  const mx = median(x), my = median(y)
  const mad = (a: number[], c: number) => a.reduce((s, v) => s + Math.abs(v - c), 0) / a.length
  const rmd = mad(x, mx) / mad(y, my)
  // exact one-sided p-value P(W_ST <= observed) over all choices of m of the N positions for X
  let le = 0, total = 0
  for (let mask = 0; mask < 1 << N; mask++) {
    let bits = 0
    for (let i = 0; i < N; i++) if (mask & (1 << i)) bits++
    if (bits !== m) continue
    total++
    let w = 0
    for (let i = 0; i < N; i++) if (mask & (1 << i)) w += st[i]
    if (w <= wST) le++
  }
  const p = le / total

  return {
    intro: 'Two independent samples with the same centre are ' + tex('X:\\ ' + x.join(',\\ ')) + ' (' + tex('m=' + m) + ') and ' + tex('Y:\\ ' + y.join(',\\ ')) + ' (' + tex('n=' + n) + '), all values distinct. We test whether ' + tex('X') + ' has a larger scale than ' + tex('Y') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Siegel-Tukey ranks of the sorted combined data: rank ' + tex('1') + ' to the smallest value, ' + tex('2') + ' to the largest, ' + tex('3') + ' to the next largest, ' + tex('4') + ' and ' + tex('5') + ' to the next two smallest, then the next two largest, and so on. Find the rank sum ' + tex('W_{ST}') + ' of ' + tex('X') + '. Give a whole number.',
        answer: wST, tolerance: tolInt, lecture: 6,
        explanation: 'Sorted data ' + sorted.join(', ') + ' receive Siegel-Tukey ranks ' + st.join(', ') + '. The ' + tex('X') + ' values have ranks ' + x.map((v) => st[sorted.indexOf(v)]).join(', ') + ', which sum to ' + wST + '.',
      },
      {
        prompt: 'Ansari-Bradley ranks: ' + tex('1') + ' to both the smallest and the largest value, ' + tex('2') + ' to the next smallest and next largest, and so on. Find the rank sum ' + tex('W_{AB}') + ' of ' + tex('X') + '. Give a whole number.',
        answer: wAB, tolerance: tolInt, lecture: 6,
        explanation: 'The Ansari-Bradley ranks of the sorted data are ' + sorted.map((_, i) => Math.min(i + 1, N + 1 - (i + 1))).join(', ') + '. The ' + tex('X') + ' values have ranks ' + x.map((v) => { const i = sorted.indexOf(v) + 1; return Math.min(i, N + 1 - i) }).join(', ') + ', which sum to ' + wAB + '. A small value points to a larger scale for ' + tex('X') + '.',
      },
      {
        prompt: 'Find the ratio of mean absolute deviances ' + tex('\\mathrm{RMD}=\\dfrac{\\sum_i|X_i-\\mathrm{median}(X)|/m}{\\sum_j|Y_j-\\mathrm{median}(Y)|/n}') + '.',
        answer: rmd, tolerance: tol4, lecture: 6,
        explanation: 'The medians are ' + dec(mx) + ' and ' + dec(my) + '. Mean absolute deviances: ' + dec(mad(x, mx)) + ' for ' + tex('X') + ' and ' + dec(mad(y, my)) + ' for ' + tex('Y') + ', so ' + tex('\\mathrm{RMD}=' + dec(rmd)) + '. A large value indicates larger dispersion of ' + tex('X') + '.',
      },
      {
        prompt: 'How many different ways are there to choose which ' + tex(m) + ' of the ' + tex(N) + ' pooled values belong to ' + tex('X') + '? Give a whole number.',
        answer: total, tolerance: tolInt, lecture: 6,
        explanation: tex('\\binom{' + N + '}{' + m + '}=' + total) + '. Under ' + tex('H_0') + ' each choice is equally likely.',
      },
      {
        prompt: 'Find the exact one-sided permutation p-value ' + tex('P(W_{ST}\\le' + wST + ')') + ' by listing the possible rank sums of ' + tex(m) + ' of the Siegel-Tukey ranks ' + tex('1,\\dots,' + N) + '.',
        answer: p, tolerance: tol4, lecture: 6,
        explanation: 'Under ' + tex('H_0') + ' every choice of ' + tex(m) + ' of the ranks ' + tex('1,\\dots,' + N) + ' for ' + tex('X') + ' is equally likely. ' + le + ' of the ' + total + ' choices have rank sum at most ' + wST + ', so ' + tex('p=' + le + '/' + total) + ' = ' + dec(p) + '.',
      },
    ],
  }
}

export const genP: LQGenerator = { id: 'np-lq-p-scale', generate: (rng) => build(sample(rng)) }
