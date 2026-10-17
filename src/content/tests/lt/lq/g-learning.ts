// LQ-G: Hedge weights, ridge regression and its stability under replacing one example, SGD by hand and the bias-variance decomposition.
// Lectures 7 (online learning), 8 (stability), 9 (convex learning), 10 (modern theory).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  L: number[]; eta: number
  xs: number[]; ys: number[]; lamTenths: number; k: number; xNew: number; yNew: number
  eta2Halves: number; zs: number[]
  f0: number; preds: number[]; sigma2: number
}

export function sample(rng: Rng): Params {
  const xs = Array.from({ length: 4 }, () => rng.int(1, 4))
  const ys = Array.from({ length: 4 }, () => rng.int(-4, 8))
  const k = rng.int(0, 3)
  let xNew: number, yNew: number
  do { xNew = rng.int(1, 4); yNew = rng.int(-4, 8) } while (xNew === xs[k] && yNew === ys[k])
  const zs = Array.from({ length: 4 }, () => rng.int(-30, 40) / 10 + 0.05) // values like 1.25, never a multiple of 0.5
  return {
    L: Array.from({ length: 3 }, () => rng.int(0, 8)), eta: rng.pick([0.25, 0.5, 1, 1.5]),
    xs, ys, lamTenths: rng.int(1, 5), k, xNew, yNew,
    eta2Halves: rng.int(1, 3), zs,
    f0: rng.int(-3, 5), preds: Array.from({ length: 5 }, () => rng.int(-6, 10) / 2), sigma2: rng.pick([0.25, 0.5, 1, 2]),
  }
}

const solve = (xs: number[], ys: number[], lam: number) => {
  const sxy = xs.reduce((t, x, i) => t + x * ys[i], 0), sxx = xs.reduce((t, x) => t + x * x, 0)
  return sxy / (sxx + xs.length * lam)
}

export function build(q: Params): LQInstance {
  const lam = q.lamTenths / 10
  const e = q.L.map((l) => Math.exp(-q.eta * l))
  const p1 = e[0] / (e[0] + e[1] + e[2])
  const w1 = solve(q.xs, q.ys, lam)
  const xs2 = q.xs.map((x, i) => (i === q.k ? q.xNew : x)), ys2 = q.ys.map((y, i) => (i === q.k ? q.yNew : y))
  const w2 = solve(xs2, ys2, lam)
  const step = q.eta2Halves / 2
  let w = 0
  const iters: number[] = []
  for (const z of q.zs) { iters.push(w); w -= step * Math.sign(w - z) }
  const avg = iters.reduce((t, v) => t + v, 0) / iters.length
  const mean = q.preds.reduce((t, v) => t + v, 0) / q.preds.length
  const bias2 = (mean - q.f0) ** 2
  const variance = q.preds.reduce((t, v) => t + (v - mean) ** 2, 0) / q.preds.length
  const total = bias2 + variance + q.sigma2
  const pts = (xs: number[], ys: number[]) => xs.map((x, i) => tex('(' + x + ',' + ys[i] + ')')).join(', ')
  const sxx = q.xs.reduce((t, x) => t + x * x, 0), sxy = q.xs.reduce((t, x, i) => t + x * q.ys[i], 0)

  return {
    intro: 'Give all answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Hedge over three experts uses weights proportional to ' + tex('e^{-\\eta L_i}') + ' with ' + tex('\\eta=' + dec(q.eta)) + '. The cumulative losses so far are ' + tex('L=(' + q.L.join(',') + ')') + '. What probability does Hedge give to expert 1 in the next round?',
        answer: p1, tolerance: tol4, lecture: 7,
        explanation: 'Weights ' + tex('e^{-\\eta L_i}=' + e.map((v) => dec(v)).join(',\\ ')) + ' sum to ' + tex(dec(e[0] + e[1] + e[2])) + ', so ' + tex('p_1=' + dec(p1)) + '.',
      },
      {
        prompt: 'One-dimensional ridge regression minimises ' + tex('\\frac1m\\sum_i(wx_i-y_i)^2+\\lambda w^2') + ' with ' + tex('\\lambda=' + dec(lam)) + ' on the data ' + pts(q.xs, q.ys) + '. Find the minimiser ' + tex('w_S') + '.',
        answer: w1, tolerance: tol4, lecture: 8,
        explanation: 'Setting the derivative to zero gives ' + tex('w=\\sum x_iy_i/(\\sum x_i^2+m\\lambda)=' + sxy + '/(' + sxx + '+' + q.xs.length + '\\times' + dec(lam) + ')=' + dec(w1)) + '.',
      },
      {
        prompt: 'Replace example number ' + tex(q.k + 1) + ' of the data above by ' + tex('(' + q.xNew + ',' + q.yNew + ')') + ' and refit with the same ' + tex('\\lambda') + '. How large is the change ' + tex('|w_S-w_{S\'}|') + ' in the minimiser?',
        answer: Math.abs(w1 - w2), tolerance: tol4, lecture: 8,
        explanation: 'New data ' + pts(xs2, ys2) + ' give ' + tex('w_{S\'}=' + dec(w2)) + '. The change is ' + tex(dec(Math.abs(w1 - w2))) + ', small because of the regularisation and the factor ' + tex('1/m') + '.',
      },
      {
        prompt: 'SGD minimises ' + tex('f(w)=\\mathbb E|w-Z|') + ' (convex, 1-Lipschitz). Start at ' + tex('w_1=0') + ' with step ' + tex('\\eta=' + dec(step)) + ', and at round ' + tex('t') + ' use the sample ' + tex('z_t') + ' and the subgradient ' + tex('\\mathrm{sign}(w_t-z_t)') + ': ' + tex('w_{t+1}=w_t-\\eta\\,\\mathrm{sign}(w_t-z_t)') + '. With ' + q.zs.map((z, i) => tex('z_' + (i + 1) + '=' + dec(z))).join(', ') + ', find the averaged iterate ' + tex('\\bar w=\\frac14(w_1+w_2+w_3+w_4)') + '.',
        answer: avg, tolerance: tol4, lecture: 9,
        explanation: 'The iterates are ' + tex(iters.map((v) => dec(v)).join(',\\ ')) + ' (each step moves toward ' + tex('z_t') + ' by ' + tex(dec(step)) + '), whose mean is ' + tex(dec(avg)) + '.',
      },
      {
        prompt: 'At a point ' + tex('x_0') + ' the true regression function is ' + tex('f(x_0)=' + q.f0) + ' and the noise variance is ' + tex('\\sigma^2=' + dec(q.sigma2)) + '. Models fitted on five different training sets predict ' + tex(q.preds.map((v) => dec(v)).join(',\\ ')) + ' at ' + tex('x_0') + ' (treat these five values as the whole distribution of the predictor). Find the expected squared error ' + tex('\\mathbb E(\\hat f(x_0)-y)^2') + ' of a new label ' + tex('y') + ' (3 decimal places).',
        answer: total, tolerance: tol3, lecture: 10,
        explanation: 'Mean prediction ' + tex(dec(mean)) + ', so squared bias ' + tex(dec(bias2)) + '; variance of the predictions ' + tex(dec(variance)) + '; noise ' + tex(dec(q.sigma2)) + '. Total ' + tex(dec(total)) + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'lt-lq-g-learning', generate: (rng) => build(sample(rng)) }
