// LQ-G: calibrating the fill-rate curve A exp(-k delta) by log-linear regression, then the spread, reservation price and inventory skew.
// Lectures 10 (estimation, calibration), 7 (optimal quotes) and 8 (reservation price, inventory).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { d: number; rates: number[]; gam: number; sig: number; tau: number; q: number; s: number }

export function sample(rng: Rng): Params {
  const d = rng.pick([0.25, 0.5])
  const A = rng.pick([60, 80, 100, 120, 140]), k = rng.pick([1, 1.5, 2, 2.5])
  const rates = [1, 2, 3].map((i) => Math.round(A * Math.exp(-k * d * i) * (1 + rng.int(-8, 8) / 100)))
  let q = 0
  while (q === 0) q = rng.int(-3, 3)
  return { d, rates, gam: rng.pick([0.1, 0.2, 0.5]), sig: rng.pick([1, 2]), tau: rng.pick([0.5, 1]), q, s: rng.pick([50, 100]) }
}

export function build({ d, rates, gam, sig, tau, q, s }: Params): LQInstance {
  const y = rates.map((r) => Math.log(r))
  const slope = (y[2] - y[0]) / (2 * d) // equally spaced points: OLS slope is the end-point difference
  const k = -slope
  const lnA = (y[0] + y[1] + y[2]) / 3 - slope * 2 * d
  const A = Math.exp(lnA)
  const risk = gam * sig * sig * tau
  const halfSpread = risk / 2 + Math.log(1 + gam / k) / gam
  const r = s - q * risk
  const ratio = Math.exp(2 * k * q * risk)

  return {
    intro:
      'Fill rates (orders per unit time) of a quote at distance ' + tex('\\delta') + ' from the mid-price were measured as ' + tex(rates[0]) + ' at ' + tex('\\delta=' + dec(d)) + ', ' + tex(rates[1]) + ' at ' + tex('\\delta=' + dec(2 * d)) + ' and ' + tex(rates[2]) + ' at ' + tex('\\delta=' + dec(3 * d)) +
      '. Fit ' + tex('\\lambda(\\delta)=Ae^{-k\\delta}') + ' by least squares of ' + tex('\\ln\\lambda') + ' on ' + tex('\\delta') + '. The market maker has risk aversion ' + tex('\\gamma=' + dec(gam)) + ', volatility ' + tex('\\sigma=' + sig) + ', time remaining ' + tex('T-t=' + dec(tau)) + ', mid-price ' + tex('s=' + s) + ' and inventory ' + tex('q=' + q) +
      '. Use the fitted ' + tex('k') + ' where needed, do not round intermediate values, and give 4 decimal places for ' + tex('k') + ' and 3 for the others.',
    parts: [
      {
        prompt: 'Find the fitted decay parameter ' + tex('\\hat k') + ' (minus the least-squares slope).',
        answer: k, tolerance: tol4, lecture: 10,
        explanation: 'The three points are equally spaced, so the slope is ' + tex('(\\ln' + rates[2] + '-\\ln' + rates[0] + ')/(' + dec(2 * d) + ')=' + dec(slope)) + ' and ' + tex('\\hat k=' + dec(k)) + '.',
      },
      {
        prompt: 'Find the fitted intensity scale ' + tex('\\hat A=e^{\\hat a}') + ', where ' + tex('\\hat a') + ' is the fitted intercept (rate at distance zero).',
        answer: A, tolerance: { abs: 0.005, rel: 1e-4 }, lecture: 10,
        explanation: 'The intercept is ' + tex('\\overline{\\ln\\lambda}-\\text{slope}\\cdot\\bar\\delta=' + dec(lnA)) + ', so ' + tex('\\hat A=e^{' + dec(lnA) + '}=' + dec(A)) + '.',
      },
      {
        prompt: 'With the fitted ' + tex('\\hat k') + ', find the optimal half-spread ' + tex('\\tfrac12\\gamma\\sigma^2(T-t)+\\frac1\\gamma\\ln(1+\\gamma/\\hat k)') + '.',
        answer: halfSpread, tolerance: tol3, lecture: 7,
        explanation: tex('\\gamma\\sigma^2(T-t)=' + dec(risk) + '$ and $\\frac{1}{' + dec(gam) + '}\\ln(1+' + dec(gam / k) + ')=' + dec(Math.log(1 + gam / k) / gam)) + ', so the half-spread is ' + tex(dec(halfSpread)) + '.',
      },
      {
        prompt: 'Find the reservation price ' + tex('r=s-q\\gamma\\sigma^2(T-t)') + '.',
        answer: r, tolerance: tol3, lecture: 8,
        explanation: tex(s + '-(' + q + ')(' + dec(risk) + ')=' + dec(r)) + '.',
      },
      {
        prompt: 'With quotes centred on ' + tex('r') + ', the ask distance minus the bid distance (from the mid-price) is ' + tex('-2q\\gamma\\sigma^2(T-t)') + '. Find the ratio of the ask fill rate to the bid fill rate, ' + tex('e^{-\\hat k(\\delta^a-\\delta^b)}') + '.',
        answer: ratio, tolerance: { abs: 0.0005, rel: 1e-4 }, lecture: 8,
        explanation: tex('e^{2\\hat kq\\gamma\\sigma^2(T-t)}=e^{2\\times' + dec(k) + '\\times' + q + '\\times' + dec(risk) + '}=' + dec(ratio)) + (q > 0 ? '. A long inventory makes the ask more attractive, so it fills more often.' : '. A short inventory makes the bid more attractive, so the ask fills less often.'),
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'ms2-lq-g-calibration', generate: (rng) => build(sample(rng)) }
