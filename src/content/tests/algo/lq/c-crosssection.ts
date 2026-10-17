// LQ-C: a long-short cross-sectional portfolio: leg returns, spread, capital-weighted return and the rank correlation of signal and return.
// Lecture 4.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { ranks: number[]; rets: number[] }

export function sample(rng: Rng): Params {
  const ranks = rng.shuffle([1, 2, 3, 4, 5, 6])
  const rets = rng.shuffle([-30, -22, -9, -1, 5, 12, 18, 27, 33, -15, 2, 8]).slice(0, 6).map((v) => v / 10) // distinct, in percent
  return { ranks, rets }
}

export function build({ ranks, rets }: Params): LQInstance {
  const n = 6
  const byRank = (r: number) => rets[ranks.indexOf(r)]
  const long = (byRank(6) + byRank(5)) / 2
  const short = (byRank(1) + byRank(2)) / 2
  const ls = long - short
  const gross = ls / 2
  const order = rets.map((v) => rets.filter((w) => w < v).length + 1)
  const d2 = ranks.reduce((s, r, i) => s + (r - order[i]) ** 2, 0)
  const rho = 1 - (6 * d2) / (n * (n * n - 1))
  const table = ranks.map((r, i) => 'stock ' + (i + 1) + ': rank ' + r + ', return ' + dec(rets[i]) + '%').join('; ')

  return {
    intro: 'A strategy ranks six stocks by signal (rank 6 = most attractive) and holds them for a month. ' + table + '. Each month it goes long the top two and short the bottom two, equal weighted within each leg. Give answers to 4 decimal places (returns in percent).',
    parts: [
      {
        prompt: 'Find the average return of the long leg (ranks 5 and 6), in percent.',
        answer: long, tolerance: tol4, lecture: 4,
        explanation: 'Mean of the two best-ranked returns: ' + tex(dec(byRank(6)) + ',\\ ' + dec(byRank(5)) + '\\Rightarrow' + dec(long)) + '.',
      },
      {
        prompt: 'Find the average return of the short leg (ranks 1 and 2), in percent.',
        answer: short, tolerance: tol4, lecture: 4,
        explanation: 'Mean of ' + tex(dec(byRank(1)) + ',\\ ' + dec(byRank(2))) + ' is ' + tex(dec(short)) + '.',
      },
      {
        prompt: 'Find the long-short spread return (long leg minus short leg), in percent.',
        answer: ls, tolerance: tol4, lecture: 4,
        explanation: tex(dec(long) + '-(' + dec(short) + ')=' + dec(ls)) + '. Market-wide moves cancel because the legs are matched in dollars.',
      },
      {
        prompt: 'The book is dollar neutral with 50% of capital long and 50% short (gross exposure 100% of capital). Find the return on capital, ' + tex('\\tfrac12\\times\\text{long}-\\tfrac12\\times\\text{short}') + ', in percent.',
        answer: gross, tolerance: tol4, lecture: 4,
        explanation: tex('0.5\\times' + dec(long) + '-0.5\\times(' + dec(short) + ')=' + dec(gross)) + '.',
      },
      {
        prompt: 'Find the rank correlation (Spearman) between the signal ranks and the realised-return ranks, ' + tex('1-\\dfrac{6\\sum d_i^2}{n(n^2-1)}') + ', where return ranks run from 1 (lowest return) to 6.',
        answer: rho, tolerance: tol4, lecture: 4,
        explanation: tex('\\sum d_i^2=' + d2 + ',\\ 1-6\\times' + d2 + '/(6\\times35)=' + dec(rho)) + '. This is the month\'s information coefficient.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'algo-lq-c-crosssection', generate: (rng) => build(sample(rng)) }
