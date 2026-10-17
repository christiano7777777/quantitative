// LQ-F: Avellaneda-Stoikov market making: reservation price, optimal spread, bid quote, fill intensity, inventory needed for a given skew.
// Lectures 7 (market-making models, optimal quotes) and 8 (inventory control, reservation price).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { s: number; sig: number; gam: number; k: number; A: number; tau: number; q: number; c: number }

export function sample(rng: Rng): Params {
  for (;;) {
    let q = 0
    while (q === 0) q = rng.int(-4, 4)
    const p = { s: rng.pick([50, 100, 120]), sig: rng.pick([0.5, 1, 1.5, 2]), gam: rng.pick([0.05, 0.1, 0.2, 0.5]), k: rng.pick([1, 1.5, 2, 3]), A: rng.pick([50, 100, 140]), tau: rng.pick([0.25, 0.5, 1]), q, c: rng.pick([0.2, 0.4, 0.5, 1]) }
    const risk = p.gam * p.sig * p.sig * p.tau
    const half = risk / 2 + Math.log(1 + p.gam / p.k) / p.gam
    if (half > Math.abs(q) * risk + 0.05) return p // both quotes stay on the correct side of the mid-price
  }
}

export function build({ s, sig, gam, k, A, tau, q, c }: Params): LQInstance {
  const risk = gam * sig * sig * tau
  const r = s - q * risk
  const logTerm = Math.log(1 + gam / k) / gam
  const delta = risk + 2 * logTerm
  const bid = r - delta / 2
  const askDist = r + delta / 2 - s
  const lamAsk = A * Math.exp(-k * askDist)
  const qStar = c / risk

  return {
    intro:
      'An Avellaneda-Stoikov market maker has mid-price ' + tex('s=' + s) + ', volatility ' + tex('\\sigma=' + dec(sig)) + ', risk aversion ' + tex('\\gamma=' + dec(gam)) + ' and time remaining ' + tex('T-t=' + dec(tau)) +
      '. Market orders hit a quote at distance ' + tex('\\delta') + ' from the mid-price at rate ' + tex('\\lambda(\\delta)=Ae^{-k\\delta}') + ' with ' + tex('A=' + A + ',\\ k=' + dec(k)) + '. The current inventory is ' + tex('q=' + q) + ' shares. Give answers to 3 decimal places and do not round intermediate values.',
    parts: [
      {
        prompt: 'Find the reservation price ' + tex('r=s-q\\gamma\\sigma^2(T-t)') + '.',
        answer: r, tolerance: tol3, lecture: 8,
        explanation: tex('\\gamma\\sigma^2(T-t)=' + dec(risk) + ',\\ r=' + s + '-(' + q + ')(' + dec(risk) + ')=' + dec(r)) + '. Positive inventory pushes the reservation price below the mid-price.',
      },
      {
        prompt: 'Find the total optimal spread ' + tex('\\delta^a+\\delta^b=\\gamma\\sigma^2(T-t)+\\frac{2}{\\gamma}\\ln(1+\\gamma/k)') + '.',
        answer: delta, tolerance: tol3, lecture: 7,
        explanation: tex(dec(risk) + '+\\frac{2}{' + dec(gam) + '}\\ln(1+' + dec(gam / k) + ')=' + dec(risk) + '+' + dec(2 * logTerm) + '=' + dec(delta)) + '. It does not depend on the inventory.',
      },
      {
        prompt: 'The quotes are centred on the reservation price. Find the optimal bid quote ' + tex('r-\\tfrac12(\\delta^a+\\delta^b)') + '.',
        answer: bid, tolerance: tol3, lecture: 7,
        explanation: tex(dec(r) + '-' + dec(delta / 2) + '=' + dec(bid)) + '.',
      },
      {
        prompt: 'Find the rate ' + tex('Ae^{-k\\delta^a}') + ' at which the ask quote ' + tex('r+\\tfrac12(\\delta^a+\\delta^b)') + ' is hit, where ' + tex('\\delta^a') + ' is its distance above the mid-price ' + tex('s') + '.',
        answer: lamAsk, tolerance: { abs: 0.0005, rel: 1e-4 }, lecture: 7,
        explanation: tex('\\delta^a=' + dec(askDist) + ',\\ ' + A + 'e^{-' + dec(k) + '\\times' + dec(askDist) + '}=' + dec(lamAsk)) + '. A larger long inventory would lower the ask and raise this rate.',
      },
      {
        prompt: 'The market maker wants the reservation price ' + tex('r=s-q\\gamma\\sigma^2(T-t)') + ' to sit exactly ' + tex(dec(c)) + ' below the mid-price. Find the required inventory ' + tex('q') + ' (not necessarily an integer).',
        answer: qStar, tolerance: tol3, lecture: 8,
        explanation: tex('q=' + dec(c) + '/(\\gamma\\sigma^2(T-t))=' + dec(c) + '/' + dec(risk) + '=' + dec(qStar)) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'ms2-lq-f-quotes', generate: (rng) => build(sample(rng)) }
