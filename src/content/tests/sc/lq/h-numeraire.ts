// LQ-H: martingale representation, the density for the stock numeraire, an asset-or-nothing price and the exchange (Margrabe) option.
// Lectures 10 (martingale representation and numeraires), with 8 (change of measure).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex, tol2, tol4 } from '../../../shared/format'

export interface Params { a: number; T: number; t0: number; w: number; s1: number; s2: number; sig1: number; sig2: number; rho: number; r: number; K: number }

export function sample(rng: Rng): Params {
  const s1 = rng.int(80, 120)
  const T = rng.pick([1, 2, 4])
  return {
    a: rng.pick([-1, -0.5, 0.5, 1, 1.5]), T, t0: T * rng.pick([0.25, 0.5, 0.75]), w: rng.int(-10, 10) / 10,
    s1, s2: rng.int(80, 120), sig1: rng.int(2, 4) / 10, sig2: rng.int(2, 4) / 10, rho: rng.int(0, 7) / 10, r: rng.int(1, 6) / 100, K: Math.round(s1 * rng.int(90, 110) / 100),
  }
}

export function build({ a, T, t0, w, s1, s2, sig1, sig2, rho, r, K }: Params): LQInstance {
  const rep = a * Math.exp(a * w + (a * a * (T - t0)) / 2)
  const sh = Math.sqrt(sig1 * sig1 + sig2 * sig2 - 2 * rho * sig1 * sig2)
  const Z = Math.exp(sig1 * w - (sig1 * sig1 * T) / 2)
  const d1 = (Math.log(s1 / K) + (r + 0.5 * sig1 * sig1) * T) / (sig1 * Math.sqrt(T))
  const aon = s1 * normalCdf(d1)
  const m1 = (Math.log(s1 / s2) + 0.5 * sh * sh * T) / (sh * Math.sqrt(T))
  const marg = s1 * normalCdf(m1) - s2 * normalCdf(m1 - sh * Math.sqrt(T))

  return {
    intro: 'Two non-dividend stocks follow geometric Brownian motions under the risk-neutral measure ' + tex('Q') + ' with the same interest rate ' + tex('r=' + dec(r)) + ': ' + tex('dS^i=rS^i\\,dt+\\sigma_iS^i\\,d\\tilde W^i') + ', where ' + tex('\\sigma_1=' + dec(sig1) + ',\\ \\sigma_2=' + dec(sig2)) + ', the Brownian motions have correlation ' + tex('\\rho=' + dec(rho)) + ', and ' + tex('S^1_0=' + s1 + ',\\ S^2_0=' + s2) + '. The horizon is ' + tex('T=' + dec(T)) + '. Use the standard normal cdf ' + tex('\\Phi') + ' where needed and give every answer to 4 decimal places, except the last two to 2.',
    parts: [
      {
        prompt: 'The martingale ' + tex('M_t=E[e^{' + dec(a) + '\\tilde W_T}\\mid\\mathcal F_t]') + ' has the representation ' + tex('M_t=M_0+\\int_0^tH_s\\,d\\tilde W_s') + '. Find ' + tex('H_t') + ' at ' + tex('t=' + dec(t0)) + ' when ' + tex('\\tilde W_t=' + dec(w)) + '.',
        answer: rep, tolerance: tol4, lecture: 10,
        explanation: tex('M_t=\\exp\\{aW_t+\\tfrac12a^2(T-t)\\}') + ' and Ito gives ' + tex('dM=aM\\,dW') + ', so ' + tex('H_t=aM_t=' + dec(a) + '\\exp\\{' + dec(a * w) + '+' + dec((a * a * (T - t0)) / 2) + '\\}=' + dec(rep)) + '.',
      },
      {
        prompt: 'Find the volatility ' + tex('\\hat\\sigma') + ' of the ratio ' + tex('S^1/S^2') + ', the quantity that governs the exchange option.',
        answer: sh, tolerance: tol4, lecture: 10,
        explanation: tex('d\\ln(S^1/S^2)') + ' has noise ' + tex('\\sigma_1d\\tilde W^1-\\sigma_2d\\tilde W^2') + ', of variance rate ' + tex('\\sigma_1^2+\\sigma_2^2-2\\rho\\sigma_1\\sigma_2=' + dec(sh * sh)) + '; so ' + tex('\\hat\\sigma=' + dec(sh)) + '.',
      },
      {
        prompt: 'Take the stock ' + tex('S^1') + ' as numeraire, with density ' + tex('Z_T=\\dfrac{dQ^{S^1}}{dQ}=\\dfrac{S^1_T/e^{rT}}{S^1_0}') + '. Find ' + tex('Z_T') + ' on a path with ' + tex('\\tilde W^1_T=' + dec(w)) + '.',
        answer: Z, tolerance: tol4, lecture: 8,
        explanation: tex('S^1_T/(S^1_0e^{rT})=\\exp\\{\\sigma_1\\tilde W^1_T-\\tfrac12\\sigma_1^2T\\}=\\exp\\{' + dec(sig1 * w) + '-' + dec((sig1 * sig1 * T) / 2) + '\\}=' + dec(Z)) + '. Under ' + tex('Q^{S^1}') + ' the drift of ' + tex('\\tilde W^1') + ' becomes ' + tex('\\sigma_1') + '.',
      },
      {
        prompt: 'An asset-or-nothing option pays ' + tex('S^1_T') + ' if ' + tex('S^1_T>' + K) + ' at time ' + tex('T') + '. Using ' + tex('S^1') + ' as numeraire, its price is ' + tex('S^1_0\\,Q^{S^1}(S^1_T>K)') + '. Find it (2 decimal places).',
        answer: aon, tolerance: tol2, lecture: 10,
        explanation: 'Under ' + tex('Q^{S^1}') + ' the drift of ' + tex('\\ln S^1') + ' is ' + tex('r+\\tfrac12\\sigma_1^2') + ', so the probability is ' + tex('\\Phi(d_1)') + ' with ' + tex('d_1=' + dec(d1)) + '; the price is ' + tex(s1 + '\\times' + dec(normalCdf(d1)) + '=' + dec(aon)) + '.',
      },
      {
        prompt: 'Find the price at time 0 of the exchange option paying ' + tex('(S^1_T-S^2_T)^+') + ' at time ' + tex('T') + ' (2 decimal places). Use the numeraire ' + tex('S^2') + '.',
        answer: marg, tolerance: tol2, lecture: 10,
        explanation: 'With numeraire ' + tex('S^2') + ', the price is ' + tex('S^2_0E^{Q^{S^2}}[(R_T-1)^+]') + ' with ' + tex('R=S^1/S^2') + ' a martingale of volatility ' + tex('\\hat\\sigma') + '. Hence ' + tex('S^1_0\\Phi(m_1)-S^2_0\\Phi(m_1-\\hat\\sigma\\sqrt T)') + ', ' + tex('m_1=\\{\\ln(S^1_0/S^2_0)+\\tfrac12\\hat\\sigma^2T\\}/(\\hat\\sigma\\sqrt T)=' + dec(m1)) + ', giving ' + tex(dec(marg)) + '. The rate ' + tex('r') + ' does not appear.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'sc-lq-h-numeraire', generate: (rng) => build(sample(rng)) }
