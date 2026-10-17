// LQ-E: lasso theory numbers: tuning level, sample size for a sparse rate, an irrepresentable-condition check, noise maximum bound.
// Lectures 2 (sub-Gaussian tails) and 7 (sparse regression).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4, tolInt } from '../../../shared/format'

export interface Params { sigma: number; p: number; n: number; s: number; rate: number; rho: number; c1: number; c2: number; tt: number }

export function sample(rng: Rng): Params {
  return {
    sigma: rng.pick([0.5, 1, 2]), p: rng.pick([500, 1000, 5000, 10000]), n: rng.pick([100, 200, 500]), s: rng.pick([3, 5, 10]), rate: rng.pick([0.05, 0.1]),
    rho: rng.pick([0.2, 0.3, 0.5]), c1: rng.int(1, 5) / 10, c2: rng.int(1, 5) / 10, tt: rng.pick([3, 4, 5]),
  }
}

export function build({ sigma, p, n, s, rate, rho, c1, c2, tt }: Params): LQInstance {
  const lam = sigma * Math.sqrt((2 * Math.log(p)) / n)
  const nNeed = Math.ceil((s * Math.log(p)) / rate)
  const irr = (c1 + c2) / (1 + rho)
  const tail = Math.min(1, 2 * p * Math.exp(-(tt * tt) / (2 * sigma * sigma)))

  return {
    intro: 'In a sparse linear model with Gaussian noise of standard deviation ' + tex('\\sigma=' + dec(sigma)) + ', there are ' + tex('p=' + p) + ' predictors. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A standard choice of the lasso tuning parameter is ' + tex('\\lambda=\\sigma\\sqrt{2\\log p/n}') + '. Find it for ' + tex('n=' + n) + '.',
        answer: lam, tolerance: tol4, lecture: 7,
        explanation: tex(dec(sigma) + '\\sqrt{2\\ln' + p + '/' + n + '}') + ' = ' + dec(lam) + '.',
      },
      {
        prompt: 'The lasso error is of order ' + tex('s\\log p/n') + ' (times ' + tex('\\sigma^2') + '). For a true support size ' + tex('s=' + s) + ', what is the smallest ' + tex('n') + ' for which ' + tex('s\\ln p/n\\le' + dec(rate)) + '?',
        answer: nNeed, tolerance: tolInt, lecture: 7,
        explanation: tex('n\\ge s\\ln p/' + dec(rate) + '=' + s + '\\cdot' + dec(Math.log(p)) + '/' + dec(rate) + '=' + dec((s * Math.log(p)) / rate)) + ', rounded up to ' + nNeed + '.',
      },
      {
        prompt: 'Two active standardised predictors have correlation ' + tex('\\rho=' + dec(rho)) + ' and signs ' + tex('(+,+)') + '. An inactive predictor has correlations ' + tex(dec(c1) + ' and ' + dec(c2)) + ' with them. For these, ' + tex('\\Sigma_{SS}^{-1}(1,1)^\\top=(1,1)^\\top/(1+\\rho)') + '. Find the irrepresentable quantity ' + tex('(c_1+c_2)/(1+\\rho)') + ' (it must be below 1 for exact support recovery).',
        answer: irr, tolerance: tol4, lecture: 7,
        explanation: tex('(' + dec(c1) + '+' + dec(c2) + ')/(1+' + dec(rho) + ')') + ' = ' + dec(irr) + (irr < 1 ? ': the condition holds here.' : ': the condition fails here.'),
      },
      {
        prompt: 'Noise correlations ' + tex('\\xi_j') + ' (' + tex('j=1,\\dots,p') + ') are Gaussian with standard deviation ' + tex('\\sigma=' + dec(sigma)) + '. The union bound gives ' + tex('P(\\max_j|\\xi_j|>t)\\le2p\\,e^{-t^2/(2\\sigma^2)}') + '. Evaluate it at ' + tex('t=' + tt) + ' (cap at 1).',
        answer: tail, tolerance: tol4, lecture: 2,
        explanation: tex('2\\cdot' + p + '\\cdot e^{-' + tt * tt + '/(2\\cdot' + dec(sigma * sigma) + ')}') + ' = ' + dec(2 * p * Math.exp(-(tt * tt) / (2 * sigma * sigma))) + (2 * p * Math.exp(-(tt * tt) / (2 * sigma * sigma)) > 1 ? ', which exceeds 1, so the bound is vacuous.' : '.'),
      },
      {
        prompt: 'Find the threshold ' + tex('t=\\sigma\\sqrt{2\\ln(2p/\\delta)}') + ' for which that union bound equals ' + tex('\\delta=0.05') + ' (3 decimal places).',
        answer: sigma * Math.sqrt(2 * Math.log((2 * p) / 0.05)), tolerance: tol3, lecture: 2,
        explanation: tex('2pe^{-t^2/(2\\sigma^2)}=\\delta') + ' gives ' + tex('t=' + dec(sigma) + '\\sqrt{2\\ln(' + 2 * p + '/0.05)}') + ' = ' + dec(sigma * Math.sqrt(2 * Math.log((2 * p) / 0.05))) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'hd-lq-e-sparse', generate: (rng) => build(sample(rng)) }
