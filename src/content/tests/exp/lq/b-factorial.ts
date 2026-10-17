// LQ-B: effects from an unreplicated 2^3 factorial, then what a half fraction (defining relation I = +/-ABC) can and cannot tell.
// Lectures 3 (factorial effects, interactions) and 5 (aliasing in a fractional factorial).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { tex, tol2 } from '../../../shared/format'

/** y in standard order (1), a, b, ab, c, ac, bc, abc; s = sign of the defining word (I = sABC) of the fraction run first. */
export interface Params { y: number[]; s: 1 | -1 }

const NAMES = ['(1)', 'a', 'b', 'ab', 'c', 'ac', 'bc', 'abc']
/** level (+1 or -1) of factor `bit` (0 = A, 1 = B, 2 = C) in run i */
const lv = (i: number, bit: number) => (((i >> bit) & 1) ? 1 : -1)

export function sample(rng: Rng): Params {
  return { y: Array.from({ length: 8 }, () => rng.int(20, 60)), s: rng.pick([1, -1] as const) }
}

export function build({ y, s }: Params): LQInstance {
  const effect = (bits: number[]) => y.reduce((a, v, i) => a + v * bits.reduce((p, b) => p * lv(i, b), 1), 0) / 4
  const A = effect([0]), AB = effect([0, 1]), ABC = effect([0, 1, 2]), BC = effect([1, 2])
  const inFraction = (i: number, sign: number) => lv(i, 0) * lv(i, 1) * lv(i, 2) === sign
  const lA = (sign: number) => y.reduce((a, v, i) => (inFraction(i, sign) ? a + v * lv(i, 0) : a), 0) / 2
  const l1 = lA(s), l2 = lA(-s)
  const bcHat = (s * (l1 - l2)) / 2
  const runsOf = (sign: number) => NAMES.filter((_, i) => inFraction(i, sign)).join(', ')
  const word = s === 1 ? 'ABC' : '-ABC'

  return {
    intro:
      'An unreplicated ' + tex('2^3') + ' experiment gives these responses (standard notation: a means A high, others low): ' + NAMES.map((n, i) => n + ' = ' + y[i]).join('; ') + '. The effect of a term is the mean response where the term\'s sign is +1 minus the mean where it is -1. Give answers to 2 decimal places.',
    parts: [
      {
        prompt: 'Find the main effect of ' + tex('A') + '.',
        answer: A, tolerance: tol2, lecture: 3,
        explanation: tex('A=\\tfrac14[a+ab+ac+abc-(1)-b-c-bc]=' + A) + '.',
      },
      {
        prompt: 'Find the ' + tex('AB') + ' interaction effect (the sign of a run is the product of its ' + tex('A') + ' and ' + tex('B') + ' signs).',
        answer: AB, tolerance: tol2, lecture: 3,
        explanation: tex('AB=\\tfrac14[(1)+ab+c+abc-a-b-ac-bc]=' + AB) + '.',
      },
      {
        prompt: 'Find the three-factor interaction effect ' + tex('ABC') + '.',
        answer: ABC, tolerance: tol2, lecture: 3,
        explanation: tex('ABC=\\tfrac14[a+b+c+abc-(1)-ab-ac-bc]=' + ABC) + '.',
      },
      {
        prompt: 'Suppose only the half fraction with defining relation ' + tex('I=' + word) + ' had been run, namely the runs ' + runsOf(s) + '. Using only these four runs, compute the contrast estimate of the effect of ' + tex('A') + ' (mean at ' + tex('A') + ' high minus mean at ' + tex('A') + ' low).',
        answer: l1, tolerance: tol2, lecture: 5,
        explanation: 'With ' + tex('I=' + word) + ', ' + tex('A') + ' is aliased with ' + tex(s === 1 ? 'BC' : '-BC') + ', so this contrast estimates ' + tex('A' + (s === 1 ? '+' : '-') + 'BC') + ' and equals ' + tex(l1) + '.',
      },
      {
        prompt: 'The other half fraction, ' + tex('I=' + (s === 1 ? '-ABC' : 'ABC')) + ' with runs ' + runsOf(-s) + ', is now also run. Combining both fractions, estimate the ' + tex('BC') + ' interaction effect.',
        answer: bcHat, tolerance: tol2, lecture: 5,
        explanation: 'The two fractions give ' + tex('A' + (s === 1 ? '+' : '-') + 'BC=' + l1) + ' and ' + tex('A' + (s === 1 ? '-' : '+') + 'BC=' + l2) + '. Their ' + (s === 1 ? 'difference' : 'difference with sign reversed') + ' over 2 isolates ' + tex('BC=' + bcHat) + ' (and their average isolates ' + tex('A=' + (l1 + l2) / 2) + ').',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'exp-lq-b-factorial', generate: (rng) => build(sample(rng)) }
