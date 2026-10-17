// LQ-F: two-asset equal risk contribution weights, portfolio volatility, risk shares, leverage to a volatility target.
// Lecture 7 (risk parity).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { s1: number; s2: number; rho: number; target: number }

export function sample(rng: Rng): Params {
  return { s1: rng.pick([4, 5, 6, 8]), s2: rng.pick([12, 15, 18, 20]), rho: rng.pick([-0.2, 0, 0.2, 0.4, 0.6]), target: rng.pick([8, 10, 12]) }
}

const vol = (w1: number, s1: number, s2: number, rho: number) => Math.sqrt(w1 * w1 * s1 * s1 + (1 - w1) ** 2 * s2 * s2 + 2 * w1 * (1 - w1) * rho * s1 * s2)

export function build({ s1, s2, rho, target }: Params): LQInstance {
  const w1 = s2 / (s1 + s2)
  const vErc = vol(w1, s1, s2, rho)
  const sh = (0.6 * (0.6 * s1 * s1 + 0.4 * rho * s1 * s2)) / vol(0.6, s1, s2, rho) ** 2
  const vEq = vol(0.5, s1, s2, rho)
  const lev = target / vErc

  return {
    intro: 'Two assets (say bonds and equities) have volatilities ' + tex(s1 + '\\%') + ' and ' + tex(s2 + '\\%') + ' and correlation ' + tex('\\rho=' + dec(rho)) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'For two assets the equal risk contribution portfolio has weights proportional to the inverse volatilities, whatever the correlation. Find the weight ' + tex('w_1') + ' of asset 1.',
        answer: w1, tolerance: tol4, lecture: 7,
        explanation: tex('w_1=\\sigma_2/(\\sigma_1+\\sigma_2)=' + s2 + '/' + (s1 + s2)) + ' = ' + dec(w1) + '.',
      },
      {
        prompt: 'Find the volatility (per cent) of the ERC portfolio.',
        answer: vErc, tolerance: tol4, lecture: 7,
        explanation: tex('\\sqrt{w_1^2\\sigma_1^2+w_2^2\\sigma_2^2+2w_1w_2\\rho\\sigma_1\\sigma_2}') + ' with ' + tex('w=(' + dec(w1) + ',' + dec(1 - w1) + ')') + ' = ' + dec(vErc) + '.',
      },
      {
        prompt: 'In a 60/40 portfolio (60% in asset 1), find the share of total variance contributed by asset 1, ' + tex('RC_1/\\sigma_p=w_1(\\sigma_1^2w_1+\\rho\\sigma_1\\sigma_2w_2)/\\sigma_p^2') + '.',
        answer: sh, tolerance: tol4, lecture: 7,
        explanation: 'Asset 1 contributes ' + dec(sh) + ' of the risk although it has weight 0.6; ' + (sh > 0.6 ? 'a high-volatility asset takes more than its weight.' : 'a low-volatility asset takes less than its weight.'),
      },
      {
        prompt: 'Find the volatility (per cent) of the equally weighted portfolio.',
        answer: vEq, tolerance: tol4, lecture: 7,
        explanation: tex('\\sqrt{0.25\\sigma_1^2+0.25\\sigma_2^2+0.5\\rho\\sigma_1\\sigma_2}') + ' = ' + dec(vEq) + '.',
      },
      {
        prompt: 'By what factor must the ERC portfolio be levered to reach a volatility target of ' + tex(target + '\\%') + '?',
        answer: lev, tolerance: tol4, lecture: 7,
        explanation: tex(target + '/' + dec(vErc)) + ' = ' + dec(lev) + ': ' + (lev > 1 ? 'borrowing is needed, as risk parity portfolios are dominated by low-volatility assets.' : 'no leverage is needed.'),
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'pf2-lq-f-riskparity', generate: (rng) => build(sample(rng)) }
