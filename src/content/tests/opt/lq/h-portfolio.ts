// LQ-H: three-asset mean-variance portfolios: variance of equal weights and the global minimum-variance portfolio.
// Lecture 10 (quadratic programming, minimum-variance portfolios).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, pm, tex, tol3 } from '../../../shared/format'

// S: covariance matrix (percent squared), mu: expected returns (percent)
export interface Params { S: number[][]; mu: number[] }

const det3 = (m: number[][]) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])

export function sample(rng: Rng): Params {
  for (;;) {
    const d = [rng.int(4, 16), rng.int(4, 16), rng.int(4, 16)]
    const c01 = rng.int(-2, 5), c02 = rng.int(-2, 5), c12 = rng.int(-2, 5)
    const S = [[d[0], c01, c02], [c01, d[1], c12], [c02, c12, d[2]]]
    if (d[0] * d[1] - c01 * c01 <= 4 || det3(S) <= 20) continue
    const mu = [rng.int(3, 12), rng.int(3, 12), rng.int(3, 12)]
    if (new Set(mu).size < 3) continue
    return { S, mu }
  }
}

/** Solve S z = 1 by Cramer's rule. */
export function minVar(S: number[][]) {
  const D = det3(S)
  const z = [0, 1, 2].map((i) => det3(S.map((row) => row.map((v, k) => (k === i ? 1 : v)))) / D)
  const tot = z[0] + z[1] + z[2]
  return { w: z.map((v) => v / tot), variance: 1 / tot }
}

export function build({ S, mu }: Params): LQInstance {
  let eq = 0
  for (const row of S) for (const v of row) eq += v
  eq /= 9
  const { w, variance } = minVar(S)
  const ret = w[0] * mu[0] + w[1] * mu[1] + w[2] * mu[2]

  return {
    intro:
      'Three assets have covariance matrix ' + tex('\\Sigma=' + pm(S)) + ' (in squared percent) and expected returns ' + tex('\\mu=(' + mu.join(',') + ')') + ' percent. Portfolio weights ' + tex('w') + ' sum to 1 and short sales are allowed. The minimum-variance portfolio solves ' + tex('\\min\\ w^\\top\\Sigma w') + ' subject to ' + tex('\\mathbf 1^\\top w=1') + ', and the Lagrange condition is ' + tex('\\Sigma w=\\lambda\\mathbf 1') + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the variance of the equally weighted portfolio ' + tex('w=(1/3,1/3,1/3)') + '.',
        answer: eq, tolerance: tol3, lecture: 10,
        explanation: tex('w^\\top\\Sigma w') + ' is one ninth of the sum of all nine entries of ' + tex('\\Sigma') + ': ' + tex(dec(eq * 9) + '/9=' + dec(eq)) + '.',
      },
      {
        prompt: 'Find the weight ' + tex('w_1') + ' of the minimum-variance portfolio.',
        answer: w[0], tolerance: tol3, lecture: 10,
        explanation: 'Solve ' + tex('\\Sigma z=\\mathbf 1') + ' and normalise ' + tex('w=z/\\mathbf 1^\\top z') + ': ' + tex('w=(' + w.map(dec).join(',') + ')') + '.',
      },
      {
        prompt: 'Find the weight ' + tex('w_2') + ' of the minimum-variance portfolio.',
        answer: w[1], tolerance: tol3, lecture: 10,
        explanation: 'From the same solution, ' + tex('w_2=' + dec(w[1])) + '.',
      },
      {
        prompt: 'Find the minimum variance ' + tex('\\sigma^2_{\\min}') + '.',
        answer: variance, tolerance: tol3, lecture: 10,
        explanation: tex('\\sigma^2_{\\min}=1/(\\mathbf 1^\\top\\Sigma^{-1}\\mathbf 1)=' + dec(variance)) + ', which equals the multiplier ' + tex('\\lambda') + ' since ' + tex('w^\\top\\Sigma w=\\lambda\\,\\mathbf 1^\\top w') + '.',
      },
      {
        prompt: 'Find the expected return (in percent) of the minimum-variance portfolio.',
        answer: ret, tolerance: tol3, lecture: 10,
        explanation: tex(w.map((v, i) => '(' + dec(v) + ')(' + mu[i] + ')').join('+') + '=' + dec(ret)) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'opt-lq-h-portfolio', generate: (rng) => build(sample(rng)) }
