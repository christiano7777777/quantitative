// LQ-G: Bayes and information puzzles: Monty Hall variants, a medical test with repeated results, families of children.
// Lecture 9 (Bayes and information puzzles).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { doors: number; opened: number; prev: number; sens: number; spec: number; kids: number } // percentages for prev, sens, spec

export function sample(rng: Rng): Params {
  const doors = rng.pick([4, 5, 6, 10])
  return { doors, opened: rng.int(1, doors - 2), prev: rng.pick([1, 2, 5, 10]), sens: rng.pick([90, 95, 99]), spec: rng.pick([90, 95, 98]), kids: rng.pick([2, 3, 4]) }
}

export function build({ doors, opened, prev, sens, spec, kids }: Params): LQInstance {
  const n = doors, k = opened
  const stay = 1 / n
  const switchOne = (n - 1) / n / (n - k - 1)
  const P = prev / 100, S = sens / 100, T = spec / 100
  const post1 = (P * S) / (P * S + (1 - P) * (1 - T))
  const post2 = (P * S * S) / (P * S * S + (1 - P) * (1 - T) * (1 - T))
  const boys = 1 / (2 ** kids - 1)
  const ignorant = 1 / (n - 1)

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'In a Monty Hall game with ' + tex(n) + ' doors (one car), you pick a door; the host, who knows where the car is, opens ' + tex(k) + ' other doors showing goats. You may switch to one of the ' + tex(n - k - 1) + ' other unopened doors, chosen at random. Find your probability of winning if you switch to one of them.',
        answer: switchOne, tolerance: tol4, lecture: 9,
        explanation: 'Your first pick is wrong with probability ' + tex((n - 1) + '/' + n) + ', in which case the car is among the ' + tex(n - k - 1) + ' others equally: ' + tex('\\frac{' + (n - 1) + '}{' + n + '}\\cdot\\frac1{' + (n - k - 1) + '}') + ' = ' + dec(switchOne) + ', compared with ' + dec(stay) + ' for staying.',
      },
      {
        prompt: 'A disease has prevalence ' + tex(prev + '\\%') + '. A test is positive for ' + tex(sens + '\\%') + ' of those with the disease and negative for ' + tex(spec + '\\%') + ' of those without it. Find the probability of disease given one positive test.',
        answer: post1, tolerance: tol4, lecture: 9,
        explanation: tex('\\dfrac{' + dec(P * S) + '}{' + dec(P * S) + '+' + dec((1 - P) * (1 - T)) + '}') + ' = ' + dec(post1) + '. The low prevalence keeps the posterior far below the sensitivity.',
      },
      {
        prompt: 'Find the probability of disease after two independent positive tests (same test repeated).',
        answer: post2, tolerance: tol4, lecture: 9,
        explanation: tex('\\dfrac{P S^2}{P S^2+(1-P)(1-T)^2}') + ' = ' + dec(post2) + '.',
      },
      {
        prompt: 'A family has ' + tex(kids) + ' children, each independently a boy or a girl with probability ' + tex('1/2') + '. You learn that at least one is a boy. Find the probability that all are boys.',
        answer: boys, tolerance: tol4, lecture: 9,
        explanation: tex('P(\\text{all boys})=2^{-' + kids + '}') + ' and ' + tex('P(\\text{at least one boy})=1-2^{-' + kids + '}') + ', so the ratio is ' + tex('1/(2^{' + kids + '}-1)') + ' = ' + dec(boys) + '.',
      },
      {
        prompt: 'In the ' + tex(n) + '-door game, suppose the host instead opens one of the other doors at random, and it happens to show a goat. Find the probability that your original pick holds the car. (Compare with ' + tex('1/' + n) + ' for a host who knows.)',
        answer: ignorant, tolerance: tol4, lecture: 9,
        explanation: tex('\\dfrac{\\frac1n}{\\frac1n+\\frac{n-2}{n}}=\\dfrac1{n-1}=\\dfrac1{' + (n - 1) + '}') + ' = ' + dec(ignorant) + '. A host acting at random reveals information differently from a host who avoids the car.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'pz-lq-g-bayes', generate: (rng) => build(sample(rng)) }
