// Lecture 5: one ARMA(1,1) delay story; causality, invertibility, ACF and identification.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { mu: number; phi: number; theta: number; sigma2: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const phi = rng.pick([0.3, 0.4, 0.5, 0.6])
    const theta = rng.pick([-0.4, -0.2, 0.2, 0.3, 0.4])
    if (Math.abs(phi) < 1 && Math.abs(theta) < 1 && Math.abs(phi + theta) > 0.05)
      return { mu: rng.pick([20, 25, 30]), phi, theta, sigma2: rng.pick([1, 2, 4]) }
  }
}

export function build({ mu, phi, theta, sigma2 }: Params): LQInstance {
  const g0 = sigma2 * (1 + theta * theta + 2 * phi * theta) / (1 - phi * phi)
  const g1 = phi * g0 + theta * sigma2
  const r1 = g1 / g0
  const r2 = phi * r1
  return {
    intro: 'A hospital laboratory models a delayed-report index by ' + tex('X_t-' + dec(mu) + '=' + dec(phi) + '(X_{t-1}-' + dec(mu) + ')+Z_t+' + dec(theta) + 'Z_{t-1}') + ', with innovation variance ' + tex(dec(sigma2)) + '. Its ACF tails off and its PACF also tails off. For model identification, enter 1 for AR(1), 2 for MA(1), or 3 for ARMA(1,1). Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Give the causality code: 1 if the AR root lies outside the unit circle, 0 otherwise.',
        answer: 1, tolerance: tolInt, lecture: 5,
        explanation: 'The AR polynomial is ' + tex('1-' + dec(phi) + 'z') + ', whose root is ' + tex('1/' + dec(phi)) + '. Since ' + tex('|' + dec(phi) + '|<1') + ', the root is outside the unit circle.',
      },
      {
        prompt: 'Give the invertibility code: 1 if the MA root lies outside the unit circle, 0 otherwise.',
        answer: 1, tolerance: tolInt, lecture: 5,
        explanation: 'The MA polynomial is ' + tex('1+' + dec(theta) + 'z') + '. Since ' + tex('|' + dec(theta) + '|<1') + ', its root is outside the unit circle.',
      },
      {
        prompt: 'Find ' + tex('\\gamma(0)') + '.',
        answer: g0, tolerance: tol4, lecture: 5,
        explanation: tex('\\gamma(0)=\\sigma^2\\frac{1+\\theta^2+2\\phi\\theta}{1-\\phi^2}=' + dec(sigma2) + '\\frac{1+' + dec(theta * theta) + '+2(' + dec(phi) + ')(' + dec(theta) + ')}{1-' + dec(phi * phi) + '}=' + dec(g0)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\rho(1)') + '.',
        answer: r1, tolerance: tol4, lecture: 5,
        explanation: tex('\\gamma(1)=\\phi\\gamma(0)+\\theta\\sigma^2=' + dec(phi) + '\\times' + dec(g0) + '+' + dec(theta) + '\\times' + dec(sigma2) + '=' + dec(g1)) + ', so ' + tex('\\rho(1)=' + dec(g1) + '/' + dec(g0) + '=' + dec(r1)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\rho(2)') + '.',
        answer: r2, tolerance: tol4, lecture: 5,
        explanation: tex('\\rho(2)=\\phi\\rho(1)=' + dec(phi) + '\\times' + dec(r1) + '=' + dec(r2)) + '.',
      },
      {
        prompt: 'From the stated ACF and PACF patterns, enter the model code.',
        answer: 3, tolerance: tolInt, lecture: 5,
        explanation: 'An AR has a PACF cutoff, an MA has an ACF cutoff, and an ARMA with both parts has both functions tailing off. The stated pattern is therefore ARMA(1,1), code 3.',
      },
    ],
  }
}

export const genLec5: LQGenerator = { id: 'ts1-lq-lec5', generate: (rng) => build(sample(rng)) }
