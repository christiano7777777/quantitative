// LQ-E: a bivariate VAR(1): stability (largest eigenvalue), one- and two-step forecasts, an impulse response, the stationary mean.
// Lecture 6 (VAR models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, pm, tex, tol4 } from '../../../shared/format'

export interface Params { A: number[][]; c: number[]; y: number[] } // entries in tenths of the shown value

export const eig = (A: number[][]) => {
  const tr = A[0][0] + A[1][1]
  const d = (A[0][0] - A[1][1]) ** 2 + 4 * A[0][1] * A[1][0]
  return (tr + Math.sqrt(d)) / 2
}

export function sample(rng: Rng): Params {
  for (;;) {
    const A = [[rng.int(1, 6) / 10, rng.int(1, 6) / 10], [rng.int(1, 6) / 10, rng.int(1, 6) / 10]]
    const l = eig(A)
    if (l > 0.3 && l < 0.95) return { A, c: [rng.int(1, 5) / 10, rng.int(1, 5) / 10], y: [rng.int(-20, 20) / 10, rng.int(-20, 20) / 10] }
  }
}

export function build({ A, c, y }: Params): LQInstance {
  const lam = eig(A)
  const f1 = [c[0] + A[0][0] * y[0] + A[0][1] * y[1], c[1] + A[1][0] * y[0] + A[1][1] * y[1]]
  const f2 = [c[0] + A[0][0] * f1[0] + A[0][1] * f1[1], c[1] + A[1][0] * f1[0] + A[1][1] * f1[1]]
  const a2 = [[A[0][0] * A[0][0] + A[0][1] * A[1][0], A[0][0] * A[0][1] + A[0][1] * A[1][1]], [A[1][0] * A[0][0] + A[1][1] * A[1][0], A[1][0] * A[0][1] + A[1][1] * A[1][1]]]
  const irf = a2[0][1]
  const det = (1 - A[0][0]) * (1 - A[1][1]) - A[0][1] * A[1][0]
  const mu1 = ((1 - A[1][1]) * c[0] + A[0][1] * c[1]) / det
  const mat = pm(A.map((row) => row.map(dec)))

  return {
    intro:
      'A bivariate VAR(1) is ' + tex('y_t=c+Ay_{t-1}+\\varepsilon_t') + ' with ' + tex('c=(' + c.map(dec).join(',') + ')^\\top') + ' and ' + tex('A=' + mat) + '. The last observation is ' + tex('y_T=(' + y.map(dec).join(',') + ')^\\top') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Both eigenvalues of ' + tex('A') + ' are real. Find the larger one; the VAR is stationary if its modulus is below 1.',
        answer: lam, tolerance: tol4, lecture: 6,
        explanation: 'For a ' + tex('2\\times2') + ' matrix, ' + tex('\\lambda=\\frac{\\mathrm{tr}A+\\sqrt{(a_{11}-a_{22})^2+4a_{12}a_{21}}}{2}') + ' = ' + dec(lam) + '.',
      },
      {
        prompt: 'Find the one-step forecast of the first variable, ' + tex('E_T[y_{1,T+1}]') + '.',
        answer: f1[0], tolerance: tol4, lecture: 6,
        explanation: tex(dec(c[0]) + '+' + dec(A[0][0]) + '\\cdot' + dec(y[0]) + '+' + dec(A[0][1]) + '\\cdot' + dec(y[1])) + ' = ' + dec(f1[0]) + '.',
      },
      {
        prompt: 'Find the two-step forecast of the second variable, ' + tex('E_T[y_{2,T+2}]') + '.',
        answer: f2[1], tolerance: tol4, lecture: 6,
        explanation: 'First ' + tex('E_T[y_{T+1}]=(' + f1.map(dec).join(',') + ')') + ', then apply the equation again: ' + dec(f2[1]) + '.',
      },
      {
        prompt: 'The impulse response of ' + tex('y_{1}') + ' two periods after a unit shock to the innovation of ' + tex('y_{2}') + ' is the entry in row 1, column 2 of ' + tex('A^2') + '. Find it.',
        answer: irf, tolerance: tol4, lecture: 6,
        explanation: tex('(A^2)_{12}=a_{11}a_{12}+a_{12}a_{22}=' + dec(A[0][0]) + '\\cdot' + dec(A[0][1]) + '+' + dec(A[0][1]) + '\\cdot' + dec(A[1][1])) + ' = ' + dec(irf) + '.',
      },
      {
        prompt: 'Find the stationary mean of the first variable, the first component of ' + tex('(I-A)^{-1}c') + '.',
        answer: mu1, tolerance: tol4, lecture: 6,
        explanation: 'With ' + tex('\\det(I-A)=' + dec(det)) + ', ' + tex('\\mu_1=\\{(1-a_{22})c_1+a_{12}c_2\\}/\\det(I-A)') + ' = ' + dec(mu1) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'ts2-lq-e-var', generate: (rng) => build(sample(rng)) }
