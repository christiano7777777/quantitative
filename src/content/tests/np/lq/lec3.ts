// np lecture 3 (two-sample scale and distribution): one story. Two samples with the same centre: Ansari-Bradley and Siegel-Tukey
// rank sums, the ratio of mean deviances, an exact permutation p-value, and the two-sample Kolmogorov-Smirnov statistic.
// Lecture 3.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'
import { siegelTukey } from './p-scale'

export interface Params { x: number[]; y: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const vals = rng.sample(Array.from({ length: 30 }, (_, i) => i + 1), 7)
    const x = vals.slice(0, 4), y = vals.slice(4)
    const spread = (a: number[]) => Math.max(...a) - Math.min(...a)
    if (spread(x) > spread(y) + 4) return { x, y }
  }
}

const median = (a: number[]) => { const s = [...a].sort((p, q) => p - q), h = s.length; return h % 2 ? s[(h - 1) / 2] : (s[h / 2 - 1] + s[h / 2]) / 2 }

export function build({ x, y }: Params): LQInstance {
  const m = x.length, n = y.length, N = m + n
  const sorted = [...x, ...y].sort((a, b) => a - b)
  const st = siegelTukey(N)
  const wST = x.reduce((s, v) => s + st[sorted.indexOf(v)], 0)
  const wAB = x.reduce((s, v) => { const i = sorted.indexOf(v) + 1; return s + Math.min(i, N + 1 - i) }, 0)
  const mad = (a: number[]) => { const c = median(a); return a.reduce((s, v) => s + Math.abs(v - c), 0) / a.length }
  const rmd = mad(x) / mad(y)
  let le = 0, total = 0
  for (let mask = 0; mask < 1 << N; mask++) {
    let bits = 0, w = 0
    for (let i = 0; i < N; i++) if (mask & (1 << i)) { bits++; w += st[i] }
    if (bits !== m) continue
    total++
    if (w <= wST) le++
  }
  const p = le / total
  // two-sample Kolmogorov-Smirnov: largest gap between the two empirical cdfs, checked at every pooled value
  const cdf = (a: number[], t: number) => a.filter((v) => v <= t).length / a.length
  const D = Math.max(...sorted.map((t) => Math.abs(cdf(x, t) - cdf(y, t))))
  const scaled = Math.sqrt((m * n) / N) * D

  return {
    intro: 'Two machines fill packets whose weights (grams, centred so that both samples have the same centre) are ' + tex('X:\\ ' + x.join(',\\ ')) + ' (' + tex('m=' + m) + ') and ' + tex('Y:\\ ' + y.join(',\\ ')) + ' (' + tex('n=' + n) + '), all values distinct. ' + tex('X') + ' looks more spread out. Ask whether the scales differ with rank tests, and whether the whole distributions differ with the Kolmogorov-Smirnov statistic. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Ansari-Bradley ranks: ' + tex('1') + ' to both the smallest and the largest value, ' + tex('2') + ' to the next smallest and next largest, and so on. Find the rank sum ' + tex('W_{AB}') + ' of ' + tex('X') + '. Give a whole number.',
        answer: wAB, tolerance: tolInt, lecture: 3,
        explanation: 'The ranks of the sorted data are ' + sorted.map((_, i) => Math.min(i + 1, N - i)).join(', ') + '. The ' + tex('X') + ' values have ranks ' + x.map((v) => { const i = sorted.indexOf(v) + 1; return Math.min(i, N + 1 - i) }).join(', ') + ', with sum ' + tex(wAB) + '. A small sum means ' + tex('X') + ' sits in the extremes.',
      },
      {
        prompt: 'Siegel-Tukey ranks: ' + tex('1') + ' to the smallest value, ' + tex('2') + ' to the largest, ' + tex('3') + ' to the next largest, ' + tex('4') + ' and ' + tex('5') + ' to the next two smallest, and so on alternating. Find the rank sum ' + tex('W_{ST}') + ' of ' + tex('X') + '. Give a whole number.',
        answer: wST, tolerance: tolInt, lecture: 3,
        explanation: 'The sorted data get Siegel-Tukey ranks ' + st.join(', ') + '. The ' + tex('X') + ' values have ranks ' + x.map((v) => st[sorted.indexOf(v)]).join(', ') + ', with sum ' + tex(wST) + '.',
      },
      {
        prompt: 'Find the ratio of mean absolute deviances ' + tex('\\mathrm{RMD}=\\dfrac{\\sum_i|X_i-\\mathrm{median}(X)|/m}{\\sum_j|Y_j-\\mathrm{median}(Y)|/n}') + '.',
        answer: rmd, tolerance: tol4, lecture: 3,
        explanation: 'Mean absolute deviances are ' + dec(mad(x)) + ' for ' + tex('X') + ' and ' + dec(mad(y)) + ' for ' + tex('Y') + ', so ' + tex('\\mathrm{RMD}=' + dec(rmd)) + '. A value well above 1 points to larger scale in ' + tex('X') + '.',
      },
      {
        prompt: 'Find the exact one-sided permutation p-value ' + tex('P(W_{ST}\\le' + wST + ')') + ': among all ' + tex('\\binom{' + N + '}{' + m + '}') + ' ways to give ' + tex('X') + ' ' + tex(m) + ' of the Siegel-Tukey ranks ' + tex('1,\\dots,' + N) + ', the fraction with rank sum at most ' + tex(wST) + '.',
        answer: p, tolerance: tol4, lecture: 3,
        explanation: le + ' of the ' + total + ' choices have rank sum at most ' + wST + ', so ' + tex('p=' + le + '/' + total) + ' = ' + dec(p) + '.',
      },
      {
        prompt: 'Find the two-sample Kolmogorov-Smirnov statistic ' + tex('D=\\max_t|\\hat F_X(t)-\\hat F_Y(t)|') + ' (the largest gap between the two empirical cdfs; check it at every pooled value).',
        answer: D, tolerance: tol4, lecture: 3,
        explanation: 'At the sorted pooled values the gaps ' + tex('|\\hat F_X-\\hat F_Y|') + ' are ' + sorted.map((t) => dec(Math.abs(cdf(x, t) - cdf(y, t)))).join(', ') + '; the largest is ' + dec(D) + '.',
      },
      {
        prompt: 'Find the scaled statistic ' + tex('\\sqrt{mn/(m+n)}\\,D') + ', which is compared with the Kolmogorov distribution (5% point 1.36).',
        answer: scaled, tolerance: tol4, lecture: 3,
        explanation: tex('\\sqrt{' + m * n + '/' + N + '}=' + dec(Math.sqrt((m * n) / N))) + ', so the scaled statistic is ' + tex(dec(Math.sqrt((m * n) / N)) + '\\times' + dec(D)) + ' = ' + dec(scaled) + '.',
      },
    ],
  }
}

export const genLec3: LQGenerator = { id: 'np-lq-lec3', generate: (rng) => build(sample(rng)) }
