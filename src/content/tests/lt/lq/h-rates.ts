// LQ-H: the Perceptron mistake bound, rounds for Hedge, sample size from stability, SGD steps and the minimum-norm interpolator.
// Lectures 7 (online learning), 8 (stability), 9 (convex learning), 10 (modern theory).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol3, tolInt } from '../../../shared/format'

export interface Params {
  u: [number, number]; xs: [number, number][]
  N: number; epsH: number
  rho: number; lam: number; epsS: number
  B: number; rho2: number; epsPct: number
  X: number[][]; y: number[]; xStar: number[]
}

const det2 = (G: number[][]) => G[0][0] * G[1][1] - G[0][1] * G[1][0]

export function sample(rng: Rng): Params {
  const u: [number, number] = [rng.int(1, 3), rng.int(1, 3)]
  const xs: [number, number][] = []
  while (xs.length < 4) {
    const x: [number, number] = [rng.int(-5, 5), rng.int(-5, 5)]
    if (u[0] * x[0] + u[1] * x[1] !== 0) xs.push(x)
  }
  let X: number[][]
  for (;;) {
    X = [0, 1].map(() => [rng.int(-3, 3), rng.int(-3, 3), rng.int(-3, 3)])
    const G = [[0, 0], [0, 0]]
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) G[i][j] = X[i].reduce((t, v, k) => t + v * X[j][k], 0)
    if (Math.abs(det2(G)) >= 6) break
  }
  return {
    u, xs, N: rng.pick([10, 50, 100, 1000]), epsH: rng.pick([0.02, 0.05, 0.1, 0.2]),
    rho: rng.pick([1, 2, 3]), lam: rng.pick([0.05, 0.1, 0.2]), epsS: rng.pick([0.01, 0.02, 0.05]),
    B: rng.pick([1, 2, 3, 5]), rho2: rng.pick([1, 2, 3, 4]), epsPct: rng.pick([5, 10, 15, 20, 25, 30]),
    X, y: [rng.int(-4, 4), rng.int(-4, 4)], xStar: [rng.int(-3, 3), rng.int(-3, 3), rng.int(-3, 3)],
  }
}

