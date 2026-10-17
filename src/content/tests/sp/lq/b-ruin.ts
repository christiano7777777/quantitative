// LQ-B: gambler's ruin, fair and biased, with an optional-stopping step.
// Lectures 5 (ruin probability, expected duration) and 11 (martingale (q/p)^S_n).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from './format'

export interface Params {
  N1: number; i1: number // fair game: target and starting fortune
  N2: number; i2: number // biased game
  pNum: number // win probability = pNum / 20
}

/** Starting fortune away from the midpoint: at i = N/2 the fair answer 1/2 is guessable and a biased game with
 *  p and 1-p would give mirror-image answers. */
function startAway(rng: Rng, N: number): number {
  let i: number
  do i = rng.int(2, N - 2)
  while (2 * i === N)
  return i
}

export function sample(rng: Rng): Params {
  const N1 = rng.pick([8, 10, 12, 15, 20])
  const N2 = rng.pick([6, 8, 10, 12])
  return { N1, i1: startAway(rng, N1), N2, i2: startAway(rng, N2), pNum: rng.pick([8, 9, 11, 12, 13]) }
}

export function build({ N1, i1, N2, i2, pNum }: Params): LQInstance {
  const p = pNum / 20, q = 1 - p, r = q / p
  const reachFair = i1 / N1
  const durFair = i1 * (N1 - i1)
  const reachBiased = (1 - r ** i2) / (1 - r ** N2)
  const martingaleValue = r ** i2
  const durBiased = i2 / (q - p) - (N2 / (q - p)) * reachBiased
  const ps = dec(p)

  return {
    intro:
      'A gambler bets 1 unit per round and keeps playing until his fortune hits 0 (ruin) or the target. ' +
      'Give decimal answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Fair game (each round won with probability ' + tex('1/2') + '). He starts with ' + tex(i1) + ' units and aims for ' + tex(N1) + '. What is the probability he reaches ' + tex(N1) + ' before ruin?',
        answer: reachFair, tolerance: tol3, lecture: 5,
        explanation: 'Fair walk: ' + tex('P=i/N=' + i1 + '/' + N1) + ' = ' + dec(reachFair) + '.',
      },
      {
        prompt: 'In the same fair game, what is the expected number of rounds until the game ends?',
        answer: durFair, tolerance: tol3, lecture: 5,
        explanation: tex('E[T]=i(N-i)=' + i1 + '\\cdot' + (N1 - i1)) + ' = ' + durFair + '.',
      },
      {
        prompt: 'Biased game: each round is won with probability ' + tex('p=' + ps) + ' (so ' + tex('q=' + dec(q)) + '). He starts with ' + tex(i2) + ' units and aims for ' + tex(N2) + '. What is the probability he reaches ' + tex(N2) + ' before ruin?',
        answer: reachBiased, tolerance: tol3, lecture: 5,
        explanation: 'With ' + tex('r=q/p=' + dec(r)) + ': ' + tex('P=\\dfrac{1-r^{i}}{1-r^{N}}=\\dfrac{1-r^{' + i2 + '}}{1-r^{' + N2 + '}}') + ' = ' + dec(reachBiased) + '.',
      },
      {
        prompt: 'In the biased game let ' + tex('M_n=(q/p)^{S_n}') + ', where ' + tex('S_n') + ' is his fortune after ' + tex('n') + ' rounds (a martingale), and let ' + tex('T') + ' be the time the game ends. Use optional stopping to find ' + tex('E[M_T]') + '. Give 4 decimal places.',
        answer: martingaleValue, tolerance: tol4, lecture: 11,
        explanation: tex('M') + ' is a martingale and the stopped process is bounded, so ' + tex('E[M_T]=E[M_0]=r^{' + i2 + '}=' + dec(r) + '^{' + i2 + '}') + ' = ' + dec(martingaleValue) + '. (Writing ' + tex('E[M_T]=P(\\text{ruin})+r^{N}P(\\text{target})') + ' recovers the formula from the previous part.)',
      },
      {
        prompt: 'In the biased game, what is the expected number of rounds until the game ends?',
        answer: durBiased, tolerance: tol3, lecture: 5,
        explanation: tex('E[T]=\\dfrac{i}{q-p}-\\dfrac{N}{q-p}\\cdot\\dfrac{1-r^{i}}{1-r^{N}}') + ' with ' + tex('q-p=' + dec(q - p)) + ' gives ' + dec(durBiased) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'sp-lq-b-ruin', generate: (rng) => build(sample(rng)) }
