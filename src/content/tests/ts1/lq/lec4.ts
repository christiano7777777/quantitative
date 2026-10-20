// Lecture 4: one water-quality AR(2); causality, Yule-Walker coefficients and innovation variance.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { phi1: number; phi2: number; gamma0: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const phi1 = rng.pick([0.3, 0.4, 0.5, 0.6])
    const phi2 = rng.pick([0.1, 0.2, 0.25])
    const causal = Math.abs(phi2) < 1 && phi1 + phi2 < 1 && phi2 - phi1 < 1
    const r1 = phi1 / (1 - phi2)
    if (causal && r1 < 0.95) return { phi1, phi2, gamma0: rng.pick([4, 5, 8]) }
  }
}

export function build({ phi1, phi2, gamma0 }: Params): LQInstance {
  const r1 = phi1 / (1 - phi2)
  const r2 = phi1 * r1 + phi2
  const den = 1 - r1 * r1
  const p1 = r1 * (1 - r2) / den
  const p2 = (r2 - r1 * r1) / den
  const sigma2 = gamma0 * (1 - phi1 * r1 - phi2 * r2)
  const r3 = phi1 * r2 + phi2 * r1
  return {
    intro: 'A water-quality station uses the centred causal AR(2) model ' + tex('X_t-\\mu=\\phi_1(X_{t-1}-\\mu)+\\phi_2(X_{t-2}-\\mu)+Z_t') + '. The autocorrelations supplied by a long calibration record are ' + tex('\\rho(1)=' + dec(r1)) + ' and ' + tex('\\rho(2)=' + dec(r2)) + ', and the variance is ' + tex('\\gamma(0)=' + dec(gamma0)) + '. Enter 1 if the AR polynomial has all roots outside the unit circle and 0 otherwise. Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Solve the first Yule-Walker equation pair for ' + tex('\\phi_1') + '.',
        answer: p1, tolerance: tol4, lecture: 4,
        explanation: tex('\\phi_1=\\frac{\\rho_1(1-\\rho_2)}{1-\\rho_1^2}=\\frac{' + dec(r1) + '(1-' + dec(r2) + ')}{1-' + dec(r1 * r1) + '}=' + dec(p1)) + '.',
      },
      {
        prompt: 'Solve the same Yule-Walker equations for ' + tex('\\phi_2') + '.',
        answer: p2, tolerance: tol4, lecture: 4,
        explanation: tex('\\phi_2=\\frac{\\rho_2-\\rho_1^2}{1-\\rho_1^2}=\\frac{' + dec(r2) + '-' + dec(r1 * r1) + '}{' + dec(den) + '}=' + dec(p2)) + '.',
      },
      {
        prompt: 'Find the innovation variance ' + tex('\\sigma^2') + '.',
        answer: sigma2, tolerance: tol4, lecture: 4,
        explanation: tex('\\sigma^2=\\gamma(0)(1-\\phi_1\\rho_1-\\phi_2\\rho_2)=' + dec(gamma0) + '(1-' + dec(phi1) + '\\times' + dec(r1) + '-' + dec(phi2) + '\\times' + dec(r2) + ')=' + dec(sigma2)) + '.',
      },
      {
        prompt: 'Use the Yule-Walker recurrence to find ' + tex('\\rho(3)') + '.',
        answer: r3, tolerance: tol4, lecture: 4,
        explanation: tex('\\rho(3)=\\phi_1\\rho(2)+\\phi_2\\rho(1)=' + dec(phi1) + '\\times' + dec(r2) + '+' + dec(phi2) + '\\times' + dec(r1) + '=' + dec(r3)) + '.',
      },
      {
        prompt: 'Give the causality code for this AR(2).',
        answer: 1, tolerance: tolInt, lecture: 4,
        explanation: 'The coefficients satisfy ' + tex('|\\phi_2|<1') + ', ' + tex('\\phi_1+\\phi_2<1') + ' and ' + tex('\\phi_2-\\phi_1<1') + ', so the roots of ' + tex('1-\\phi_1z-\\phi_2z^2=0') + ' lie outside the unit circle. The code is 1.',
      },
    ],
  }
}

export const genLec4: LQGenerator = { id: 'ts1-lq-lec4', generate: (rng) => build(sample(rng)) }