export function build(q: Params): LQInstance {
  const s = q.xs.map((x) => Math.abs(q.u[0] * x[0] + q.u[1] * x[1]))
  const labels = q.xs.map((x) => (q.u[0] * x[0] + q.u[1] * x[1] > 0 ? 1 : -1))
  const R2 = Math.max(...q.xs.map((x) => x[0] * x[0] + x[1] * x[1]))
  const un2 = q.u[0] ** 2 + q.u[1] ** 2
  const bound = (R2 * un2) / Math.min(...s) ** 2
  const rounds = Math.ceil(Math.log(q.N) / (2 * q.epsH * q.epsH))
  const mNeed = Math.ceil((2 * q.rho * q.rho) / (q.lam * q.epsS))
  const eps = q.epsPct / 100
  const steps = Math.ceil((q.B * q.rho2 * q.B * q.rho2) / (eps * eps) - 1e-9)
  // minimum-norm interpolator w = X^T (X X^T)^{-1} y
  const G = [[0, 0], [0, 0]]
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) G[i][j] = q.X[i].reduce((t, v, k) => t + v * q.X[j][k], 0)
  const d = det2(G)
  const a = [(G[1][1] * q.y[0] - G[0][1] * q.y[1]) / d, (-G[1][0] * q.y[0] + G[0][0] * q.y[1]) / d]
  const pred = q.xStar.reduce((t, v, k) => t + v * (a[0] * q.X[0][k] + a[1] * q.X[1][k]), 0)
  const kx = [0, 1].map((i) => q.X[i].reduce((t, v, k) => t + v * q.xStar[k], 0))
  const vec = (v: number[]) => tex('(' + v.join(',') + ')')

  return {
    intro: 'Give answers as integers (rounded up) where a count is asked, and otherwise to the number of decimal places stated.',
    parts: [
      {
        prompt: 'Linearly separable data ' + q.xs.map((x, i) => tex('x=(' + x[0] + ',' + x[1] + '),\\ y=' + (labels[i] > 0 ? '+1' : '-1'))).join('; ') + ' are separated by ' + tex('u=(' + q.u[0] + ',' + q.u[1] + ')') + '. With ' + tex('R=\\max\\|x_i\\|') + ' and margin ' + tex('\\gamma=\\min_i y_i\\langle u,x_i\\rangle/\\|u\\|') + ', evaluate the Perceptron mistake bound ' + tex('(R/\\gamma)^2') + ' (2 decimal places).',
        answer: bound, tolerance: tol2, lecture: 7,
        explanation: tex('R^2=' + R2 + ',\\ \\|u\\|^2=' + un2 + ',\\ \\min y\\langle u,x\\rangle=' + Math.min(...s)) + ', so ' + tex('(R/\\gamma)^2=' + R2 + '\\times' + un2 + '/' + Math.min(...s) ** 2 + '=' + dec(bound)) + '.',
      },
      {
        prompt: 'Hedge with the tuned rate over ' + tex('N=' + q.N) + ' experts has average regret at most ' + tex('\\sqrt{\\ln N/(2T)}') + ' after ' + tex('T') + ' rounds. What is the smallest ' + tex('T') + ' guaranteeing average regret at most ' + tex(dec(q.epsH)) + '?',
        answer: rounds, tolerance: tolInt, lecture: 7,
        explanation: tex('T\\ge\\ln N/(2\\varepsilon^2)=' + dec(Math.log(q.N)) + '/' + dec(2 * q.epsH * q.epsH) + '=' + dec(Math.log(q.N) / (2 * q.epsH * q.epsH))) + ', rounded up to ' + tex(rounds) + '.',
      },
      {
        prompt: 'An algorithm is uniformly stable with ' + tex('\\beta=2\\rho^2/(\\lambda m)') + ', where ' + tex('\\rho=' + q.rho) + ' and ' + tex('\\lambda=' + dec(q.lam)) + ', so its expected generalisation gap is at most ' + tex('\\beta') + '. What is the smallest sample size ' + tex('m') + ' for which the gap is at most ' + tex(dec(q.epsS)) + '?',
        answer: mNeed, tolerance: tolInt, lecture: 8,
        explanation: tex('m\\ge2\\rho^2/(\\lambda\\varepsilon)=' + 2 * q.rho * q.rho + '/(' + dec(q.lam) + '\\times' + dec(q.epsS) + ')=' + dec((2 * q.rho * q.rho) / (q.lam * q.epsS))) + ', rounded up to ' + tex(mNeed) + '.',
      },
      {
        prompt: 'SGD on a convex ' + tex('\\rho') + '-Lipschitz problem with ' + tex('\\|w^*\\|\\le B') + ' has expected excess risk at most ' + tex('B\\rho/\\sqrt T') + ' for the averaged iterate. For ' + tex('B=' + q.B + '') + ' and ' + tex('\\rho=' + q.rho2) + ', how many steps ' + tex('T') + ' guarantee excess risk at most ' + tex(dec(eps)) + '?',
        answer: steps, tolerance: tolInt, lecture: 9,
        explanation: tex('T\\ge(B\\rho/\\varepsilon)^2=(' + q.B * q.rho2 + '/' + dec(eps) + ')^2=' + dec((q.B * q.rho2 / eps) ** 2)) + ', rounded up to ' + tex(steps) + '. The count does not depend on the dimension.',
      },
      {
        prompt: 'Two training examples in ' + tex('\\mathbb R^3') + ' have features ' + vec(q.X[0]) + ' and ' + vec(q.X[1]) + ' with labels ' + tex(q.y[0]) + ' and ' + tex(q.y[1]) + '. Among all interpolating linear predictors, the minimum-norm one is ' + tex('w=X^\\top(XX^\\top)^{-1}y') + '. What does it predict at ' + tex('x_*=' + '(' + q.xStar.join(',') + ')') + '? (3 decimal places)',
        answer: pred, tolerance: tol3, lecture: 10,
        explanation: 'Gram matrix ' + tex('XX^\\top=\\begin{pmatrix}' + G[0][0] + '&' + G[0][1] + '\\\\' + G[1][0] + '&' + G[1][1] + '\\end{pmatrix}') + ' with determinant ' + tex(d) + ' gives coefficients ' + tex('a=(XX^\\top)^{-1}y=(' + dec(a[0]) + ',' + dec(a[1]) + ')') + '. The prediction is ' + tex('a_1\\langle x_1,x_*\\rangle+a_2\\langle x_2,x_*\\rangle=' + dec(a[0]) + '\\times' + kx[0] + '+' + dec(a[1]) + '\\times' + kx[1] + '=' + dec(pred)) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'lt-lq-h-rates', generate: (rng) => build(sample(rng)) }
