// LQ-F: a cubic regression spline in truncated power form, a smoothing spline's degrees of freedom, and a leave-one-out residual.
// Lecture 9 (basis expansions, splines, smoothing).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  xi1: number; xi2: number; beta: number[] // b0..b5
  x: number
  gamma: number[]; lam: number // smoothing spline eigenvalues
  ys: number[]; i: number // six responses at x = 1..6 for the leave-one-out part
}

export function sample(rng: Rng): Params {
  const xi1 = rng.int(1, 3)
  return {
    xi1, xi2: xi1 + rng.int(2, 3), beta: [rng.int(-3, 3), rng.int(-3, 3), rng.int(-2, 2), rng.int(-1, 1), rng.int(-2, 2) || 1, rng.int(-2, 2) || -1],
    x: rng.pick([0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5]),
    gamma: [0, 0, rng.int(1, 4), rng.int(5, 20), rng.int(20, 100)], lam: rng.pick([0.1, 0.25, 0.5, 1]),
    ys: Array.from({ length: 6 }, () => rng.int(0, 12)), i: rng.int(1, 6),
  }
}

const pos3 = (v: number) => (v > 0 ? v ** 3 : 0)

export function build(p: Params): LQInstance {
  const [b0, b1, b2, b3, b4, b5] = p.beta
  const basis = pos3(p.x - p.xi1)
  const f = b0 + b1 * p.x + b2 * p.x ** 2 + b3 * p.x ** 3 + b4 * pos3(p.x - p.xi1) + b5 * pos3(p.x - p.xi2)
  const jump = 6 * b5
  const df = p.gamma.reduce((s, g) => s + 1 / (1 + p.lam * g), 0)
  const n = 6
  const xs = [1, 2, 3, 4, 5, 6]
  const xb = 3.5
  const sxx = xs.reduce((s, v) => s + (v - xb) ** 2, 0)
  const yb = p.ys.reduce((s, v) => s + v, 0) / n
  const sxy = xs.reduce((s, v, k) => s + (v - xb) * (p.ys[k] - yb), 0)
  const slope = sxy / sxx
  const fit = yb + slope * (p.i - xb)
  const h = 1 / n + (p.i - xb) ** 2 / sxx
  const loo = (p.ys[p.i - 1] - fit) / (1 - h)
  const sg = (v: number) => (v >= 0 ? '+' : '') + v
  const poly = tex('f(x)=' + p.beta[0] + sg(b1) + 'x' + sg(b2) + 'x^2' + sg(b3) + 'x^3' + sg(b4) + '(x-' + p.xi1 + ')_+^3' + sg(b5) + '(x-' + p.xi2 + ')_+^3')

  return {
    intro: 'A cubic regression spline with knots at ' + tex(p.xi1) + ' and ' + tex(p.xi2) + ' is ' + poly + ', where ' + tex('(u)_+=\\max(u,0)') + '. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Evaluate the basis function ' + tex('(x-' + p.xi1 + ')_+^3') + ' at ' + tex('x=' + dec(p.x)) + '.',
        answer: basis, tolerance: tol3, lecture: 9,
        explanation: p.x > p.xi1 ? tex('(' + dec(p.x) + '-' + p.xi1 + ')^3') + ' = ' + dec(basis) + '.' : tex('x\\le' + p.xi1) + ', so the truncated term is 0.',
      },
      {
        prompt: 'Find ' + tex('f(' + dec(p.x) + ')') + '.',
        answer: f, tolerance: tol3, lecture: 9,
        explanation: 'Evaluate the cubic part and add each truncated term that is active (those with ' + tex('x>\\text{knot}') + '): ' + dec(f) + '.',
      },
      {
        prompt: 'The function and its first two derivatives are continuous at the knots. By how much does the third derivative jump at ' + tex('x=' + p.xi2) + ' (right value minus left value)?',
        answer: jump, tolerance: tol3, lecture: 9,
        explanation: 'Only the term ' + tex(sg(b5) + '(x-' + p.xi2 + ')_+^3') + ' changes there, and its third derivative is ' + tex('6\\cdot' + b5) + ' = ' + jump + ' beyond the knot and 0 before it.',
      },
      {
        prompt: 'A penalised spline fit is a linear smoother with eigenvalues of the roughness penalty ' + tex('\\gamma_j=' + p.gamma.join(',')) + '. Find its effective degrees of freedom ' + tex('\\sum_j1/(1+\\lambda\\gamma_j)') + ' for ' + tex('\\lambda=' + dec(p.lam)) + '.',
        answer: df, tolerance: tol3, lecture: 9,
        explanation: 'The two unpenalised directions (' + tex('\\gamma=0') + ') each count 1, and the others count ' + tex('1/(1+\\lambda\\gamma_j)') + '. The total is ' + dec(df) + '.',
      },
      {
        prompt: 'The responses at ' + tex('x=1,\\dots,6') + ' are ' + p.ys.join(', ') + '. For the straight-line least squares fit (a linear smoother with leverages ' + tex('h_{ii}=\\tfrac1n+(x_i-\\bar x)^2/S_{xx}') + '), find the leave-one-out residual ' + tex('(y_i-\\hat y_i)/(1-h_{ii})') + ' for the observation at ' + tex('x=' + p.i) + '.',
        answer: loo, tolerance: tol3, lecture: 9,
        explanation: tex('\\hat y_i=' + dec(fit) + ',\\ h_{ii}=' + dec(h)) + ', so the leave-one-out residual is ' + tex('(' + p.ys[p.i - 1] + '-' + dec(fit) + ')/(1-' + dec(h) + ')') + ' = ' + dec(loo) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'reg2-lq-f-spline', generate: (rng) => build(sample(rng)) }
