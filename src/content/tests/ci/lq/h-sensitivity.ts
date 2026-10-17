// LQ-H: worst-case (Manski) bounds on the ATE, a Rosenbaum sensitivity p-value bound, and conditional average treatment effects.
// Lecture 10 (sensitivity analysis and heterogeneity).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { p: number; m1: number; m0: number; pairs: number; T: number; gamma: number; g: number[] } // p in %, m in %, gamma in tenths, g: four means in tenths

export function sample(rng: Rng): Params {
  const pairs = rng.pick([8, 10, 12])
  return { p: rng.int(30, 70), m1: rng.int(40, 80), m0: rng.int(20, 60), pairs, T: pairs - rng.int(0, 2), gamma: rng.pick([10, 15, 20, 30]), g: [rng.int(40, 90), rng.int(20, 60), rng.int(30, 80), rng.int(20, 70)] }
}

export function build({ p, m1, m0, pairs, T, gamma, g }: Params): LQInstance {
  const P = p / 100, M1 = m1 / 100, M0 = m0 / 100
  const lower = P * M1 - (1 - P) * M0 - P
  const upper = P * M1 + (1 - P) - (1 - P) * M0
  const G = gamma / 10
  const q = G / (1 + G)
  let tail = 0
  for (let k = T; k <= pairs; k++) {
    let c = 1
    for (let i = 1; i <= k; i++) c = (c * (pairs - k + i)) / i
    tail += c * q ** k * (1 - q) ** (pairs - k)
  }
  const tau1 = (g[0] - g[1]) / 10, tau2 = (g[2] - g[3]) / 10

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'An outcome is a proportion in ' + tex('[0,1]') + '. ' + tex(p + '\\%') + ' of units are treated; the treated have mean outcome ' + tex(dec(M1)) + ' and the untreated ' + tex(dec(M0)) + '. With no assumptions about selection, the lower bound on the ATE is ' + tex('P(T{=}1)\\bar Y_1-P(T{=}0)\\bar Y_0-P(T{=}1)') + '. Find it.',
        answer: lower, tolerance: tol4, lecture: 10,
        explanation: tex(dec(P) + '\\cdot' + dec(M1) + '-' + dec(1 - P) + '\\cdot' + dec(M0) + '-' + dec(P)) + ' = ' + dec(lower) + '.',
      },
      {
        prompt: 'Find the upper bound ' + tex('P(T{=}1)\\bar Y_1+P(T{=}0)-P(T{=}0)\\bar Y_0') + ' on the ATE. (The two bounds are always exactly 1 apart for an outcome in ' + tex('[0,1]') + '.)',
        answer: upper, tolerance: tol4, lecture: 10,
        explanation: tex(dec(P) + '\\cdot' + dec(M1) + '+' + dec(1 - P) + '-' + dec(1 - P) + '\\cdot' + dec(M0)) + ' = ' + dec(upper) + '; ' + dec(upper) + '-(' + dec(lower) + ')=1.',
      },
      {
        prompt: 'In ' + tex(pairs) + ' matched pairs, the treated unit had the better outcome in ' + tex(T) + ' pairs. With hidden bias of size ' + tex('\\Gamma=' + dec(G)) + ', the worst-case probability that the treated member does better in a pair is ' + tex('\\Gamma/(1+\\Gamma)') + '. Find the worst-case one-sided p-value ' + tex('P(\\mathrm{Bin}(' + pairs + ',\\Gamma/(1+\\Gamma))\\ge' + T + ')') + '.',
        answer: tail, tolerance: tol4, lecture: 10,
        explanation: 'With ' + tex('q=' + dec(q)) + ', ' + tex('\\sum_{k=' + T + '}^{' + pairs + '}\\binom{' + pairs + '}{k}q^k(1-q)^{' + pairs + '-k}') + ' = ' + dec(tail) + '. At ' + tex('\\Gamma=1') + ' ' + tex('q=0.5') + ' gives the usual sign test.',
      },
      {
        prompt: 'In subgroup A the mean outcomes are ' + tex(dec(g[0] / 10)) + ' (treated) and ' + tex(dec(g[1] / 10)) + ' (control). Find the conditional average treatment effect for subgroup A, assuming randomisation within the subgroup.',
        answer: tau1, tolerance: tol3, lecture: 10,
        explanation: tex(dec(g[0] / 10) + '-' + dec(g[1] / 10)) + ' = ' + dec(tau1) + '.',
      },
      {
        prompt: 'In subgroup B the mean outcomes are ' + tex(dec(g[2] / 10)) + ' (treated) and ' + tex(dec(g[3] / 10)) + ' (control). Find the difference in treatment effects, ' + tex('\\mathrm{CATE}_A-\\mathrm{CATE}_B') + ' (a measure of heterogeneity).',
        answer: tau1 - tau2, tolerance: tol3, lecture: 10,
        explanation: tex(dec(tau1) + '-' + dec(tau2)) + ' = ' + dec(tau1 - tau2) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'ci-lq-h-sensitivity', generate: (rng) => build(sample(rng)) }
