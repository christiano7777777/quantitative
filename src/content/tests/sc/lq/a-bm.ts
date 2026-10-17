// LQ-A: covariances of Brownian paths, the reflection principle, and the variance of a Wiener integral.
// Lectures 1 (Brownian motion), 2 (properties of paths) and 3 (Ito integral).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex, tol3 } from '../../../shared/format'

export interface Params { s: number; t: number; u: number; a: number; b: number; c: number; d: number; T: number; lev: number; low: number; alpha: number; beta: number; Tw: number }

const nz = (rng: Rng) => rng.pick([-3, -2, -1, 1, 2, 3])
const coef = (a: number) => (a === 1 ? '' : a === -1 ? '-' : String(a))
const sg = (n: number) => (n < 0 ? '' : '+') + n
const plus = (a: number, sym: string) => (a < 0 ? '-' : '+') + (Math.abs(a) === 1 ? '' : Math.abs(a)) + sym

export function sample(rng: Rng): Params {
  const s = rng.int(1, 4) / 2
  const t = s + rng.int(1, 4) / 2
  const u = t + rng.int(1, 4) / 2
  const T = rng.pick([1, 4, 9, 16])
  const lev = rng.int(1, Math.round(2.4 * Math.sqrt(T)))
  return { s, t, u, a: nz(rng), b: nz(rng), c: nz(rng), d: nz(rng), T, lev, low: rng.int(-2, lev - 1), alpha: rng.int(1, 3), beta: nz(rng), Tw: rng.int(1, 3) }
}

export function build({ s, t, u, a, b, c, d, T, lev, low, alpha, beta, Tw }: Params): LQInstance {
  const varAns = a * a * s + 2 * a * b * s + b * b * t
  const covAns = a * c * s + a * d * s + b * c * t + b * d * t
  const pHit = 2 * (1 - normalCdf(lev / Math.sqrt(T)))
  const pJoint = 1 - normalCdf((2 * lev - low) / Math.sqrt(T))
  const wiener = (alpha * alpha * Tw ** 3) / 3 + alpha * beta * Tw * Tw + beta * beta * Tw

  return {
    intro: 'Let ' + tex('W') + ' be a standard Brownian motion. Give every answer to 3 decimal places.',
    parts: [
      {
        prompt: 'For ' + tex('s=' + dec(s) + ',\\ t=' + dec(t)) + ', find ' + tex('\\operatorname{Var}(' + coef(a) + 'W_s' + plus(b, 'W_t') + ')') + '.',
        answer: varAns, tolerance: tol3, lecture: 1,
        explanation: 'Use ' + tex('\\operatorname{Cov}(W_s,W_t)=\\min(s,t)=s') + ': ' + tex(a * a + '(' + dec(s) + ')+2(' + a + ')(' + b + ')(' + dec(s) + ')+' + b * b + '(' + dec(t) + ')=' + dec(varAns)) + '.',
      },
      {
        prompt: 'With also ' + tex('u=' + dec(u)) + ', find ' + tex('\\operatorname{Cov}(' + coef(a) + 'W_s' + plus(b, 'W_t') + ',\\ ' + coef(c) + 'W_t' + plus(d, 'W_u') + ')') + '.',
        answer: covAns, tolerance: tol3, lecture: 1,
        explanation: 'Expand bilinearly with ' + tex('\\operatorname{Cov}(W_x,W_y)=\\min(x,y)') + ': ' + tex(a * c + '\\cdot' + dec(s) + sg(a * d) + '\\cdot' + dec(s) + sg(b * c) + '\\cdot' + dec(t) + sg(b * d) + '\\cdot' + dec(t) + '=' + dec(covAns)) + '.',
      },
      {
        prompt: 'Let ' + tex('M_T=\\max_{0\\le r\\le T}W_r') + ' with ' + tex('T=' + T) + '. Find ' + tex('P(M_T\\ge ' + lev + ')') + ' (use the standard normal cdf ' + tex('\\Phi') + ').',
        answer: pHit, tolerance: tol3, lecture: 2,
        explanation: 'Reflection principle: ' + tex('P(M_T\\ge a)=2P(W_T\\ge a)=2\\{1-\\Phi(' + lev + '/\\sqrt{' + T + '})\\}=2\\{1-\\Phi(' + dec(lev / Math.sqrt(T)) + ')\\}=' + dec(pHit)) + '.',
      },
      {
        prompt: 'For the same ' + tex('T') + ', find ' + tex('P(M_T\\ge ' + lev + ',\\ W_T\\le ' + low + ')') + '.',
        answer: pJoint, tolerance: tol3, lecture: 2,
        explanation: 'Reflect the path after the first hit of ' + tex(String(lev)) + ': ' + tex('P(M_T\\ge a,W_T\\le b)=P(W_T\\ge 2a-b)=1-\\Phi((2a-b)/\\sqrt T)=1-\\Phi(' + dec((2 * lev - low) / Math.sqrt(T)) + ')=' + dec(pJoint)) + ' for ' + tex('b\\le a') + '.',
      },
      {
        prompt: 'Find the variance of the Ito integral ' + tex('\\int_0^{' + Tw + '}(' + coef(alpha) + 't' + (beta < 0 ? '-' : '+') + Math.abs(beta) + ')\\,dW_t') + '.',
        answer: wiener, tolerance: tol3, lecture: 3,
        explanation: 'By the isometry, the variance is ' + tex('\\int_0^{' + Tw + '}(' + coef(alpha) + 't' + (beta < 0 ? '-' + -beta : '+' + beta) + ')^2dt=' + alpha * alpha + '\\cdot' + Tw ** 3 + '/3' + sg(alpha * beta) + '\\cdot' + Tw * Tw + '+' + beta * beta + '\\cdot' + Tw + '=' + dec(wiener)) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'sc-lq-a-bm', generate: (rng) => build(sample(rng)) }
