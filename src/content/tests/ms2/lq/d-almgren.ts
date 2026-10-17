// LQ-D: Almgren-Chriss liquidation: the decay rate kappa, the sinh trajectory, TWAP cost and a three-interval discrete schedule.
// Lecture 5 (optimal execution I, Almgren-Chriss).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { X: number; T: number; eta: number; lam: number; sig: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const p = { X: rng.pick([50, 100, 200, 500]), T: rng.pick([2, 3, 4, 5]), eta: rng.pick([0.5, 1, 2, 4]), lam: rng.pick([0.5, 1, 2]), sig: rng.pick([1, 2]) }
    const kT = Math.sqrt((p.lam * p.sig * p.sig) / p.eta) * p.T
    if (kT > 0.7 && kT < 3.5) return p
  }
}

export function build({ X, T, eta, lam, sig }: Params): LQInstance {
  const rho = lam * sig * sig
  const kappa = Math.sqrt(rho / eta)
  const half = (X * Math.sinh(kappa * (T / 2))) / Math.sinh(kappa * T)
  const rate0 = (X * kappa) / Math.tanh(kappa * T)
  const twap = (eta * X * X) / T
  const tau = T / 3
  const a = eta / tau, b = rho * tau
  const x1 = (a * X * (2 * a + b)) / ((a + b) * (3 * a + b))

  return {
    intro:
      'A trader must sell ' + tex('X=' + X) + ' (thousand shares) by time ' + tex('T=' + T) + ' (days). Holdings ' + tex('x(t)') + ' fall from ' + tex('x(0)=X') + ' to ' + tex('x(T)=0') + ', and the trader minimises ' + tex('\\int_0^T\\bigl(\\eta\\dot x^2+\\lambda\\sigma^2x^2\\bigr)dt') +
      ' with temporary impact ' + tex('\\eta=' + dec(eta)) + ', risk aversion ' + tex('\\lambda=' + dec(lam)) + ' and volatility ' + tex('\\sigma=' + sig) + '. The permanent impact term does not depend on the schedule and is ignored. Give answers to 2 decimal places (the first to 4) and do not round intermediate values.',
    parts: [
      {
        prompt: 'Find the urgency parameter ' + tex('\\kappa=\\sqrt{\\lambda\\sigma^2/\\eta}') + '.',
        answer: kappa, tolerance: tol4, lecture: 5,
        explanation: tex('\\sqrt{' + dec(lam) + '\\cdot' + sig * sig + '/' + dec(eta) + '}=' + dec(kappa)) + '. The optimal path is ' + tex('x(t)=X\\sinh(\\kappa(T-t))/\\sinh(\\kappa T)') + '.',
      },
      {
        prompt: 'Find the optimal holdings at the midpoint, ' + tex('x(T/2)') + ' (thousand shares).',
        answer: half, tolerance: { abs: 0.005, rel: 1e-4 }, lecture: 5,
        explanation: tex('X\\sinh(\\kappa T/2)/\\sinh(\\kappa T)=' + X + '\\times\\sinh(' + dec(kappa * T / 2) + ')/\\sinh(' + dec(kappa * T) + ')=' + dec(half)) + '. This is below the straight-line value ' + tex(dec(X / 2)) + ': the trader front-loads.',
      },
      {
        prompt: 'Find the initial selling rate ' + tex('-\\dot x(0)=X\\kappa\\coth(\\kappa T)') + ' (thousand shares per day).',
        answer: rate0, tolerance: { abs: 0.005, rel: 1e-4 }, lecture: 5,
        explanation: tex(X + '\\times' + dec(kappa) + '\\times\\coth(' + dec(kappa * T) + ')=' + dec(rate0)) + ', compared with the TWAP rate ' + tex(dec(X / T)) + '.',
      },
      {
        prompt: 'For comparison, a risk-neutral trader sells at the constant TWAP rate ' + tex('X/T') + '. Find the temporary-impact cost ' + tex('\\eta\\int_0^T\\dot x^2dt') + '.',
        answer: twap, tolerance: { abs: 0.005, rel: 1e-5 }, lecture: 5,
        explanation: tex('\\eta (X/T)^2T=\\eta X^2/T=' + dec(eta) + '\\cdot' + X * X + '/' + T + '=' + dec(twap)) + '.',
      },
      {
        prompt: 'Now trade at three equal intervals of length ' + tex('\\tau=T/3') + ' with end-of-interval holdings ' + tex('x_1,x_2') + ' (and ' + tex('x_0=X,\\ x_3=0') + '), minimising ' + tex('\\sum_{k=1}^{3}\\frac{\\eta}{\\tau}(x_{k-1}-x_k)^2+\\lambda\\sigma^2\\tau\\sum_{k=1}^{2}x_k^2') + '. Find the optimal ' + tex('x_1') + '.',
        answer: x1, tolerance: { abs: 0.005, rel: 1e-4 }, lecture: 5,
        explanation: 'With ' + tex('a=\\eta/\\tau=' + dec(a) + ',\\ b=\\lambda\\sigma^2\\tau=' + dec(b)) + ' the first-order conditions are ' + tex('(2a+b)x_1-ax_2=aX') + ' and ' + tex('(2a+b)x_2-ax_1=0') + ', giving ' + tex('x_1=\\frac{aX(2a+b)}{(a+b)(3a+b)}=' + dec(x1)) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'ms2-lq-d-almgren', generate: (rng) => build(sample(rng)) }
