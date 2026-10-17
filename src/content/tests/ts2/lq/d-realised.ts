// LQ-D: realised variance from intraday returns, bipower variation and the jump component, microstructure noise bias, annualised volatility.
// Lecture 5 (realised volatility).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol3, tol4 } from '../../../shared/format'

export interface Params { tenths: number[]; iv: number; n: number; w2: number }

export function sample(rng: Rng): Params {
  let tenths: number[]
  do tenths = Array.from({ length: 6 }, () => rng.int(-8, 8))
  while (tenths.every((t) => t === 0) || tenths.filter((t) => t !== 0).length < 4)
  return { tenths, iv: rng.pick([0.8, 1, 1.5, 2]), n: rng.pick([78, 156, 390]), w2: rng.pick([0.0002, 0.0005, 0.001]) }
}

export function build({ tenths, iv, n, w2 }: Params): LQInstance {
  const r = tenths.map((t) => t / 10)
  const rv = r.reduce((a, v) => a + v * v, 0)
  let bp = 0
  for (let i = 1; i < r.length; i++) bp += Math.abs(r[i]) * Math.abs(r[i - 1])
  const bv = (Math.PI / 2) * bp
  const jump = rv - bv
  const biased = iv + 2 * n * w2
  const vol = Math.sqrt(252 * rv)

  return {
    intro: 'Six consecutive intraday returns (in per cent) are ' + r.map(dec).join(', ') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the realised variance ' + tex('RV=\\sum r_i^2') + ' of these returns.',
        answer: rv, tolerance: tol4, lecture: 5,
        explanation: 'Sum of squares: ' + dec(rv) + '.',
      },
      {
        prompt: 'Find the bipower variation ' + tex('BV=\\frac\\pi2\\sum_{i=2}^{6}|r_i||r_{i-1}|') + '.',
        answer: bv, tolerance: tol4, lecture: 5,
        explanation: tex('\\sum|r_i||r_{i-1}|=' + dec(bp)) + ', times ' + tex('\\pi/2') + ' gives ' + dec(bv) + '.',
      },
      {
        prompt: 'Estimate the jump contribution ' + tex('RV-BV') + ' (it can be negative in a small sample).',
        answer: jump, tolerance: tol4, lecture: 5,
        explanation: tex(dec(rv) + '-' + dec(bv)) + ' = ' + dec(jump) + '.',
      },
      {
        prompt: 'Suppose the true integrated variance of a day is ' + tex(dec(iv)) + ' (per cent squared) and prices are observed ' + tex(n + 1) + ' times with independent noise of variance ' + tex('\\omega^2=' + dec(w2)) + '. Then ' + tex('E[RV]\\approx IV+2n\\omega^2') + ' with ' + tex('n=' + n) + ' returns. Find ' + tex('E[RV]') + '.',
        answer: biased, tolerance: tol3, lecture: 5,
        explanation: tex(dec(iv) + '+2\\cdot' + n + '\\cdot' + dec(w2)) + ' = ' + dec(biased) + ', so noise adds ' + dec(2 * n * w2) + ' to the true variance.',
      },
      {
        prompt: 'Treating the six returns as the whole day, annualise the volatility as ' + tex('\\sqrt{252\\,RV}') + ' (per cent, 2 decimal places).',
        answer: vol, tolerance: tol2, lecture: 5,
        explanation: tex('\\sqrt{252\\cdot' + dec(rv) + '}') + ' = ' + dec(vol) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'ts2-lq-d-realised', generate: (rng) => build(sample(rng)) }
