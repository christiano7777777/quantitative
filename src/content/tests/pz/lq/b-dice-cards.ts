// LQ-B: dice and card probabilities: no six in n rolls, collecting all faces, first ace position, a hypergeometric hand, expected aces on top.
// Lectures 3 (dice problems) and 4 (cards and urns).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { n: number; m: number; k: number; j: number; top: number }

export function sample(rng: Rng): Params {
  return { n: rng.pick([3, 4, 6, 8, 10]), m: rng.pick([4, 6, 8, 10, 12]), k: rng.pick([2, 3, 4, 5]), j: rng.pick([1, 2, 3]), top: rng.pick([5, 8, 10, 13]) }
}

export const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }

export function build({ n, m, k, j, top }: Params): LQInstance {
  const noSix = (5 / 6) ** n
  let coupon = 0
  for (let i = 1; i <= m; i++) coupon += m / i
  let firstAce = 4 / (52 - k + 1)
  for (let i = 1; i < k; i++) firstAce *= (48 - i + 1) / (52 - i + 1)
  const hyper = (choose(4, j) * choose(48, 5 - j)) / choose(52, 5)
  const acesTop = (4 * top) / 52

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A fair die is rolled ' + tex(n) + ' times. Find the probability that no six appears.',
        answer: noSix, tolerance: tol4, lecture: 3,
        explanation: tex('(5/6)^{' + n + '}') + ' = ' + dec(noSix) + '.',
      },
      {
        prompt: 'A fair ' + tex(m) + '-sided die is rolled repeatedly until every face has appeared. Find the expected number of rolls, ' + tex('m(1+\\tfrac12+\\dots+\\tfrac1m)') + ' (3 decimal places).',
        answer: coupon, tolerance: tol3, lecture: 3,
        explanation: 'When ' + tex('i-1') + ' faces have been seen the next new one takes ' + tex('m/(m-i+1)') + ' rolls on average; the sum is ' + dec(coupon) + '.',
      },
      {
        prompt: 'Cards are dealt from a shuffled 52-card deck. Find the probability that the first ace is the ' + tex(k) + (k === 2 ? 'nd' : k === 3 ? 'rd' : 'th') + ' card dealt.',
        answer: firstAce, tolerance: tol4, lecture: 4,
        explanation: 'The first ' + tex(k - 1) + ' cards must be non-aces, then an ace: ' + tex('\\prod_{i=1}^{' + (k - 1) + '}\\frac{49-i}{53-i}\\cdot\\frac{4}{' + (53 - k) + '}') + ' = ' + dec(firstAce) + '.',
      },
      {
        prompt: 'Find the probability that a 5-card hand contains exactly ' + tex(j) + ' ace' + (j > 1 ? 's' : '') + '.',
        answer: hyper, tolerance: tol4, lecture: 4,
        explanation: tex('\\binom4{' + j + '}\\binom{48}{' + (5 - j) + '}/\\binom{52}5') + ' = ' + dec(hyper) + '.',
      },
      {
        prompt: 'Find the expected number of aces among the top ' + tex(top) + ' cards of a shuffled deck, by linearity of expectation (4 decimal places).',
        answer: acesTop, tolerance: tol4, lecture: 4,
        explanation: tex(top + '\\cdot4/52') + ' = ' + dec(acesTop) + ': each position holds an ace with probability ' + tex('4/52') + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'pz-lq-b-dice-cards', generate: (rng) => build(sample(rng)) }
