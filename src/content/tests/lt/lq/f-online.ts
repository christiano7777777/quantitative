// LQ-F: a Perceptron pass, the Hedge regret bound, uniform stability, an SGD rate and the variance of least squares near the interpolation threshold.
// Lectures 7 (online learning), 8 (stability), 9 (convex learning), 10 (modern theory).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params {
  xs: [number, number][]; ys: number[]
  T: number; N: number
  rho: number; lam: number; m: number
  B: number; rho2: number; T2: number
  under: boolean; n: number; p: number; sigma2: number
}

export function sample(rng: Rng): Params {
  const u: [number, number] = [rng.int(1, 3), rng.int(-3, -1)]
  const xs: [number, number][] = []
  const ys: number[] = []
  while (xs.length < 5) {
    const x: [number, number] = [rng.int(-4, 4), rng.int(-4, 4)]
    const s = u[0] * x[0] + u[1] * x[1]
    if (s === 0) continue
    xs.push(x)
    ys.push(s > 0 ? 1 : -1)
  }
  const under = rng.next() < 0.5
  const n = under ? rng.int(12, 16) : rng.int(3, 5)
  const p = under ? rng.int(2, 4) : n + rng.int(8, 12)
  return {
    xs, ys, T: rng.pick([100, 400, 900, 2500, 10000]), N: rng.pick([4, 10, 20, 50, 100, 1000]),
    rho: rng.pick([1, 2, 3]), lam: rng.pick([0.05, 0.1, 0.2, 0.5]), m: rng.pick([100, 200, 500, 1000]),
    B: rng.pick([1, 2, 3, 5]), rho2: rng.pick([1, 2, 4]), T2: rng.pick([100, 400, 900, 2500, 10000]),
    under, n, p, sigma2: rng.pick([1, 2, 4, 0.25, 0.5]),
  }
}

