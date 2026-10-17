// LQ-F: Yule-Walker and conditional least squares for an AR(1), method of moments for an MA(1) (lecture 7), Ljung-Box statistic of residuals (lecture 10).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { x: number[]; theta: number; r1: number; n: number; r: number[] }

export function sample(rng: Rng): Params {
  let x: number[]
  do x = Array.from({ length: 8 }, () => rng.int(-20, 20))
  while (new Set(x).size < 6)
  const theta = rng.pick([-1, 1]) * rng.int(2, 7) / 10
  return {
    x: x.map((v) => v / 10), theta, r1: Math.round((theta / (1 + theta * theta)) * 1000) / 1000,
    n: rng.pick([50, 60, 80, 100]), r: Array.from({ length: 4 }, () => rng.int(-15, 15) / 100),
  }
}

export function build({ x, r1, n, r }: Params): LQInstance {
  const m = x.length
  let cross = 0, all = 0, head = 0
  for (let t = 0; t < m; t++) all += x[t] * x[t]
  for (let t = 1; t < m; t++) { cross += x[t] * x[t - 1]; head += x[t - 1] * x[t - 1] }
  const yw = cross / all
  const cls = cross / head
  let rss = 0
  for (let t = 1; t < m; t++) rss += (x[t] - cls * x[t - 1]) ** 2
  const s2 = rss / (m - 1)
  const mom = (1 - Math.sqrt(1 - 4 * r1 * r1)) / (2 * r1)
  let q = 0
  for (let k = 1; k <= r.length; k++) q += (r[k - 1] * r[k - 1]) / (n - k)
  q *= n * (n + 2)
  return {
    intro: 'A series of ' + m + ' values with known mean zero is ' + x.map(dec).join(', ') + ' (in time order). Fit the zero-mean model ' + tex('X_t=\\phi X_{t-1}+Z_t') + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the Yule-Walker (method of moments) estimate ' + tex('\\hat\\phi=\\hat\\gamma(1)/\\hat\\gamma(0)') + ', using ' + tex('\\sum_{t=1}^{8}x_t^2') + ' in the denominator and ' + tex('\\sum_{t=2}^{8}x_tx_{t-1}') + ' in the numerator (the common divisor ' + tex('n') + ' cancels).',
        answer: yw, tolerance: tol3, lecture: 7,
        explanation: tex('\\sum x_tx_{t-1}=' + dec(cross) + ',\\ \\sum x_t^2=' + dec(all)) + ', so ' + tex('\\hat\\phi') + ' = ' + dec(yw) + '.',
      },
      {
        prompt: 'Find the conditional least squares estimate, which minimises ' + tex('\\sum_{t=2}^{8}(x_t-\\phi x_{t-1})^2') + '.',
        answer: cls, tolerance: tol3, lecture: 7,
        explanation: tex('\\hat\\phi=\\sum_{t=2}^8x_tx_{t-1}/\\sum_{t=1}^7x_t^2=' + dec(cross) + '/' + dec(head)) + ' = ' + dec(cls) + '. The denominator omits the last squared value.',
      },
      {
        prompt: 'With the conditional least squares estimate, find ' + tex('\\hat\\sigma^2=\\mathrm{RSS}/(n-1)') + ', where RSS is the sum of the 7 squared residuals.',
        answer: s2, tolerance: tol3, lecture: 7,
        explanation: tex('\\mathrm{RSS}=\\sum_{t=2}^8(x_t-\\hat\\phi x_{t-1})^2=' + dec(rss)) + ', so ' + tex('\\hat\\sigma^2=' + dec(rss) + '/7') + ' = ' + dec(s2) + '.',
      },
      {
        prompt: 'For an MA(1) model ' + tex('X_t=Z_t+\\theta Z_{t-1}') + ' a sample has lag-1 autocorrelation ' + tex('r_1=' + dec(r1)) + '. Find the method of moments estimate of ' + tex('\\theta') + ' with ' + tex('|\\hat\\theta|<1') + ' (invertible root of ' + tex('r_1\\theta^2-\\theta+r_1=0') + ').',
        answer: mom, tolerance: tol3, lecture: 7,
        explanation: tex('\\hat\\theta=\\frac{1-\\sqrt{1-4r_1^2}}{2r_1}=\\frac{1-\\sqrt{' + dec(1 - 4 * r1 * r1) + '}}{' + dec(2 * r1) + '}') + ' = ' + dec(mom) + '.',
      },
      {
        prompt: 'The fitted model was applied to a longer series of ' + tex('n=' + n) + ' observations. The residual autocorrelations at lags 1 to 4 are ' + r.map(dec).join(', ') + '. Compute the Ljung-Box statistic ' + tex('Q=n(n+2)\\sum_{k=1}^{4}r_k^2/(n-k)') + '.',
        answer: q, tolerance: tol3, lecture: 10,
        explanation: tex('Q=' + n + '\\cdot' + (n + 2) + '\\sum_k r_k^2/(' + n + '-k)') + ' = ' + dec(q) + '. It is compared with a chi-square law whose degrees of freedom are the number of lags minus the number of fitted ARMA coefficients.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'ts1-lq-f-estimation', generate: (rng) => build(sample(rng)) }
