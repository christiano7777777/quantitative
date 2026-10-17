// LQ-E: the Ornstein-Uhlenbeck process (mean, variance, covariance) and two Feynman-Kac problems.
// Lectures 6 (SDEs) and 7 (Feynman-Kac).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { theta: number; m: number; sigma: number; x0: number; s: number; T: number; y: number; vol: number; mu: number; r: number; x1: number; Tp: number }

export function sample(rng: Rng): Params {
  const s = rng.pick([0.5, 1])
  return {
    theta: rng.int(5, 20) / 10, m: rng.int(-10, 10) / 10, sigma: rng.int(3, 10) / 10, x0: rng.int(-20, 20) / 10, s, T: s + rng.pick([0.5, 1, 1.5]),
    y: rng.int(-20, 20) / 10, vol: rng.int(5, 15) / 10, mu: rng.int(-10, 10) / 100, r: rng.int(2, 8) / 100, x1: rng.int(-10, 10) / 10, Tp: rng.pick([0.5, 1, 2]),
  }
}

export function build({ theta, m, sigma, x0, s, T, y, vol, mu, r, x1, Tp }: Params): LQInstance {
  const mean = m + (x0 - m) * Math.exp(-theta * T)
  const varT = (sigma * sigma * (1 - Math.exp(-2 * theta * T))) / (2 * theta)
  const varS = (sigma * sigma * (1 - Math.exp(-2 * theta * s))) / (2 * theta)
  const cov = Math.exp(-theta * (T - s)) * varS
  const u4 = y ** 4 + 6 * y * y * vol * vol * Tp + 3 * vol ** 4 * Tp * Tp
  const u5 = Math.exp(x1 + (mu + 0.5 * vol * vol - r) * Tp)
  const sde = tex('dX_t=' + dec(theta) + '(' + dec(m) + '-X_t)\\,dt+' + dec(sigma) + '\\,dW_t')

  return {
    intro: 'The Ornstein-Uhlenbeck process ' + sde + ' starts at ' + tex('X_0=' + dec(x0)) + '. Give every answer to 4 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('E[X_{' + dec(T) + '}]') + '.',
        answer: mean, tolerance: tol4, lecture: 6,
        explanation: tex('m\'=\\theta(\\mu-m)') + ' gives ' + tex('E[X_t]=\\mu+(x_0-\\mu)e^{-\\theta t}=' + dec(m) + '+(' + dec(x0 - m) + ')e^{-' + dec(theta * T) + '}=' + dec(mean)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\operatorname{Var}(X_{' + dec(T) + '})') + '.',
        answer: varT, tolerance: tol4, lecture: 6,
        explanation: tex('X_t') + ' is Gaussian with ' + tex('\\operatorname{Var}=\\dfrac{\\sigma^2}{2\\theta}(1-e^{-2\\theta t})=\\dfrac{' + dec(sigma * sigma) + '}{' + dec(2 * theta) + '}(1-e^{-' + dec(2 * theta * T) + '})=' + dec(varT)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\operatorname{Cov}(X_{' + dec(s) + '},X_{' + dec(T) + '})') + '.',
        answer: cov, tolerance: tol4, lecture: 6,
        explanation: tex('\\operatorname{Cov}(X_s,X_t)=e^{-\\theta(t-s)}\\operatorname{Var}(X_s)') + ' for ' + tex('s<t') + ' (the noise after ' + tex('s') + ' is independent of ' + tex('X_s') + '): ' + tex('e^{-' + dec(theta * (T - s)) + '}\\times' + dec(varS) + '=' + dec(cov)) + '.',
      },
      {
        prompt: 'Let ' + tex('u(t,x)') + ' solve ' + tex('u_t+\\tfrac12(' + dec(vol) + ')^2u_{xx}=0') + ' with ' + tex('u(' + dec(Tp) + ',x)=x^4') + '. Use Feynman-Kac to find ' + tex('u(0,' + dec(y) + ')') + '.',
        answer: u4, tolerance: tol4, lecture: 7,
        explanation: tex('u(0,x)=E[(x+\\sigma W_T)^4]=x^4+6x^2\\sigma^2T+3\\sigma^4T^2=' + dec(y ** 4) + '+' + dec(6 * y * y * vol * vol * Tp) + '+' + dec(3 * vol ** 4 * Tp * Tp) + '=' + dec(u4)) + '.',
      },
      {
        prompt: 'Let ' + tex('u(t,x)') + ' solve ' + tex('u_t+' + dec(mu) + 'u_x+\\tfrac12(' + dec(vol) + ')^2u_{xx}-' + dec(r) + 'u=0') + ' with ' + tex('u(' + dec(Tp) + ',x)=e^x') + '. Use Feynman-Kac to find ' + tex('u(0,' + dec(x1) + ')') + '.',
        answer: u5, tolerance: tol4, lecture: 7,
        explanation: tex('u(0,x)=e^{-rT}E[e^{x+\\mu T+\\sigma W_T}]=\\exp\\{x+(\\mu+\\tfrac12\\sigma^2-r)T\\}=\\exp\\{' + dec(x1) + '+(' + dec(mu + 0.5 * vol * vol - r) + ')\\cdot' + dec(Tp) + '\\}=' + dec(u5)) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'sc-lq-e-ou-fk', generate: (rng) => build(sample(rng)) }
