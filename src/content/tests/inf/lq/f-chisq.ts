// LQ-F: chi-square tests: a 2x3 independence table (Pearson and likelihood ratio statistics) and a binomial goodness of fit
// with one estimated parameter. Lectures 11 (chi-square tests), 9 (likelihood ratio statistic), 3 (MLE of p).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol4 } from '../../../shared/format'

export interface Params {
  table: number[][] // 2 x 3
  counts: number[] // numbers of triples with 0,1,2,3 successes
}

export function sample(rng: Rng): Params {
  const table = [0, 1].map(() => [0, 1, 2].map(() => rng.int(8, 40)))
  const counts = [0, 1, 2, 3].map(() => rng.int(6, 40))
  return { table, counts }
}

const binom3 = [1, 3, 3, 1]

export function build({ table, counts }: Params): LQInstance {
  const rows = table.map((r) => r.reduce((a, b) => a + b, 0))
  const cols = [0, 1, 2].map((j) => table[0][j] + table[1][j])
  const N = rows[0] + rows[1]
  const E = table.map((r, i) => r.map((_, j) => (rows[i] * cols[j]) / N))
  let x2 = 0, g2 = 0
  table.forEach((r, i) => r.forEach((o, j) => { x2 += (o - E[i][j]) ** 2 / E[i][j]; g2 += 2 * o * Math.log(o / E[i][j]) }))
  const M = counts.reduce((a, b) => a + b, 0)
  const phat = (counts[1] + 2 * counts[2] + 3 * counts[3]) / (3 * M)
  const exp = counts.map((_, k) => M * binom3[k] * phat ** k * (1 - phat) ** (3 - k))
  const x2fit = counts.reduce((s, o, k) => s + (o - exp[k]) ** 2 / exp[k], 0)
  const tbl = String.raw`\begin{array}{c|ccc} & C_1 & C_2 & C_3 \\ \hline R_1 & ${table[0].join(' & ')} \\ R_2 & ${table[1].join(' & ')} \end{array}`

  return {
    intro:
      'Do not round intermediate values. A survey classifies ' + tex(N) + ' people by row (' + tex('R_1,R_2') + ') and column (' + tex('C_1,C_2,C_3') + '): $$' + tbl + '$$ ' +
      'Give answers to 2 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Under independence of rows and columns, find the expected count of the cell in row 1, column 1.',
        answer: E[0][0], tolerance: tol2, lecture: 11,
        explanation: tex('E_{11}=\\dfrac{(\\text{row 1 total})(\\text{column 1 total})}{N}=\\dfrac{' + rows[0] + '\\cdot' + cols[0] + '}{' + N + '}') + ' = ' + dec(E[0][0]) + '.',
      },
      {
        prompt: 'Find Pearson\'s statistic ' + tex('X^2=\\sum (O-E)^2/E') + ' for this table. (Its null distribution is chi-square with 2 degrees of freedom.)',
        answer: x2, tolerance: tol2, lecture: 11,
        explanation: 'Sum ' + tex('(O-E)^2/E') + ' over the six cells using ' + tex('E_{ij}=r_ic_j/N') + ': ' + dec(x2) + '.',
      },
      {
        prompt: 'Find the likelihood ratio statistic ' + tex('G^2=-2\\log\\Lambda=2\\sum O\\ln(O/E)') + ' for the same table (natural logarithm). Wilks\' theorem says it is also approximately ' + tex('\\chi^2_2') + '.',
        answer: g2, tolerance: tol2, lecture: 9,
        explanation: 'Evaluate ' + tex('2\\sum O\\ln(O/E)') + ' over the six cells: ' + dec(g2) + '. It is close to ' + tex('X^2=' + dec(x2)) + ', as expected in large samples.',
      },
      {
        prompt: 'In ' + tex(M) + ' groups of three trials, the numbers of groups with 0, 1, 2, 3 successes were ' + tex(counts.join(',')) + '. Under the model that every trial succeeds independently with probability ' + tex('p') + ', find the maximum likelihood estimate ' + tex('\\hat p') + ' (4 decimal places).',
        answer: phat, tolerance: tol4, lecture: 3,
        explanation: tex('\\hat p=\\dfrac{\\text{total successes}}{\\text{total trials}}=\\dfrac{' + (counts[1] + 2 * counts[2] + 3 * counts[3]) + '}{' + 3 * M + '}') + ' = ' + dec(phat) + '.',
      },
      {
        prompt: 'Using the unrounded ' + tex('\\hat p') + ', the expected counts are ' + tex('M\\binom3k\\hat p^k(1-\\hat p)^{3-k}') + ' for ' + tex('k=0,1,2,3') + '. Find the goodness-of-fit statistic ' + tex('X^2') + ' (2 d.p.). It has ' + tex('4-1-1=2') + ' degrees of freedom.',
        answer: x2fit, tolerance: tol2, lecture: 11,
        explanation: 'Expected counts: ' + exp.map((e) => dec(e)).join(', ') + '. Then ' + tex('X^2=\\sum(O-E)^2/E') + ' = ' + dec(x2fit) + '; one degree of freedom is lost to estimating ' + tex('p') + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'inf-lq-f-chisq', generate: (rng) => build(sample(rng)) }
