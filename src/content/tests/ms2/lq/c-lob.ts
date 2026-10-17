// LQ-C: Markov limit-order-book queues: gambler's-ruin depletion, mid-price move, fill probabilities and the cost of a limit order.
// Lectures 4 (limit-order-book models) and 5 (execution cost of a passive order).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  lam: number; mu: number; n: number; big: number
  a: number; b: number; rb: number; rs: number
  k: number; m: number; nu: number; T: number
  half: number; adv: number
}

export function sample(rng: Rng): Params {
  const lam = rng.int(2, 5)
  let mu = lam
  while (mu === lam) mu = rng.int(2, 6)
  const n = rng.int(2, 4)
  return {
    lam, mu, n, big: n + rng.int(2, 4),
    a: rng.int(1, 3), b: rng.int(1, 4), rb: rng.int(1, 4), rs: rng.int(1, 4),
    k: rng.int(2, 5), m: rng.int(2, 6), nu: rng.int(1, 4), T: rng.pick([0.5, 1, 1.5]),
    half: rng.pick([0.5, 1, 1.5]), adv: rng.pick([0.5, 1, 2]),
  }
}

const choose = (n: number, r: number) => { let c = 1; for (let i = 1; i <= r; i++) c = (c * (n - r + i)) / i; return c }

export function build({ lam, mu, n, big, a, b, rb, rs, k, m, nu, T, half, adv }: Params): LQInstance {
  const rho = mu / lam
  const pHitBig = (1 - rho ** n) / (1 - rho ** big)
  const pEmpty = 1 - pHitBig

  const p = rb / (rb + rs)
  let pUp = 0
  for (let j = 0; j < b; j++) pUp += choose(a - 1 + j, j) * p ** a * (1 - p) ** j

  const pFill = (m / (m + nu)) ** k
  let pois = 0
  for (let j = 0; j < k; j++) pois += Math.exp(-m * T) * (m * T) ** j / [1, 1, 2, 6, 24, 120][j]
  const pWithin = 1 - pois
  const cost = -half * pFill + (half + adv) * (1 - pFill)

  return {
    intro:
      'Answer to 4 decimal places (the last part to 3) and do not round intermediate values. In all parts orders arrive as independent Poisson processes and queue changes happen one at a time.',
    parts: [
      {
        prompt: 'The best-ask queue holds ' + tex(String(n)) + ' orders. New limit orders join at rate ' + tex('\\lambda=' + lam) + ' and orders leave (market orders and cancellations together) at rate ' + tex('\\mu=' + mu) + '. Find the probability that the queue empties before it reaches ' + tex(String(big)) + ' orders.',
        answer: pEmpty, tolerance: tol4, lecture: 4,
        explanation: 'The queue is a random walk with up-probability ' + tex('p=\\lambda/(\\lambda+\\mu)') + ' (gambler\'s ruin). With ' + tex('\\rho=\\mu/\\lambda=' + dec(rho)) + ', ' + tex('P(\\text{reach } ' + big + ')=\\frac{1-\\rho^{' + n + '}}{1-\\rho^{' + big + '}}=' + dec(pHitBig)) + ', so the answer is ' + tex(dec(pEmpty)) + '.',
      },
      {
        prompt: 'The best ask has ' + tex(String(a)) + (a === 1 ? ' order' : ' orders') + ' and the best bid has ' + tex(String(b)) + (b === 1 ? ' order' : ' orders') + '. Queues shrink only through market orders: buys hit the ask at rate ' + tex(String(rb)) + ' and sells hit the bid at rate ' + tex(String(rs)) +
          '. Find the probability that the ask queue is exhausted first, so that the mid-price moves up.',
        answer: pUp, tolerance: tol4, lecture: 4,
        explanation: 'Each market order is a buy with probability ' + tex('p=' + rb + '/' + (rb + rs) + '=' + dec(p)) + '. The ask empties first if ' + tex(String(a)) + ' buys arrive before ' + tex(String(b)) + ' sells: ' + tex('\\sum_{j=0}^{' + (b - 1) + '}\\binom{' + a + '-1+j}{j}p^{' + a + '}(1-p)^j=' + dec(pUp)) + '.',
      },
      {
        prompt: 'A bid order has ' + tex(String(k)) + ' orders in the queue including itself (it fills once ' + tex(String(k)) + ' sell market orders have arrived). Sell market orders arrive at rate ' + tex('m=' + m) + ' and an independent event that moves the price away and cancels the order occurs at rate ' + tex('\\nu=' + nu) + '. Find the probability it fills first.',
        answer: pFill, tolerance: tol4, lecture: 4,
        explanation: 'Each arrival is a market order with probability ' + tex('m/(m+\\nu)=' + dec(m / (m + nu))) + ', and ' + tex(String(k)) + ' in a row are needed: ' + tex('(' + dec(m / (m + nu)) + ')^{' + k + '}=' + dec(pFill)) + '.',
      },
      {
        prompt: 'Ignoring the price-move event, find the probability that the same order (' + tex(String(k)) + ' ahead and including itself, market-order rate ' + tex('m=' + m) + ') fills within time ' + tex('T=' + dec(T)) + '.',
        answer: pWithin, tolerance: tol4, lecture: 4,
        explanation: 'Fills by ' + tex('T') + ' if at least ' + tex(String(k)) + ' market orders arrive: ' + tex('1-\\sum_{j=0}^{' + (k - 1) + '}e^{-mT}(mT)^j/j!=' + dec(pWithin)) + ' with ' + tex('mT=' + dec(m * T)) + '.',
      },
      {
        prompt: 'A trader posts the bid order of the third part, using its fill probability. If filled, the share is bought ' + tex(dec(half)) + ' cents below the mid-price (cost ' + tex('-' + dec(half)) + '). If the price moves first, the trader crosses the spread and pays ' + tex(dec(half)) + ' plus an adverse move of ' + tex(dec(adv)) + ' cents. Find the expected cost per share relative to the original mid-price, in cents (3 decimal places).',
        answer: cost, tolerance: tol3, lecture: 5,
        explanation: tex('p\\cdot(-' + dec(half) + ')+(1-p)(' + dec(half + adv) + ')=' + dec(pFill) + '\\cdot(-' + dec(half) + ')+' + dec(1 - pFill) + '\\cdot' + dec(half + adv) + '=' + dec(cost)) + '. Passive orders save the spread but risk non-execution.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'ms2-lq-c-lob', generate: (rng) => build(sample(rng)) }
