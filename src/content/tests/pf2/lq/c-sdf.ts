// LQ-C: pricing with a stochastic discount factor in a three-state economy.
// Lecture 4 (SDF, no-arbitrage pricing).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { p: number[]; m: number[]; x: number[] } // probabilities in 1/10, SDF and payoffs in 1/100

export function sample(rng: Rng): Params {
  const p = rng.pick([[3, 5, 2], [2, 5, 3], [2, 6, 2], [3, 4, 3], [4, 4, 2]])
  const m = [rng.int(118, 140), rng.int(95, 105), rng.int(70, 88)]
  const x = [rng.int(40, 80), rng.int(90, 110), rng.int(130, 190)]
  return { p, m, x }
}

export function build({ p, m, x }: Params): LQInstance {
  const P = p.map((v) => v / 10), M = m.map((v) => v / 100), X = x.map((v) => v / 100)
  const em = P.reduce((s, v, i) => s + v * M[i], 0)
  const rf = 1 / em
  const price = P.reduce((s, v, i) => s + v * M[i] * X[i], 0)
  const ex = P.reduce((s, v, i) => s + v * X[i], 0)
  const er = ex / price
  const prem = er - rf
  const R = X.map((v) => v / price)
  const cov = P.reduce((s, v, i) => s + v * M[i] * R[i], 0) - em * er

  return {
    intro:
      'There are three states (bad, normal, good) with probabilities ' + tex(P.map(dec).join(',')) + '. The stochastic discount factor takes the values ' + tex(M.map(dec).join(',')) + ' and a risky asset pays ' + tex(X.map(dec).join(',')) + ' in the three states. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the gross risk-free rate ' + tex('R_f=1/E[M]') + '.',
        answer: rf, tolerance: tol4, lecture: 4,
        explanation: tex('E[M]=' + dec(em) + ',\\ R_f=1/' + dec(em)) + ' = ' + dec(rf) + '.',
      },
      {
        prompt: 'Find the price of the risky asset, ' + tex('P=E[MX]') + '.',
        answer: price, tolerance: tol4, lecture: 4,
        explanation: tex('\\sum_s\\pi_sm_sx_s') + ' = ' + dec(price) + '.',
      },
      {
        prompt: 'Find the expected gross return ' + tex('E[X]/P') + ' of the asset.',
        answer: er, tolerance: tol4, lecture: 4,
        explanation: tex('E[X]=' + dec(ex)) + ', so ' + tex(dec(ex) + '/' + dec(price)) + ' = ' + dec(er) + '.',
      },
      {
        prompt: 'Find the risk premium ' + tex('E[R]-R_f') + ' (gross return minus gross risk-free rate).',
        answer: prem, tolerance: tol4, lecture: 4,
        explanation: tex(dec(er) + '-' + dec(rf)) + ' = ' + dec(prem) + '.',
      },
      {
        prompt: 'Find ' + tex('\\operatorname{Cov}(M,R)') + ' for the gross return ' + tex('R=X/P') + '. (Its negative times ' + tex('R_f') + ' equals the risk premium.)',
        answer: cov, tolerance: { abs: 0.00005 }, lecture: 4,
        explanation: tex('E[MR]-E[M]E[R]=1-' + dec(em) + '\\cdot' + dec(er)) + ' = ' + dec(cov) + ', which is negative: the asset pays more in good states, where ' + tex('M') + ' is low.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'pf2-lq-c-sdf', generate: (rng) => build(sample(rng)) }
