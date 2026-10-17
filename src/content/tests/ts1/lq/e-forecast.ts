// LQ-E: forecasts and forecast-error variances of an ARMA(1,1) with a mean (lecture 6).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'
import { term } from './util'

export interface Params { phi: number; theta: number; mu: number; xT: number; zT: number; sigma2: number }

export function sample(rng: Rng): Params {
  const mu = rng.pick([2, 3, 5, 10])
  return {
    phi: rng.pick([-1, 1]) * rng.int(3, 8) / 10, theta: rng.pick([-1, 1]) * rng.int(2, 8) / 10,
    mu, xT: mu + rng.int(-30, 30) / 10, zT: rng.int(-15, 15) / 10, sigma2: rng.pick([1, 2, 4]),
  }
}

export function build({ phi, theta, mu, xT, zT, sigma2 }: Params): LQInstance {
  const f1 = mu + phi * (xT - mu) + theta * zT
  const f3 = mu + phi * phi * (f1 - mu)
  const psi1 = phi + theta
  const v2 = sigma2 * (1 + psi1 * psi1)
  const v3 = sigma2 * (1 + psi1 * psi1 * (1 + phi * phi))
  const hw = 1.96 * Math.sqrt(v3)
  return {
    intro: 'A causal invertible ARMA(1,1) model is ' + tex('X_t-' + dec(mu) + '=' + dec(phi) + '(X_{t-1}-' + dec(mu) + ')+Z_t' + term(theta, 'Z_{t-1}')) + ', with white noise variance ' + tex('\\sigma^2=' + dec(sigma2)) + '. At the forecast origin ' + tex('T') + ' we have ' + tex('X_T=' + dec(xT)) + ' and the innovation ' + tex('Z_T=' + dec(zT)) + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the one-step forecast ' + tex('\\hat X_T(1)=E[X_{T+1}\\mid\\text{past}]') + '.',
        answer: f1, tolerance: tol3, lecture: 6,
        explanation: tex('\\hat X_T(1)=\\mu+\\phi(X_T-\\mu)+\\theta Z_T=' + dec(mu) + '+' + dec(phi) + '\\cdot' + dec(xT - mu) + '+' + dec(theta) + '\\cdot' + dec(zT)) + ' = ' + dec(f1) + '.',
      },
      {
        prompt: 'Find the three-step forecast ' + tex('\\hat X_T(3)') + '.',
        answer: f3, tolerance: tol3, lecture: 6,
        explanation: 'Beyond one step the future noise has mean zero, so deviations decay by ' + tex('\\phi') + ' per step: ' + tex('\\hat X_T(3)=\\mu+\\phi^2(\\hat X_T(1)-\\mu)') + ' = ' + dec(f3) + '.',
      },
      {
        prompt: 'Find the variance of the two-step forecast error ' + tex('X_{T+2}-\\hat X_T(2)') + '.',
        answer: v2, tolerance: tol3, lecture: 6,
        explanation: 'With ' + tex('\\psi_1=\\phi+\\theta=' + dec(psi1)) + ', the variance is ' + tex('\\sigma^2(1+\\psi_1^2)') + ' = ' + dec(v2) + '.',
      },
      {
        prompt: 'Find the variance of the three-step forecast error.',
        answer: v3, tolerance: tol3, lecture: 6,
        explanation: tex('\\psi_2=\\phi\\psi_1=' + dec(phi * psi1)) + ', so the variance is ' + tex('\\sigma^2(1+\\psi_1^2+\\psi_2^2)') + ' = ' + dec(v3) + '.',
      },
      {
        prompt: 'For normal errors, the 95% prediction interval for ' + tex('X_{T+3}') + ' is ' + tex('\\hat X_T(3)\\pm c') + '. Find the half-width ' + tex('c=1.96\\sqrt{\\text{variance}}') + '.',
        answer: hw, tolerance: tol3, lecture: 6,
        explanation: tex('1.96\\sqrt{' + dec(v3) + '}') + ' = ' + dec(hw) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'ts1-lq-e-forecast', generate: (rng) => build(sample(rng)) }
