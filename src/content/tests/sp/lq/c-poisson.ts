// LQ-C: Poisson process (counts, superposition, thinning) and renewal theory (rate, reward).
// Lectures 6 and 9.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from './format'

export interface Params {
  lambda: number // customers per hour
  t: number // hours, part (a)
  k: number // count asked in part (a)
  l1: number; l2: number // two merged streams
  pBuy: number // purchase probability, in tenths
  t2: number // hours, part (c)
  a: number; b: number // bulb life uniform on [a, b] days
  c: number; d: number // replacement cost and running cost per day
}

export function sample(rng: Rng): Params {
  const l1 = rng.int(1, 6)
  let l2 = rng.int(1, 6)
  while (l2 === l1) l2 = rng.int(1, 6)
  const a = rng.int(1, 4)
  return {
    lambda: rng.pick([2, 3, 4, 5, 6]), t: rng.pick([0.5, 1, 1.5, 2]), k: rng.int(1, 5),
    l1, l2, pBuy: rng.int(2, 6), t2: rng.pick([0.5, 1, 2]),
    a, b: a + rng.int(2, 8), c: rng.int(5, 20), d: rng.int(1, 5),
  }
}

export function build(P: Params): LQInstance {
  const { lambda, t, k, l1, l2, pBuy, t2, a, b, c, d } = P
  const mu = lambda * t
  let factorial = 1
  for (let j = 2; j <= k; j++) factorial *= j
  const pois = Math.exp(-mu) * mu ** k / factorial
  const online = l1 / (l1 + l2)
  const pb = pBuy / 10
  const noBuy = Math.exp(-pb * lambda * t2)
  const mean = (a + b) / 2
  const rate = 1 / mean
  const cost = (c + d * mean) / mean

  return {
    intro:
      'Customers arrive at a shop as a Poisson process with rate ' + tex(lambda) + ' per hour. ' +
      'Give decimal answers to 3 decimal places.',
    parts: [
      {
        prompt: 'What is the probability that exactly ' + tex(k) + (k === 1 ? ' customer arrives' : ' customers arrive') + ' in the next ' + tex(dec(t)) + (t === 1 ? ' hour' : ' hours') + '?',
        answer: pois, tolerance: tol3, lecture: 6,
        explanation: tex('N(t)\\sim\\mathrm{Poisson}(\\lambda t)') + ' with mean ' + tex(dec(mu)) + ': ' + tex('e^{-' + dec(mu) + '}' + dec(mu) + '^{' + k + '}/' + k + '!') + ' = ' + dec(pois) + '.',
      },
      {
        prompt: 'Separately, orders from two independent sources arrive as Poisson processes with rates ' + tex(l1) + ' and ' + tex(l2) + ' per hour. What is the probability that the next order overall comes from the first source?',
        answer: online, tolerance: tol3, lecture: 6,
        explanation: 'The merged process has rate ' + tex(l1 + '+' + l2) + ', and each arrival independently comes from source 1 with probability ' + tex('\\lambda_1/(\\lambda_1+\\lambda_2)=' + l1 + '/' + (l1 + l2)) + ' = ' + dec(online) + '.',
      },
      {
        prompt: 'Back to the shop (rate ' + tex(lambda) + ' per hour). Each arriving customer independently buys something with probability ' + tex(dec(pb)) + '. What is the probability that nobody buys anything in the next ' + tex(dec(t2)) + (t2 === 1 ? ' hour' : ' hours') + '?',
        answer: noBuy, tolerance: tol3, lecture: 6,
        explanation: 'Buyers form a thinned Poisson process with rate ' + tex(dec(pb) + '\\cdot' + lambda + '=' + dec(pb * lambda)) + '. ' + tex('P(\\text{none})=e^{-' + dec(pb * lambda) + '\\cdot' + dec(t2) + '}') + ' = ' + dec(noBuy) + '.',
      },
      {
        prompt: 'A lamp\'s bulb lasts a time uniformly distributed between ' + tex(a) + ' and ' + tex(b) + ' days, and is replaced the moment it fails. Bulb lifetimes are independent. In the long run, how many replacements per day happen?',
        answer: rate, tolerance: tol3, lecture: 9,
        explanation: 'Mean life ' + tex('\\mu=(' + a + '+' + b + ')/2=' + dec(mean)) + '. By the renewal theorem, replacements per day ' + tex('\\to1/\\mu') + ' = ' + dec(rate) + '.',
      },
      {
        prompt: 'Each replacement costs ' + tex(c) + ' dollars, and the bulb also costs ' + tex(d) + (d === 1 ? ' dollar' : ' dollars') + ' per day while it is in use. What is the long-run average cost per day?',
        answer: cost, tolerance: tol3, lecture: 9,
        explanation: 'Renewal reward theorem: ' + tex('E[R]/E[T]') + ' with ' + tex('E[R]=' + c + '+' + d + '\\cdot' + dec(mean) + '=' + dec(c + d * mean)) + ' and ' + tex('E[T]=' + dec(mean)) + ', giving ' + dec(cost) + ' dollars per day.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'sp-lq-c-poisson', generate: (rng) => build(sample(rng)) }