export function build(q: Params): LQInstance {
  // Perceptron, one pass from w = 0; update when y <w, x> <= 0
  let w: [number, number] = [0, 0]
  let mistakes = 0
  q.xs.forEach((x, i) => {
    if (q.ys[i] * (w[0] * x[0] + w[1] * x[1]) <= 0) { w = [w[0] + q.ys[i] * x[0], w[1] + q.ys[i] * x[1]]; mistakes++ }
  })
  const regret = Math.sqrt((q.T * Math.log(q.N)) / 2)
  const beta = (2 * q.rho * q.rho) / (q.lam * q.m)
  const sgd = (q.B * q.rho2) / Math.sqrt(q.T2)
  const risk = q.under ? (q.sigma2 * q.p) / (q.n - q.p - 1) : (q.sigma2 * q.n) / (q.p - q.n - 1)

  const trace = (() => {
    let v: [number, number] = [0, 0]
    const parts: string[] = []
    q.xs.forEach((x, i) => {
      const s = q.ys[i] * (v[0] * x[0] + v[1] * x[1])
      if (s <= 0) { v = [v[0] + q.ys[i] * x[0], v[1] + q.ys[i] * x[1]]; parts.push('round ' + (i + 1) + ': mistake, ' + tex('w=(' + v[0] + ',' + v[1] + ')')) } else parts.push('round ' + (i + 1) + ': correct')
    })
    return parts.join('; ')
  })()

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise. Use natural logarithms.',
    parts: [
      {
        prompt: 'The Perceptron starts at ' + tex('w=(0,0)') + ' and sees, in this order, the examples ' + q.xs.map((x, i) => tex('x=(' + x[0] + ',' + x[1] + '),\\ y=' + (q.ys[i] > 0 ? '+1' : '-1'))).join('; ') + '. On a mistake (' + tex('y\\langle w,x\\rangle\\le0') + ') it sets ' + tex('w\\leftarrow w+yx') + '. After one pass, what is the first component of ' + tex('w') + '?',
        answer: w[0], tolerance: tolInt, lecture: 7,
        explanation: trace + '. The final first component is ' + tex(w[0]) + ' (' + mistakes + ' mistakes).',
      },
      {
        prompt: 'Hedge over ' + tex('N=' + q.N) + ' experts with losses in ' + tex('[0,1]') + ' and the best learning rate ' + tex('\\eta=\\sqrt{8\\ln N/T}') + ' has regret at most ' + tex('\\sqrt{T\\ln N/2}') + '. Evaluate it for ' + tex('T=' + q.T) + ' rounds.',
        answer: regret, tolerance: tol4, lecture: 7,
        explanation: tex('\\sqrt{' + q.T + '\\times' + dec(Math.log(q.N)) + '/2}=' + dec(regret)) + '. The average regret per round is ' + tex(dec(regret / q.T)) + '.',
      },
      {
        prompt: 'Regularised ERM with penalty ' + tex('\\lambda\\|w\\|^2') + ' and a ' + tex('\\rho') + '-Lipschitz convex loss is uniformly stable with ' + tex('\\beta=2\\rho^2/(\\lambda m)') + '. Evaluate ' + tex('\\beta') + ' for ' + tex('\\rho=' + q.rho + ',\\ \\lambda=' + dec(q.lam) + ',\\ m=' + q.m) + '. This is also a bound on the expected generalisation gap.',
        answer: beta, tolerance: tol4, lecture: 8,
        explanation: tex('2\\times' + q.rho * q.rho + '/(' + dec(q.lam) + '\\times' + q.m + ')=' + dec(beta)) + '.',
      },
      {
        prompt: 'For a convex ' + tex('\\rho') + '-Lipschitz problem with ' + tex('\\|w^*\\|\\le B') + ', SGD with step ' + tex('\\eta=B/(\\rho\\sqrt T)') + ' returns an averaged iterate with expected excess risk at most ' + tex('B\\rho/\\sqrt T') + '. Evaluate this for ' + tex('B=' + q.B + ',\\ \\rho=' + q.rho2 + ',\\ T=' + q.T2) + '.',
        answer: sgd, tolerance: tol4, lecture: 9,
        explanation: tex(q.B * q.rho2 + '/\\sqrt{' + q.T2 + '}=' + q.B * q.rho2 + '/' + dec(Math.sqrt(q.T2)) + '=' + dec(sgd)) + '.',
      },
      {
        prompt: q.under
          ? 'Linear regression with Gaussian features ' + tex('x\\sim N(0,I_{' + q.p + '})') + ', true coefficients zero, noise variance ' + tex('\\sigma^2=' + dec(q.sigma2)) + ' and ' + tex('n=' + q.n) + ' training examples is fitted by ordinary least squares. The expected test squared error exceeds the irreducible noise by ' + tex('\\sigma^2\\,p/(n-p-1)') + '. Evaluate this excess.'
          : 'Linear regression with Gaussian features ' + tex('x\\sim N(0,I_{' + q.p + '})') + ', true coefficients zero, noise variance ' + tex('\\sigma^2=' + dec(q.sigma2)) + ' and ' + tex('n=' + q.n) + ' training examples is fitted by the minimum-norm interpolator (more features than examples). The expected test squared error exceeds the irreducible noise by ' + tex('\\sigma^2\\,n/(p-n-1)') + '. Evaluate this excess.',
        answer: risk, tolerance: tol4, lecture: 10,
        explanation: q.under
          ? tex(dec(q.sigma2) + '\\times' + q.p + '/(' + q.n + '-' + q.p + '-1)=' + dec(risk)) + '. This blows up as ' + tex('p\\to n-1') + ', the interpolation threshold.'
          : tex(dec(q.sigma2) + '\\times' + q.n + '/(' + q.p + '-' + q.n + '-1)=' + dec(risk)) + '. This blows up as ' + tex('p\\to n+1') + ' from above, and falls as more features are added: the second descent.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'lt-lq-f-online', generate: (rng) => build(sample(rng)) }
