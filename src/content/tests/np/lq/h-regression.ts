// LQ-H: kernel regression at one point: Nadaraya-Watson, local linear, a moving average, and the window count.
// Lecture 11 (nonparametric regression).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; y: number[]; x0: number; h: number }

export const K = (u: number) => Math.exp(-0.5 * u * u)
export const nw = (x: number[], y: number[], x0: number, h: number) => { const w = x.map((v) => K((x0 - v) / h)); return y.reduce((a, v, i) => a + w[i] * v, 0) / w.reduce((a, v) => a + v, 0) }
export function localLinear(x: number[], y: number[], x0: number, h: number) {
  const w = x.map((v) => K((x0 - v) / h)), d = x.map((v) => v - x0)
  const S0 = w.reduce((a, v) => a + v, 0), S1 = w.reduce((a, v, i) => a + v * d[i], 0), S2 = w.reduce((a, v, i) => a + v * d[i] * d[i], 0)
  const T0 = w.reduce((a, v, i) => a + v * y[i], 0), T1 = w.reduce((a, v, i) => a + v * d[i] * y[i], 0)
  return (S2 * T0 - S1 * T1) / (S0 * S2 - S1 * S1)
}

export function sample(rng: Rng): Params {
  for (;;) {
    const x = rng.sample([1, 2, 3, 4, 5, 6, 7, 8], 5).sort((a, b) => a - b)
    const x0 = rng.pick([1, 2, 3, 4, 5, 6, 7, 8])
    const h = rng.pick([1, 1.5, 2])
    if (x.filter((v) => Math.abs(v - x0) <= h).length >= 2) return { x, y: x.map((v) => Math.round((2 + 0.8 * v + rng.int(-20, 20) / 10) * 10) / 10), x0, h }
  }
}

export function build({ x, y, x0, h }: Params): LQInstance {
  const a = nw(x, y, x0, h), b = localLinear(x, y, x0, h)
  const win = x.map((v, i) => i).filter((i) => Math.abs(x[i] - x0) <= h)
  const box = win.reduce((s, i) => s + y[i], 0) / win.length

  return {
    intro: 'Observations ' + tex('(x_i,y_i)') + ' are ' + tex(x.map((v, i) => '(' + v + ',' + dec(y[i]) + ')').join(',\\ ')) + '. Estimate the regression function at ' + tex('x_0=' + x0) + ' with bandwidth ' + tex('h=' + dec(h)) + ' using the Gaussian kernel weights ' + tex('w_i=e^{-u_i^2/2}') + ', ' + tex('u_i=(x_0-x_i)/h') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the Nadaraya-Watson estimate ' + tex('\\sum w_iy_i/\\sum w_i') + '.',
        answer: a, tolerance: tol4, lecture: 20,
        explanation: 'Weights ' + tex(x.map((v) => dec(K((x0 - v) / h))).join(',')) + ', so the weighted mean of the ' + tex('y_i') + ' is ' + dec(a) + '.',
      },
      {
        prompt: 'Find the local linear estimate: fit a line by weighted least squares with these weights and evaluate it at ' + tex('x_0') + '. (With ' + tex('d_i=x_i-x_0') + ', ' + tex('S_k=\\sum w_id_i^k') + ', ' + tex('T_k=\\sum w_id_i^ky_i') + ', the fitted value at ' + tex('x_0') + ' is ' + tex('(S_2T_0-S_1T_1)/(S_0S_2-S_1^2)') + '.)',
        answer: b, tolerance: tol4, lecture: 20,
        explanation: 'This is the intercept of the weighted line in the variable ' + tex('d') + ': ' + dec(b) + '.',
      },
      {
        prompt: 'Find the difference between the Nadaraya-Watson and local linear estimates (a measure of the local bias that the linear term corrects).',
        answer: a - b, tolerance: tol4, lecture: 20,
        explanation: tex(dec(a) + '-' + dec(b)) + ' = ' + dec(a - b) + '.',
      },
      {
        prompt: 'With the box kernel (weight 1 for ' + tex('|x_i-x_0|\\le h') + ', 0 otherwise), the estimate is a moving average. Find it.',
        answer: box, tolerance: tol4, lecture: 20,
        explanation: 'The points within ' + tex(dec(h)) + ' of ' + tex(x0) + ' have ' + tex('y') + ' values ' + win.map((i) => dec(y[i])).join(', ') + ', with mean ' + dec(box) + '.',
      },
      {
        prompt: 'How many observations fall inside the box-kernel window ' + tex('|x_i-x_0|\\le h') + '?',
        answer: win.length, tolerance: tolInt, lecture: 20,
        explanation: 'The window ' + tex('[' + dec(x0 - h) + ',' + dec(x0 + h) + ']') + ' holds ' + win.length + ' of the 5 points; a bandwidth with too few points gives a high-variance estimate.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'np-lq-h-regression', generate: (rng) => build(sample(rng)) }
