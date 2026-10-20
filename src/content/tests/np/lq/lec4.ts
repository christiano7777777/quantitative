// np lecture 4 (K samples): one story. Three groups: Kruskal-Wallis rank sums, H and its chi-square p-value (2 degrees of freedom),
// a pairwise comparison of mean ranks, and the Jonckheere-Terpstra statistic and its z score for an ordered alternative.
// Lecture 4.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { g: number[][] }

export function sample(rng: Rng): Params {
  const vals = rng.sample(Array.from({ length: 40 }, (_, i) => i + 1), 9)
  return { g: [vals.slice(0, 3), vals.slice(3, 6), vals.slice(6)] }
}

export function build({ g }: Params): LQInstance {
  const all = g.flat()
  const N = all.length
  const sorted = [...all].sort((a, b) => a - b)
  const rank = (v: number) => sorted.indexOf(v) + 1
  const R = g.map((a) => a.reduce((s, v) => s + rank(v), 0))
  const H = (12 / (N * (N + 1))) * R.reduce((s, r, i) => s + (r * r) / g[i].length, 0) - 3 * (N + 1)
  const p = Math.exp(-H / 2)
  const diff = Math.abs(R[0] / g[0].length - R[2] / g[2].length)
  // Jonckheere-Terpstra: pairs (a in group i, b in group j), i < j, with b > a
  let J = 0
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) for (const a of g[i]) for (const b of g[j]) if (b > a) J++
  const ns = g.map((a) => a.length)
  const meanJ = (N * N - ns.reduce((s, k) => s + k * k, 0)) / 4
  const varJ = (N * N * (2 * N + 3) - ns.reduce((s, k) => s + k * k * (2 * k + 3), 0)) / 72
  const z = (J - meanJ) / Math.sqrt(varJ)
  const names = ['A', 'B', 'C']

  return {
    intro: 'A farm tries three fertiliser doses (low ' + tex('A') + ', medium ' + tex('B') + ', high ' + tex('C') + ') on three plots each; the yields are ' + g.map((a, i) => tex(names[i] + ':\\ ' + a.join(',\\ '))).join(', ') + '. All ' + tex(N) + ' values are distinct. Compare the doses with rank methods, treating the ' + tex(N) + ' values as one ranked sample. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Rank all ' + tex(N) + ' yields together (smallest = 1). Find the rank sum ' + tex('R_A') + ' of dose ' + tex('A') + '. Give a whole number.',
        answer: R[0], tolerance: tolInt, lecture: 4,
        explanation: 'Dose ' + tex('A') + ' has ranks ' + g[0].map(rank).join(', ') + ', with sum ' + tex(R[0]) + '. The other rank sums are ' + tex(R[1]) + ' and ' + tex(R[2]) + ' (total ' + tex(N * (N + 1) / 2) + ').',
      },
      {
        prompt: 'Find the Kruskal-Wallis statistic ' + tex('H=\\dfrac{12}{N(N+1)}\\sum_k\\dfrac{R_k^2}{n_k}-3(N+1)') + '.',
        answer: H, tolerance: tol4, lecture: 4,
        explanation: 'The rank sums are ' + R.join(', ') + ' and ' + tex('n_k=3') + ': ' + tex('\\frac{12}{' + N * (N + 1) + '}\\times\\frac{' + R.map((r) => r * r).join('+') + '}{3}-' + 3 * (N + 1)) + ' = ' + dec(H) + '.',
      },
      {
        prompt: 'Under ' + tex('H_0') + ', ' + tex('H') + ' is approximately ' + tex('\\chi^2_2') + '. For two degrees of freedom ' + tex('P(\\chi^2_2>h)=e^{-h/2}') + '. Find the approximate p-value. (With only three plots per dose this approximation is rough; the exact permutation p-value is preferred.)',
        answer: p, tolerance: tol4, lecture: 4,
        explanation: tex('e^{-' + dec(H) + '/2}') + ' = ' + dec(p) + '.',
      },
      {
        prompt: 'For a pairwise comparison, find the difference of the mean ranks of doses ' + tex('A') + ' and ' + tex('C') + ', ' + tex('|\\bar R_A-\\bar R_C|') + '.',
        answer: diff, tolerance: tol4, lecture: 4,
        explanation: tex('\\bar R_A=' + R[0] + '/3=' + dec(R[0] / 3)) + ' and ' + tex('\\bar R_C=' + R[2] + '/3=' + dec(R[2] / 3)) + ', difference ' + dec(diff) + '. A multiple-comparison method compares this with a critical value that is larger than for a single comparison.',
      },
      {
        prompt: 'The alternative is ordered: yields increase with the dose. Find the Jonckheere-Terpstra statistic ' + tex('J') + ', the number of pairs (one from a lower dose, one from a higher dose) in which the higher-dose yield is larger. Give a whole number.',
        answer: J, tolerance: tolInt, lecture: 4,
        explanation: 'Count the pairs ' + tex('(A,B)') + ', ' + tex('(A,C)') + ', ' + tex('(B,C)') + ' with the second yield larger: ' + tex('J=' + J) + ' out of ' + tex(27) + ' pairs.',
      },
      {
        prompt: 'Under ' + tex('H_0') + ', ' + tex('E[J]=\\dfrac{N^2-\\sum n_k^2}{4}') + ' and ' + tex('\\mathrm{Var}(J)=\\dfrac{N^2(2N+3)-\\sum n_k^2(2n_k+3)}{72}') + '. Find the standardised statistic ' + tex('z=(J-E[J])/\\sqrt{\\mathrm{Var}(J)}') + ' (with groups this small the normal approximation is rough; the exact permutation p-value is preferred).',
        answer: z, tolerance: tol4, lecture: 4,
        explanation: tex('E[J]=(' + N * N + '-27)/4=' + dec(meanJ)) + ' and ' + tex('\\mathrm{Var}(J)=(' + N * N * (2 * N + 3) + '-' + 3 * 9 * 9 + ')/72=' + dec(varJ)) + ', so ' + tex('z=(' + J + '-' + dec(meanJ) + ')/' + dec(Math.sqrt(varJ))) + ' = ' + dec(z) + '.',
      },
    ],
  }
}

export const genLec4: LQGenerator = { id: 'np-lq-lec4', generate: (rng) => build(sample(rng)) }
