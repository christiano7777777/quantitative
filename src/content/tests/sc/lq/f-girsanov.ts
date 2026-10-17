// LQ-F: Girsanov's theorem: market price of risk, the density process, an expectation under the new measure, real-world and risk-neutral probabilities, a digital option price.
// Lectures 8 (Girsanov and measure change) and 9 (risk-neutral pricing).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { s0: number; K: number; mu: number; r: number; sigma: number; T: number; w: number }

export function sample(rng: Rng): Params {
  const s0 = rng.int(50, 150)
  const r = rng.int(1, 6) / 100
  return {
    s0, K: Math.round(s0 * rng.int(90, 110) / 100), r, mu: r + rng.int(2, 10) / 100, sigma: rng.int(2, 5) / 10,
    T: rng.pick([0.5, 1, 2]), w: rng.int(-10, 10) / 10,
  }
}

export function build({ s0, K, mu, r, sigma, T, w }: Params): LQInstance {
  const theta = (mu - r) / sigma
  const Z = Math.exp(-theta * w - (theta * theta * T) / 2)
  const eQ = T + theta * theta * T * T
  const dP = (Math.log(s0 / K) + (mu - 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const dQ = (Math.log(s0 / K) + (r - 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const pP = normalCdf(dP)
  const digital = Math.exp(-r * T) * normalCdf(dQ)
  const sde = tex('dS_t=' + dec(mu) + 'S_t\\,dt+' + dec(sigma) + 'S_t\\,dW_t')

  return {
    intro: 'Under the real-world measure ' + tex('P') + ', a stock follows ' + sde + ' with ' + tex('S_0=' + s0) + '. The risk-free rate is ' + tex('r=' + dec(r)) + ' and the horizon is ' + tex('T=' + dec(T)) + '. Let ' + tex('Q') + ' be the risk-neutral measure with ' + tex('dQ/dP=Z_T=\\exp\\{-\\theta W_T-\\tfrac12\\theta^2T\\}') + ', so that ' + tex('\\tilde W_t=W_t+\\theta t') + ' is a ' + tex('Q') + '-Brownian motion. Give the answers to 4 decimal places, except the last two parts (the probability and the price), which need 3 decimal places.',
    parts: [
      {
        prompt: 'Find the market price of risk ' + tex('\\theta') + ' that makes the discounted stock a ' + tex('Q') + '-martingale.',
        answer: theta, tolerance: tol4, lecture: 8,
        explanation: 'Under ' + tex('Q') + ', ' + tex('dS=(\\mu-\\sigma\\theta)S\\,dt+\\sigma S\\,d\\tilde W') + ' and the drift must equal ' + tex('r') + ': ' + tex('\\theta=(\\mu-r)/\\sigma=(' + dec(mu) + '-' + dec(r) + ')/' + dec(sigma) + '=' + dec(theta)) + '.',
      },
      {
        prompt: 'On a path with ' + tex('W_T=' + dec(w)) + ', find the value of the density ' + tex('Z_T') + '.',
        answer: Z, tolerance: tol4, lecture: 8,
        explanation: tex('Z_T=\\exp\\{-' + dec(theta) + '\\cdot(' + dec(w) + ')-\\tfrac12(' + dec(theta) + ')^2\\cdot' + dec(T) + '\\}=' + dec(Z)) + '.',
      },
      {
        prompt: 'Find ' + tex('E_P[Z_TW_T^2]=E_Q[W_T^2]') + '.',
        answer: eQ, tolerance: tol4, lecture: 8,
        explanation: 'Under ' + tex('Q') + ', ' + tex('W_T=\\tilde W_T-\\theta T\\sim N(-\\theta T,T)') + ', so ' + tex('E_Q[W_T^2]=T+\\theta^2T^2=' + dec(T) + '+' + dec(theta * theta * T * T) + '=' + dec(eQ)) + '.',
      },
      {
        prompt: 'Find the real-world probability ' + tex('P(S_T>' + K + ')') + '.',
        answer: pP, tolerance: tol3, lecture: 8,
        explanation: tex('\\ln S_T\\sim N(\\ln S_0+(\\mu-\\sigma^2/2)T,\\sigma^2T)') + ' under ' + tex('P') + ', so the probability is ' + tex('\\Phi(' + dec(dP) + ')=' + dec(pP)) + '.',
      },
      {
        prompt: 'Find the price at time 0 of a digital option paying 1 dollar at time ' + tex('T') + ' if ' + tex('S_T>' + K) + ' (and nothing otherwise).',
        answer: digital, tolerance: tol3, lecture: 9,
        explanation: 'Price ' + tex('=e^{-rT}Q(S_T>K)') + '. Under ' + tex('Q') + ' the drift is ' + tex('r') + ': ' + tex('Q(S_T>K)=\\Phi(' + dec(dQ) + ')=' + dec(normalCdf(dQ))) + ', so the price is ' + tex('e^{-' + dec(r * T) + '}\\times' + dec(normalCdf(dQ)) + '=' + dec(digital)) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'sc-lq-f-girsanov', generate: (rng) => build(sample(rng)) }
