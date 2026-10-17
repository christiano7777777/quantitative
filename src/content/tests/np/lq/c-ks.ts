// LQ-C: the Kolmogorov-Smirnov statistic for five observations against the uniform distribution on (0,1).
// Lecture 5 (tests of fit).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { x: number[] } // hundredths, distinct

export function sample(rng: Rng): Params {
  return { x: rng.sample(Array.from({ length: 98 }, (_, i) => i + 1), 5) }
}

export function build({ x }: Params): LQInstance {
  const s = x.map((v) => v / 100).sort((a, b) => a - b)
  const n = s.length
  const dPlus = Math.max(...s.map((v, i) => (i + 1) / n - v))
  const dMinus = Math.max(...s.map((v, i) => v - i / n))
  const D = Math.max(dPlus, dMinus)

  return {
    intro: 'Five observations ' + tex(x.map((v) => dec(v / 100)).join(',')) + ' are tested against the uniform distribution on ' + tex('(0,1)') + ', with distribution function ' + tex('F_0(x)=x') + '. Order them as ' + tex(s.map(dec).join(',')) + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('D^+=\\max_i\\{i/n-F_0(x_{(i)})\\}') + ', how far the empirical cdf rises above ' + tex('F_0') + '.',
        answer: dPlus, tolerance: tol3, lecture: 5,
        explanation: tex('i/5-x_{(i)}') + ' for ' + tex('i=1,\\dots,5') + ' gives ' + s.map((v, i) => dec((i + 1) / n - v)).join(', ') + '; the maximum is ' + dec(dPlus) + '.',
      },
      {
        prompt: 'Find ' + tex('D^-=\\max_i\\{F_0(x_{(i)})-(i-1)/n\\}') + ', how far the empirical cdf falls below ' + tex('F_0') + ' (measured just before each jump).',
        answer: dMinus, tolerance: tol3, lecture: 5,
        explanation: tex('x_{(i)}-(i-1)/5') + ' gives ' + s.map((v, i) => dec(v - i / n)).join(', ') + '; the maximum is ' + dec(dMinus) + '.',
      },
      {
        prompt: 'Find the Kolmogorov-Smirnov statistic ' + tex('D_5=\\max(D^+,D^-)') + '.',
        answer: D, tolerance: tol3, lecture: 5,
        explanation: tex('\\max(' + dec(dPlus) + ',' + dec(dMinus) + ')') + ' = ' + dec(D) + '.',
      },
      {
        prompt: 'Find the large-sample 5% critical value ' + tex('1.36/\\sqrt n') + ' (the exact small-sample value is larger).',
        answer: 1.36 / Math.sqrt(n), tolerance: tol3, lecture: 5,
        explanation: tex('1.36/\\sqrt5') + ' = ' + dec(1.36 / Math.sqrt(n)) + '.',
      },
      {
        prompt: 'Find the scaled statistic ' + tex('\\sqrt nD_n') + ', which is compared with the Kolmogorov distribution (5% point 1.36).',
        answer: Math.sqrt(n) * D, tolerance: tol3, lecture: 5,
        explanation: tex('\\sqrt5\\cdot' + dec(D)) + ' = ' + dec(Math.sqrt(n) * D) + (Math.sqrt(n) * D > 1.36 ? ', above 1.36: reject uniformity.' : ', below 1.36: no rejection.'),
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'np-lq-c-ks', generate: (rng) => build(sample(rng)) }
