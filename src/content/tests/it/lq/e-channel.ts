// LQ-E: capacities of simple discrete memoryless channels and the random-coding count.
// Lectures 6 (joint typicality count) and 7 (channel capacity, BSC, BEC, Z-channel).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { p: number; eps: number; q: number; a: number; n: number; R: number }

export function sample(rng: Rng): Params {
  return {
    p: rng.int(1, 4) / 10,
    eps: rng.int(1, 6) / 10,
    q: rng.int(2, 8) / 10,
    a: rng.pick([0.2, 0.3, 0.4, 0.5, 0.6]),
    n: rng.pick([4, 5, 6, 8]),
    R: rng.int(3, 9) / 10,
  }
}

const lg = Math.log2
const h = (x: number) => (x <= 0 || x >= 1 ? 0 : -x * lg(x) - (1 - x) * lg(1 - x))

export function build({ p, eps, q, a, n, R }: Params): LQInstance {
  const cBsc = 1 - h(p)
  const cBec = 1 - eps
  const iNon = h(q * (1 - p) + (1 - q) * p) - h(p)
  const cZ = lg(1 + (1 - a) * a ** (a / (1 - a)))
  const expected = 2 ** (n * (R - cBsc))
  return {
    intro: 'Use logarithms to base 2 and let ' + tex('h(t)=-t\\log_2t-(1-t)\\log_2(1-t)') + '. Give each answer to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the capacity of the binary symmetric channel with crossover probability ' + tex(dec(p)) + ', in bits per use.',
        answer: cBsc, tolerance: tol3, lecture: 7,
        explanation: tex('C=1-h(' + dec(p) + ')=1-' + dec(h(p)) + '=' + dec(cBsc)) + '.',
      },
      {
        prompt: 'Find the capacity of the binary erasure channel with erasure probability ' + tex(dec(eps)) + '.',
        answer: cBec, tolerance: tol3, lecture: 7,
        explanation: tex('C=1-\\varepsilon=' + dec(cBec)) + ', attained by a uniform input.',
      },
      {
        prompt: 'The binary symmetric channel with crossover probability ' + tex(dec(p)) + ' is used with input ' + tex('P(X=1)=' + dec(q)) + '. Find ' + tex('I(X;Y)') + '.',
        answer: iNon, tolerance: tol3, lecture: 7,
        explanation: tex('P(Y=1)=' + dec(q) + '\\cdot' + dec(1 - p) + '+' + dec(1 - q) + '\\cdot' + dec(p) + '=' + dec(q * (1 - p) + (1 - q) * p)) + ', so ' + tex('I=H(Y)-H(Y|X)=h(' + dec(q * (1 - p) + (1 - q) * p) + ')-h(' + dec(p) + ')=' + dec(iNon)) + ', below the capacity ' + tex(dec(cBsc)) + '.',
      },
      {
        prompt: 'The Z-channel sends 0 to 0 always, and sends 1 to 1 with probability ' + tex(dec(1 - a)) + ' and to 0 with probability ' + tex(dec(a)) + '. Its capacity is ' + tex('C=\\log_2\\!\\left(1+(1-a)\\,a^{a/(1-a)}\\right)') + ' with ' + tex('a=' + dec(a)) + '. Evaluate it.',
        answer: cZ, tolerance: tol3, lecture: 7,
        explanation: tex('a^{a/(1-a)}=' + dec(a ** (a / (1 - a))) + ',\\ 1+(1-a)a^{a/(1-a)}=' + dec(1 + (1 - a) * a ** (a / (1 - a))) + ',\\ C=' + dec(cZ)) + '.',
      },
      {
        prompt: 'A random code of rate ' + tex('R=' + dec(R)) + ' bits per use (so ' + tex('2^{nR}') + ' codewords) is used on the binary symmetric channel with crossover ' + tex(dec(p)) + ', with block length ' + tex('n=' + n) + '. An incorrect codeword is jointly typical with the received word with probability about ' + tex('2^{-nI(X;Y)}') + ', where ' + tex('I(X;Y)') + ' is the capacity (uniform input). Find the expected number of incorrect jointly typical codewords, ' + tex('2^{nR}\\,2^{-nC}') + ', to 3 decimal places (or 0.5% relative accuracy), using the unrounded capacity.',
        answer: expected, tolerance: { abs: 0.0005, rel: 0.005 }, lecture: 6,
        explanation: tex('C=' + dec(cBsc)) + ' so ' + tex('2^{n(R-C)}=2^{' + n + '\\times(' + dec(R - cBsc) + ')}=2^{' + dec(n * (R - cBsc)) + '}=' + dec(expected)) + ', which is small only when ' + tex('R<C') + ' and ' + tex('n') + ' is large.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'it-lq-e-channel', generate: (rng) => build(sample(rng)) }
