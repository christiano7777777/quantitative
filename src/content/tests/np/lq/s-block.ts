// LQ-S: a randomized complete block design: rank sums, Friedman, Page's statistic with its null mean, Kendall's W.
// Lecture 11 (Friedman, Page, Cochran's Q, Kendall's W).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { data: number[][]; focus: number } // data[block][treatment]

export function sample(rng: Rng): Params {
  const b = rng.int(4, 6), k = 3
  const data = Array.from({ length: b }, () => rng.sample(Array.from({ length: 30 }, (_, i) => i + 1), k).map((v, t) => v + 3 * t))
  const ok = data.every((row) => new Set(row).size === row.length)
  if (!ok) return sample(rng)
  return { data, focus: rng.int(1, 3) }
}

export function build({ data, focus }: Params): LQInstance {
  const b = data.length, k = data[0].length
  const ranks = data.map((row) => row.map((v) => row.filter((w) => w < v).length + 1))
  const Rp = Array.from({ length: k }, (_, i) => ranks.reduce((s, r) => s + r[i], 0))
  const FM = (12 / (b * k * (k + 1))) * Rp.reduce((s, r) => s + r * r, 0) - 3 * b * (k + 1)
  const PG = Rp.reduce((s, r, i) => s + (i + 1) * r, 0)
  const EPG = (b * k * (k + 1) ** 2) / 4
  const W = FM / (b * (k - 1))

  return {
    intro: tex(b) + ' subjects (blocks) each receive treatments ' + tex('1,2,3') + ' in random order. The scores (treatment 1, 2, 3) are ' + data.map((r, j) => 'subject ' + (j + 1) + ': ' + tex(r.join(',\\ '))).join('; ') + '. Rank the scores within each subject (1 = smallest) and let ' + tex('R_{i+}') + ' be the sum of treatment ' + tex('i') + '\'s ranks over subjects. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the rank sum ' + tex('R_{' + focus + '+}') + ' of treatment ' + tex(focus) + '. Give a whole number.',
        answer: Rp[focus - 1], tolerance: tolInt, lecture: 5,
        explanation: 'Within-subject ranks of treatment ' + tex(focus) + ': ' + ranks.map((r) => r[focus - 1]).join(', ') + ', summing to ' + Rp[focus - 1] + '. (All three rank sums: ' + Rp.join(', ') + ', adding to ' + tex(b * k * (k + 1) / 2) + '.)',
      },
      {
        prompt: 'Find the Friedman statistic ' + tex('FM=\\dfrac{12}{bk(k+1)}\\sum_iR_{i+}^2-3b(k+1)') + '.',
        answer: FM, tolerance: tol4, lecture: 5,
        explanation: tex('\\dfrac{12}{' + b * k * (k + 1) + '}(' + Rp.map((r) => r + '^2').join('+') + ')-' + 3 * b * (k + 1)) + ' = ' + dec(FM) + '. Compare with ' + tex('\\chi^2_{' + (k - 1) + '}') + '.',
      },
      {
        prompt: 'Page\'s statistic for the ordered alternative ' + tex('t_1\\le t_2\\le t_3') + ' is ' + tex('PG=\\sum_i iR_{i+}') + '. Find it. Give a whole number.',
        answer: PG, tolerance: tolInt, lecture: 5,
        explanation: tex('1\\times' + Rp[0] + '+2\\times' + Rp[1] + '+3\\times' + Rp[2]) + ' = ' + PG + '.',
      },
      {
        prompt: 'Find the null mean of Page\'s statistic, ' + tex('E(PG)=bk(k+1)^2/4') + '.',
        answer: EPG, tolerance: tol4, lecture: 5,
        explanation: tex(b + '\\times' + k + '\\times' + (k + 1) + '^2/4') + ' = ' + dec(EPG) + '. ' + tex('PG') + ' well above this supports an increasing order.',
      },
      {
        prompt: 'Find Kendall\'s coefficient of concordance ' + tex('W=FM/\\{b(k-1)\\}') + '. (It is ' + tex('1') + ' when all subjects rank the treatments identically.)',
        answer: W, tolerance: tol4, lecture: 5,
        explanation: tex(dec(FM) + '/(' + b + '\\times' + (k - 1) + ')') + ' = ' + dec(W) + '.',
      },
    ],
  }
}

export const genS: LQGenerator = { id: 'np-lq-s-block', generate: (rng) => build(sample(rng)) }
