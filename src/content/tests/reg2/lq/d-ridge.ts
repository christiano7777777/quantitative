// LQ-D: ridge regression on a small orthogonal design: OLS and ridge coefficients, effective degrees of freedom, residual sum of squares.
// Lecture 6 (ridge regression, shrinkage, SVD view).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { a: number; b: number; y: number[]; lam: number }

export const U = [1, 1, -1, -1]
export const V = [1, -1, 1, -1]

export function sample(rng: Rng): Params {
  return { a: rng.pick([1, 2, 3]), b: rng.pick([1, 2, 3]), y: Array.from({ length: 4 }, () => rng.int(-6, 6)), lam: rng.pick([2, 4, 5, 8, 10]) }
}

export function build({ a, b, y, lam }: Params): LQInstance {
  const x1 = U.map((u) => a * u), x2 = V.map((v) => b * v)
  const dot = (p: number[], q: number[]) => p.reduce((s, v, i) => s + v * q[i], 0)
  const d1 = dot(x1, x1), d2 = dot(x2, x2)
  const s1 = dot(x1, y), s2 = dot(x2, y)
  const ols1 = s1 / d1
  const r1 = s1 / (d1 + lam), r2 = s2 / (d2 + lam)
  const df = d1 / (d1 + lam) + d2 / (d2 + lam)
  const rss = y.reduce((s, yi, i) => s + (yi - x1[i] * r1 - x2[i] * r2) ** 2, 0)
  const col = (v: number[]) => '\\begin{pmatrix}' + v.join('\\\\') + '\\end{pmatrix}'

  return {
    intro:
      'Four observations have responses ' + tex('y=(' + y.join(',') + ')^\\top') + ' and two predictors (no intercept) ' + tex('x_1=' + col(x1)) + ', ' + tex('x_2=' + col(x2)) +
      '. The ridge estimate minimises ' + tex('\\|y-X\\beta\\|^2+\\lambda\\|\\beta\\|^2') + ' with ' + tex('\\lambda=' + lam) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The columns of ' + tex('X') + ' are orthogonal, so ' + tex('X^\\top X') + ' is diagonal. Find the least squares coefficient ' + tex('\\hat\\beta_1') + '.',
        answer: ols1, tolerance: tol4, lecture: 6,
        explanation: tex('\\hat\\beta_1=x_1^\\top y/x_1^\\top x_1=' + s1 + '/' + d1) + ' = ' + dec(ols1) + '.',
      },
      {
        prompt: 'Find the ridge coefficient ' + tex('\\hat\\beta_1(\\lambda)') + '.',
        answer: r1, tolerance: tol4, lecture: 6,
        explanation: tex('(X^\\top X+\\lambda I)^{-1}X^\\top y') + ' is diagonal here: ' + tex('\\hat\\beta_1=x_1^\\top y/(x_1^\\top x_1+\\lambda)=' + s1 + '/(' + d1 + '+' + lam + ')') + ' = ' + dec(r1) + '.',
      },
      {
        prompt: 'Find the ridge coefficient ' + tex('\\hat\\beta_2(\\lambda)') + '.',
        answer: r2, tolerance: tol4, lecture: 6,
        explanation: tex('\\hat\\beta_2=' + s2 + '/(' + d2 + '+' + lam + ')') + ' = ' + dec(r2) + '.',
      },
      {
        prompt: 'Find the effective degrees of freedom ' + tex('\\sum_jd_j^2/(d_j^2+\\lambda)') + ' of the ridge fit, where ' + tex('d_j^2') + ' are the diagonal entries of ' + tex('X^\\top X') + '.',
        answer: df, tolerance: tol4, lecture: 6,
        explanation: tex('\\dfrac{' + d1 + '}{' + d1 + '+' + lam + '}+\\dfrac{' + d2 + '}{' + d2 + '+' + lam + '}') + ' = ' + dec(df) + ', below the 2 parameters of least squares.',
      },
      {
        prompt: 'Find the residual sum of squares ' + tex('\\|y-X\\hat\\beta(\\lambda)\\|^2') + ' of the ridge fit (3 decimal places).',
        answer: rss, tolerance: tol3, lecture: 6,
        explanation: 'Fitted values ' + tex('\\hat\\beta_1x_1+\\hat\\beta_2x_2') + ' with ' + tex('\\hat\\beta=(' + dec(r1) + ',' + dec(r2) + ')') + ' give RSS ' + dec(rss) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'reg2-lq-d-ridge', generate: (rng) => build(sample(rng)) }
