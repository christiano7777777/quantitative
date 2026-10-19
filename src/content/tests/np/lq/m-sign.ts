// LQ-M: the one-sample sign (binomial) test for a median: ties, exact p-values, and a probability under an alternative.
// Lecture 2 (one-sample sign test).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { m0: number; x: number[]; p1: number }

export function sample(rng: Rng): Params {
  const m0 = rng.int(20, 60)
  const n = rng.int(10, 13)
  for (;;) {
    const x = Array.from({ length: n }, () => m0 + rng.int(-15, 15))
    const ties = x.filter((v) => v === m0).length
    const above = x.filter((v) => v > m0).length
    const nn = n - ties
    if (ties >= 1 && ties <= 2 && above > nn / 2 && above < nn) return { m0, x, p1: rng.pick([0.6, 0.7, 0.75, 0.8]) }
  }
}

function binomTailUp(n: number, k: number, p: number): number {
  let s = 0
  for (let j = k; j <= n; j++) {
    let c = 1
    for (let i = 1; i <= j; i++) c = (c * (n - j + i)) / i
    s += c * p ** j * (1 - p) ** (n - j)
  }
  return s
}

export function build({ m0, x, p1 }: Params): LQInstance {
  const nn = x.filter((v) => v !== m0).length
  const k = x.filter((v) => v > m0).length
  const upper = binomTailUp(nn, k, 0.5)
  const two = Math.min(1, 2 * upper)
  const alt = binomTailUp(nn, k, p1)

  return {
    intro: 'A sample of ' + tex(x.length) + ' observations is ' + tex(x.join(',\\ ')) + '. Test ' + tex('H_0:\\text{median}=' + m0) + ' with the sign test: drop observations equal to ' + tex(m0) + ', let ' + tex('n') + ' be the number left and ' + tex('B') + ' the number above ' + tex(m0) + '. Under ' + tex('H_0') + ', ' + tex('B\\sim\\mathrm{Bin}(n,\\tfrac12)') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'How many observations remain after dropping those equal to ' + tex(m0) + '? Give a whole number.',
        answer: nn, tolerance: tolInt, lecture: 1,
        explanation: tex(x.length) + ' observations minus ' + (x.length - nn) + ' equal to ' + tex(m0) + ' leaves ' + tex(nn) + '.',
      },
      {
        prompt: 'How many of the remaining observations are above ' + tex(m0) + '? (This is ' + tex('B') + '.) Give a whole number.',
        answer: k, tolerance: tolInt, lecture: 1,
        explanation: 'The values above ' + tex(m0) + ' are ' + x.filter((v) => v > m0).join(', ') + ', so ' + tex('B=' + k) + '.',
      },
      {
        prompt: 'Find the exact one-sided p-value for ' + tex('H_1:\\text{median}>' + m0) + ', ' + tex('P(B\\ge' + k + ')') + ' with ' + tex('B\\sim\\mathrm{Bin}(' + nn + ',\\tfrac12)') + '.',
        answer: upper, tolerance: tol4, lecture: 1,
        explanation: 'Sum ' + tex('\\binom{' + nn + '}{j}/2^{' + nn + '}') + ' for ' + tex('j=' + k + ',\\dots,' + nn) + ': ' + dec(upper) + '.',
      },
      {
        prompt: 'Find the exact two-sided p-value: twice the smaller tail probability, capped at 1.',
        answer: two, tolerance: tol4, lecture: 1,
        explanation: 'Since ' + tex('B') + ' is above ' + tex(nn / 2) + ', the smaller tail is the upper one: ' + tex('2\\times' + dec(upper)) + ' = ' + dec(two) + (two === 1 ? ' (capped at 1)' : '') + '.',
      },
      {
        prompt: 'The sign test uses only whether each observation is above ' + tex(m0) + '. If in fact each observation is above ' + tex(m0) + ' with probability ' + tex(dec(p1)) + ', then ' + tex('B\\sim\\mathrm{Bin}(' + nn + ',' + dec(p1) + ')') + '. Find ' + tex('P(B\\ge' + k + ')') + ' under this alternative.',
        answer: alt, tolerance: tol4, lecture: 1,
        explanation: 'Sum ' + tex('\\binom{' + nn + '}{j}' + dec(p1) + '^j' + dec(1 - p1) + '^{' + nn + '-j}') + ' for ' + tex('j=' + k + ',\\dots,' + nn) + ': ' + dec(alt) + '. It is much larger than under ' + tex('H_0') + ', which is why a large ' + tex('B') + ' is evidence against it.',
      },
    ],
  }
}

export const genM: LQGenerator = { id: 'np-lq-m-sign', generate: (rng) => build(sample(rng)) }
