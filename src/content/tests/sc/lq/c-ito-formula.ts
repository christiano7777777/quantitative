// LQ-C: Ito's formula applied to functions of Brownian motion: exponential moments, higher moments, drift and noise coefficients, correlated pairs.
// Lecture 4 (Ito's formula).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { a: number; T: number; Tm: number; p: number; q: number; t0: number; x0: number; rho: number; Tc: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const prm: Params = {
      a: rng.pick([-1.5, -1, -0.5, 0.5, 1, 1.5]), T: rng.pick([1, 2]), Tm: rng.int(1, 3),
      p: rng.int(1, 3), q: rng.pick([-3, -2, -1, 1, 2, 3]), t0: rng.int(1, 4), x0: rng.pick([-2, -1, 1, 2, 3]),
      rho: rng.int(1, 8) / 10, Tc: rng.int(1, 3),
    }
    if (2 * prm.p * prm.t0 * prm.x0 + 3 * prm.q * prm.x0 * prm.x0 !== 0) return prm // a zero noise coefficient would make the last-but-one part trivial
  }
}

export function build({ a, T, Tm, p, q, t0, x0, rho, Tc }: Params): LQInstance {
  const mgf = Math.exp((a * a * T) / 2)
  const m6 = 15 * Tm ** 3
  const drift = p * x0 * x0 + p * t0 + 3 * q * x0
  const diff = 2 * p * t0 * x0 + 3 * q * x0 * x0
  const m22 = Tc * Tc * (1 + 2 * rho * rho)
  const f = tex('f(t,x)=' + (p === 1 ? '' : p) + 'tx^2' + (q < 0 ? '-' + -q : '+' + q) + 'x^3')

  return {
    intro: 'Let ' + tex('W') + ' be a standard Brownian motion and use Ito\'s formula where helpful.',
    parts: [
      {
        prompt: 'Ito applied to ' + tex('e^{aW_t}') + ' shows ' + tex('E[e^{aW_t}]') + ' solves a simple ODE. Find ' + tex('E[e^{' + dec(a) + 'W_T}]') + ' for ' + tex('T=' + T) + ' (4 decimal places).',
        answer: mgf, tolerance: { abs: 0.00005 }, lecture: 4,
        explanation: tex('d e^{aW}=ae^{aW}dW+\\tfrac12a^2e^{aW}dt') + ', so ' + tex('m(t)=E[e^{aW_t}]') + ' has ' + tex('m\'=\\tfrac12a^2m') + ' and ' + tex('m(T)=e^{a^2T/2}=e^{' + dec((a * a * T) / 2) + '}=' + dec(mgf)) + '.',
      },
      {
        prompt: 'Use Ito on ' + tex('W_t^n') + ' to find ' + tex('E[W_T^6]') + ' for ' + tex('T=' + Tm) + ' (an integer).',
        answer: m6, tolerance: tolInt, lecture: 4,
        explanation: tex('d(W^n)=nW^{n-1}dW+\\tfrac12n(n-1)W^{n-2}dt') + ', so ' + tex('m_n\'=\\tfrac12n(n-1)m_{n-2}') + ': ' + tex('m_2=T,\\ m_4=3T^2,\\ m_6=15T^3=' + m6) + '.',
      },
      {
        prompt: 'Let ' + tex('X_t=f(t,W_t)') + ' with ' + f + '. Write ' + tex('dX_t=\\mu_t\\,dt+\\sigma_t\\,dW_t') + '. Find the drift ' + tex('\\mu_t') + ' when ' + tex('t=' + t0) + ' and ' + tex('W_t=' + x0) + '.',
        answer: drift, tolerance: tolInt, lecture: 4,
        explanation: tex('f_t=px^2,\\ f_{xx}=2pt+6qx') + ', so ' + tex('\\mu=px^2+pt+3qx=' + p + '(' + x0 + ')^2+' + p + '(' + t0 + ')+3(' + q + ')(' + x0 + ')=' + drift) + ' at ' + tex('(t,x)=(' + t0 + ',' + x0 + ')') + '.',
      },
      {
        prompt: 'For the same process, find the squared noise coefficient ' + tex('\\sigma_t^2') + ' at ' + tex('t=' + t0) + ' and ' + tex('W_t=' + x0) + '.',
        answer: diff * diff, tolerance: tolInt, lecture: 4,
        explanation: tex('\\sigma=f_x=2ptx+3qx^2=2(' + p + ')(' + t0 + ')(' + x0 + ')+3(' + q + ')(' + x0 + ')^2=' + diff) + ' there, so ' + tex('\\sigma^2=' + diff * diff) + '.',
      },
      {
        prompt: 'Let ' + tex('W^1,W^2') + ' be Brownian motions with correlation ' + tex('\\rho=' + dec(rho)) + '. Using ' + tex('dW^1dW^2=\\rho\\,dt') + ', find ' + tex('E[(W^1_TW^2_T)^2]') + ' for ' + tex('T=' + Tc) + ' (3 decimal places).',
        answer: m22, tolerance: tol3, lecture: 4,
        explanation: 'With ' + tex('Y=(W^1W^2)^2') + ', Ito gives ' + tex('E[(W^1W^2)^2]=T^2(1+2\\rho^2)') + ': ' + tex(Tc * Tc + '(1+2\\cdot' + dec(rho * rho) + ')=' + dec(m22)) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'sc-lq-c-ito-formula', generate: (rng) => build(sample(rng)) }
