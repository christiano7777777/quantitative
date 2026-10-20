// Lecture 2: a bridge-sensor linear process with geometric MA(infinity) weights.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { c: number; r: number; sigma2: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const c = rng.pick([1, 2])
    const r = rng.pick([0.2, 0.3, 0.4, 0.5])
    const sigma2 = rng.pick([1, 1.5, 2])
    if (Math.abs(r) < 1 && c * r !== 0) return { c, r, sigma2 }
  }
}

export function build({ c, r, sigma2 }: Params): LQInstance {
  const psi1 = c * r
  const psi2 = c * r * r
  const psi3 = c * r ** 3
  const g0 = sigma2 * c * c / (1 - r * r)
  const g1 = sigma2 * c * c * r / (1 - r * r)
  const g2 = sigma2 * c * c * r * r / (1 - r * r)
  return {
    intro: 'A bridge sensor measures displacement as the linear process ' + tex('X_t=\\mu+\\sum_{j=0}^{\\infty}\\psi_jZ_{t-j}') + ', where ' + tex('\\psi_j=' + dec(c) + '(' + dec(r) + ')^j') + ' and ' + tex('\\{Z_t\\}') + ' is white noise with mean zero and variance ' + tex(dec(sigma2)) + '. Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the coefficient ' + tex('\\psi_1') + ', the effect of last minute\'s shock.',
        answer: psi1, tolerance: tol4, lecture: 2,
        explanation: tex('\\psi_1=' + dec(c) + '(' + dec(r) + ')=' + dec(psi1)) + '.',
      },
      {
        prompt: 'Find the coefficient ' + tex('\\psi_2') + '.',
        answer: psi2, tolerance: tol4, lecture: 2,
        explanation: tex('\\psi_2=' + dec(c) + '(' + dec(r) + ')^2=' + dec(psi2)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\gamma(0)=\\operatorname{Var}(X_t)') + '.',
        answer: g0, tolerance: tol4, lecture: 2,
        explanation: tex('\\gamma(0)=\\sigma^2\\sum_{j=0}^{\\infty}\\psi_j^2=' + dec(sigma2) + '\\frac{' + dec(c * c) + '}{1-' + dec(r * r) + '}=' + dec(g0)) + '.',
      },
      {
        prompt: 'Find the lag-one autocovariance ' + tex('\\gamma(1)') + '.',
        answer: g1, tolerance: tol4, lecture: 2,
        explanation: tex('\\gamma(1)=\\sigma^2\\sum_{j=0}^{\\infty}\\psi_j\\psi_{j+1}=' + dec(sigma2) + '\\frac{' + dec(c * c) + '(' + dec(r) + ')}{1-' + dec(r * r) + '}=' + dec(g1)) + '.',
      },
      {
        prompt: 'Find the lag-two autocovariance ' + tex('\\gamma(2)') + '.',
        answer: g2, tolerance: tol4, lecture: 2,
        explanation: tex('\\gamma(2)=r\\gamma(1)=' + dec(r) + '\\times' + dec(g1) + '=' + dec(g2)) + '.',
      },
      {
        prompt: 'For the Wold representation, future innovations have coefficients indexed from which lag onward? Give the whole-number lag ' + tex('j') + ' of the first shock that is not yet known at time ' + tex('t') + ' when forecasting ' + tex('X_{t+1}') + '.',
        answer: 0, tolerance: tolInt, lecture: 2,
        explanation: 'At time ' + tex('t') + ', the shock ' + tex('Z_{t+1}') + ' is future information. In the representation of ' + tex('X_{t+1}') + ' it has coefficient ' + tex('\\psi_0') + ', so the first unknown shock is at lag ' + tex('0') + '.',
      },
    ],
  }
}

export const genLec2: LQGenerator = { id: 'ts1-lq-lec2', generate: (rng) => build(sample(rng)) }
