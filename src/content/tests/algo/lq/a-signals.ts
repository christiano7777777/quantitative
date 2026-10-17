// LQ-A: the fundamental law, momentum, cross-sectional z-scores, mean-reversion z-scores and carry.
// Lectures 1 (strategy lifecycle) and 2 (signal construction).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { ic: number; br: number; p12: number; p1: number; sig: number[]; price: number; ma: number; sd: number; spot: number; fut: number; days: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const sig = Array.from({ length: 5 }, () => rng.int(-20, 20) / 10)
    if (new Set(sig).size > 1) {
      const ma = rng.int(900, 1100) / 10
      return { ic: rng.int(2, 10) / 100, br: rng.pick([100, 250, 400, 900, 2500]), p12: rng.int(500, 1500) / 10, p1: rng.int(500, 1500) / 10, sig, price: ma + rng.int(-80, 80) / 10, ma, sd: rng.int(20, 60) / 10, spot: rng.int(500, 900) / 10, fut: rng.int(450, 950) / 10, days: rng.pick([30, 60, 90, 180]) }
    }
  }
}

export function build({ ic, br, p12, p1, sig, price, ma, sd, spot, fut, days }: Params): LQInstance {
  const ir = ic * Math.sqrt(br)
  const mom = p1 / p12 - 1
  const mean = sig.reduce((s, v) => s + v, 0) / sig.length
  const sdev = Math.sqrt(sig.reduce((s, v) => s + (v - mean) ** 2, 0) / (sig.length - 1))
  const z = (sig[0] - mean) / sdev
  const mr = (price - ma) / sd
  const carry = ((spot - fut) / spot) * (365 / days)

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'The fundamental law of active management says ' + tex('\\mathrm{IR}\\approx \\mathrm{IC}\\times\\sqrt{\\mathrm{BR}}') + '. A signal has information coefficient ' + tex('\\mathrm{IC}=' + dec(ic)) + ' and is used on ' + tex('\\mathrm{BR}=' + br) + ' independent bets per year. Find the information ratio.',
        answer: ir, tolerance: tol4, lecture: 1,
        explanation: tex(dec(ic) + '\\times\\sqrt{' + br + '}=' + dec(ir)) + '. Breadth helps only if the bets are truly independent.',
      },
      {
        prompt: 'A 12-1 momentum signal skips the latest month: ' + tex('P_{t-1}/P_{t-12}-1') + '. The price 12 months ago was ' + tex(dec(p12)) + ' and a month ago ' + tex(dec(p1)) + '. Find the signal.',
        answer: mom, tolerance: tol4, lecture: 2,
        explanation: tex(dec(p1) + '/' + dec(p12) + '-1=' + dec(mom)) + '. Skipping the last month avoids the short-term reversal effect.',
      },
      {
        prompt: 'Five assets have raw signals ' + tex(sig.map(dec).join(',\\ ')) + '. Standardise the first across assets, ' + tex('z=(s_1-\\bar s)/\\mathrm{sd}(s)') + ', using the sample standard deviation (divisor ' + tex('n-1') + ').',
        answer: z, tolerance: tol4, lecture: 2,
        explanation: tex('\\bar s=' + dec(mean) + ',\\ \\mathrm{sd}=' + dec(sdev) + ',\\ z=' + dec(z)) + '.',
      },
      {
        prompt: 'A mean-reversion signal is ' + tex('z=(P-\\mathrm{MA})/\\sigma') + '. The price is ' + tex(dec(price)) + ', its moving average ' + tex(dec(ma)) + ' and the rolling standard deviation ' + tex(dec(sd)) + '. Find ' + tex('z') + '.',
        answer: mr, tolerance: tol4, lecture: 2,
        explanation: tex('(' + dec(price) + '-' + dec(ma) + ')/' + dec(sd) + '=' + dec(mr)) + '. A positive value means rich, so the signal says sell.',
      },
      {
        prompt: 'A futures contract trades at ' + tex(dec(fut)) + ' against spot ' + tex(dec(spot)) + ' and expires in ' + tex(days) + ' days. The annualised carry from holding the future is ' + tex('\\dfrac{S-F}{S}\\times\\dfrac{365}{\\text{days}}') + '. Find it (a negative value is contango).',
        answer: carry, tolerance: tol4, lecture: 2,
        explanation: tex('(' + dec(spot) + '-' + dec(fut) + ')/' + dec(spot) + '\\times365/' + days + '=' + dec(carry)) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'algo-lq-a-signals', generate: (rng) => build(sample(rng)) }
