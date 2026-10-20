// Lecture 6: one utility-demand ARMA(1,1); h-step forecasts, error variances and interval half-width.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { mu: number; phi: number; theta: number; sigma2: number; xT: number; zT: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const mu = rng.pick([50, 60, 70])
    const phi = rng.pick([0.4, 0.5, 0.6])
    const theta = rng.pick([0.2, 0.3, 0.4])
    const xT = mu + rng.pick([-4, -2, 2, 4])
    const zT = rng.pick([-2, -1, 1, 2])
    const f1 = mu + phi * (xT - mu) + theta * zT
    if (Math.abs(f1 - mu) > 0.5) return { mu, phi, theta, sigma2: rng.pick([1, 2, 4]), xT, zT }
  }
}

export function build({ mu, phi, theta, sigma2, xT, zT }: Params): LQInstance {
  const f1 = mu + phi * (xT - mu) + theta * zT
  const f2 = mu + phi * (f1 - mu)
  const psi1 = phi + theta
  const v1 = sigma2
  const v2 = sigma2 * (1 + psi1 * psi1)
  const half = 1.96 * Math.sqrt(v2)
  return {
    intro: 'An electricity utility has fitted ' + tex('X_t-' + dec(mu) + '=' + dec(phi) + '(X_{t-1}-' + dec(mu) + ')+Z_t+' + dec(theta) + 'Z_{t-1}') + ' for a daily demand index. At time ' + tex('T') + ', ' + tex('X_T=' + dec(xT)) + ' and the estimated current shock is ' + tex('z_T=' + dec(zT)) + '. The innovation variance is ' + tex(dec(sigma2)) + ', and innovations are treated as normal. Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the one-step forecast ' + tex('\\hat X_{T+1}') + '.',
        answer: f1, tolerance: tol4, lecture: 6,
        explanation: tex('\\hat X_{T+1}=' + dec(mu) + '+' + dec(phi) + '(' + dec(xT) + '-' + dec(mu) + ')+' + dec(theta) + '(' + dec(zT) + ')=' + dec(f1)) + '.',
      },
      {
        prompt: 'Find the two-step forecast ' + tex('\\hat X_{T+2}') + '.',
        answer: f2, tolerance: tol4, lecture: 6,
        explanation: 'At horizon two the shock term has conditional mean zero: ' + tex('\\hat X_{T+2}=' + dec(mu) + '+' + dec(phi) + '(' + dec(f1) + '-' + dec(mu) + ')=' + dec(f2)) + '.',
      },
      {
        prompt: 'Find the one-step forecast-error variance.',
        answer: v1, tolerance: tol4, lecture: 6,
        explanation: 'The one-step error is ' + tex('Z_{T+1}') + ', so its variance is ' + tex('\\sigma^2=' + dec(v1)) + '.',
      },
      {
        prompt: 'Find the two-step forecast-error variance.',
        answer: v2, tolerance: tol4, lecture: 6,
        explanation: tex('\\psi_0=1') + ' and ' + tex('\\psi_1=\\phi+\\theta=' + dec(psi1)) + ', so ' + tex('\\operatorname{Var}(e_T(2))=\\sigma^2(\\psi_0^2+\\psi_1^2)=' + dec(sigma2) + '(1+' + dec(psi1 * psi1) + ')=' + dec(v2)) + '.',
      },
      {
        prompt: 'Find the half-width of the approximate 95% two-step prediction interval, ' + tex('1.96\\sqrt{\\operatorname{Var}(e_T(2))}') + '.',
        answer: half, tolerance: tol4, lecture: 6,
        explanation: tex('1.96\\sqrt{' + dec(v2) + '}=' + dec(half)) + '. The interval is ' + tex(dec(f2) + '\\pm' + dec(half)) + '.',
      },
    ],
  }
}

export const genLec6: LQGenerator = { id: 'ts1-lq-lec6', generate: (rng) => build(sample(rng)) }
