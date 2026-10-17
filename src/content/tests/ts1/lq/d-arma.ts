// LQ-D: ACF and PACF of a causal invertible ARMA(1,1) and the order-identification bands (lecture 5).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'
import { term } from './util'

export interface Params { phi: number; theta: number; sigma2: number; n: number }

export function sample(rng: Rng): Params {
  let phi: number, theta: number
  do { phi = rng.pick([-1, 1]) * rng.int(2, 8) / 10; theta = rng.pick([-1, 1]) * rng.int(2, 8) / 10 } while (Math.abs(phi + theta) < 0.15 || Math.abs(phi + theta) > 1.2)
  return { phi, theta, sigma2: rng.pick([1, 2, 4]), n: rng.pick([100, 144, 225, 400]) }
}

export function build({ phi, theta, sigma2, n }: Params): LQInstance {
  const d = 1 + 2 * phi * theta + theta * theta
  const rho1 = ((1 + phi * theta) * (phi + theta)) / d
  const rho2 = phi * rho1
  const pacf2 = (rho2 - rho1 * rho1) / (1 - rho1 * rho1)
  const g0 = (sigma2 * d) / (1 - phi * phi)
  const band = 1.96 / Math.sqrt(n)
  return {
    intro: 'The causal and invertible process ' + tex('X_t=' + dec(phi) + 'X_{t-1}+Z_t' + term(theta, 'Z_{t-1}')) + ' has white noise variance ' + tex('\\sigma^2=' + dec(sigma2)) + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho(1)') + '.',
        answer: rho1, tolerance: tol3, lecture: 5,
        explanation: tex('\\rho(1)=\\frac{(1+\\phi\\theta)(\\phi+\\theta)}{1+2\\phi\\theta+\\theta^2}=\\frac{' + dec((1 + phi * theta) * (phi + theta)) + '}{' + dec(d) + '}') + ' = ' + dec(rho1) + '.',
      },
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho(2)') + '.',
        answer: rho2, tolerance: tol3, lecture: 5,
        explanation: 'For lags ' + tex('h\\ge2') + ' the ACF decays geometrically at rate ' + tex('\\phi') + ': ' + tex('\\rho(2)=\\phi\\rho(1)') + ' = ' + dec(rho2) + '.',
      },
      {
        prompt: 'Find the partial autocorrelation at lag 2, ' + tex('\\phi_{22}') + '.',
        answer: pacf2, tolerance: tol3, lecture: 5,
        explanation: tex('\\phi_{22}=(\\rho(2)-\\rho(1)^2)/(1-\\rho(1)^2)=(' + dec(rho2) + '-' + dec(rho1 * rho1) + ')/(1-' + dec(rho1 * rho1) + ')') + ' = ' + dec(pacf2) + '. The PACF does not cut off for an ARMA(1,1).',
      },
      {
        prompt: 'Find the variance ' + tex('\\gamma(0)') + '.',
        answer: g0, tolerance: tol3, lecture: 5,
        explanation: tex('\\gamma(0)=\\sigma^2(1+2\\phi\\theta+\\theta^2)/(1-\\phi^2)=' + dec(sigma2) + '\\cdot' + dec(d) + '/' + dec(1 - phi * phi)) + ' = ' + dec(g0) + '.',
      },
      {
        prompt: 'To identify the order from a sample of ' + tex('n=' + n) + ' observations, the sample ACF and PACF are compared with the approximate 95% band ' + tex('\\pm1.96/\\sqrt n') + '. Find the half-width ' + tex('1.96/\\sqrt n') + ' of this band.',
        answer: band, tolerance: tol3, lecture: 5,
        explanation: tex('1.96/\\sqrt{' + n + '}') + ' = ' + dec(band) + '. Sample values beyond this width are treated as non-zero.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'ts1-lq-d-arma', generate: (rng) => build(sample(rng)) }
