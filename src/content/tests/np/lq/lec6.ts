// np lecture 6 (association and trend): one story. Seven students: Pearson correlation, Spearman rank correlation, concordant and
// discordant pairs, Kendall's tau and the Mann-Kendall z statistic, all from the same data.
// Lecture 6.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; y: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const x = rng.sample(Array.from({ length: 30 }, (_, i) => i + 5), 7)
    const y = x.map((v) => v + rng.int(-8, 8))
    if (new Set(y).size === 7 && y.every((v) => v > 0)) return { x, y }
  }
}

const ranks = (v: number[]) => v.map((a) => v.filter((b) => b < a).length + 1)

export function build({ x, y }: Params): LQInstance {
  const n = x.length
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n
  const sxy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0)
  const sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0), syy = y.reduce((s, v) => s + (v - my) ** 2, 0)
  const r = sxy / Math.sqrt(sxx * syy)
  const rx = ranks(x), ry = ranks(y)
  const sd2 = rx.reduce((s, v, i) => s + (v - ry[i]) ** 2, 0)
  const rs = 1 - (6 * sd2) / (n * (n * n - 1))
  let C = 0, D = 0
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const s = (x[i] - x[j]) * (y[i] - y[j])
    if (s > 0) C++
    else if (s < 0) D++
  }
  const pairs = (n * (n - 1)) / 2
  const tau = (C - D) / pairs
  const z = (C - D) / Math.sqrt((n * (n - 1) * (2 * n + 5)) / 18)

  return {
    intro: 'A teacher records for ' + tex(n) + ' students the weekly study hours ' + tex('x:\\ ' + x.join(',\\ ')) + ' and the test score ' + tex('y:\\ ' + y.join(',\\ ')) + ' (in the same student order). All values within each list are distinct. Measure the association between hours and score in three ways. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the Pearson correlation ' + tex('r=\\dfrac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{\\sqrt{\\sum(x_i-\\bar x)^2\\sum(y_i-\\bar y)^2}}') + '.',
        answer: r, tolerance: tol4, lecture: 6,
        explanation: tex('\\bar x=' + dec(mx) + ',\\ \\bar y=' + dec(my)) + '; ' + tex('S_{xy}=' + dec(sxy) + ',\\ S_{xx}=' + dec(sxx) + ',\\ S_{yy}=' + dec(syy)) + ', so ' + tex('r=' + dec(r)) + '. It measures linear association and is sensitive to outliers.',
      },
      {
        prompt: 'Rank the ' + tex('x') + ' values and the ' + tex('y') + ' values separately (smallest = 1). Find the sum of squared rank differences ' + tex('\\sum d_i^2') + '. Give a whole number.',
        answer: sd2, tolerance: tolInt, lecture: 6,
        explanation: 'Ranks of ' + tex('x') + ': ' + rx.join(', ') + '; ranks of ' + tex('y') + ': ' + ry.join(', ') + '; differences squared: ' + rx.map((v, i) => (v - ry[i]) ** 2).join(', ') + ', sum ' + tex(sd2) + '.',
      },
      {
        prompt: 'Find Spearman\'s rank correlation ' + tex('r_S=1-\\dfrac{6\\sum d_i^2}{n(n^2-1)}') + '.',
        answer: rs, tolerance: tol4, lecture: 6,
        explanation: tex('1-\\dfrac{6\\times' + sd2 + '}{' + n * (n * n - 1) + '}') + ' = ' + dec(rs) + '. It is Pearson\'s correlation of the ranks, so it measures monotone association.',
      },
      {
        prompt: 'Count the concordant pairs ' + tex('C') + ': pairs of students ' + tex('i<j') + ' with ' + tex('(x_i-x_j)(y_i-y_j)>0') + '. Give a whole number.',
        answer: C, tolerance: tolInt, lecture: 6,
        explanation: 'Of the ' + tex(pairs) + ' pairs, ' + tex(C) + ' are concordant (both values higher for the same student) and ' + tex(D) + ' are discordant.',
      },
      {
        prompt: 'Find Kendall\'s tau ' + tex('\\tau=\\dfrac{C-D}{n(n-1)/2}') + '.',
        answer: tau, tolerance: tol4, lecture: 6,
        explanation: tex('(' + C + '-' + D + ')/' + pairs) + ' = ' + dec(tau) + '.',
      },
      {
        prompt: 'For the trend test with ' + tex('S=C-D') + ', under no association ' + tex('E[S]=0') + ' and ' + tex('\\mathrm{Var}(S)=\\dfrac{n(n-1)(2n+5)}{18}') + '. Find ' + tex('z=S/\\sqrt{\\mathrm{Var}(S)}') + '.',
        answer: z, tolerance: tol4, lecture: 6,
        explanation: tex('S=' + (C - D) + '') + ', ' + tex('\\mathrm{Var}(S)=' + n * (n - 1) * (2 * n + 5) + '/18=' + dec((n * (n - 1) * (2 * n + 5)) / 18)) + ', so ' + tex('z=' + dec(z)) + '.',
      },
    ],
  }
}

export const genLec6: LQGenerator = { id: 'np-lq-lec6', generate: (rng) => build(sample(rng)) }
