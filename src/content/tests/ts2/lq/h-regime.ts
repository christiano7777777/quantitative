// LQ-H: a two-regime Markov switching model: prior regime probability, likelihood ratio, filtered probability, duration, stationary probability.
// Lecture 9 (regime switching, Hamilton filter).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { mu1: number; s1: number; mu2: number; s2: number; p11: number; p22: number; pi: number; y: number }

export function sample(rng: Rng): Params {
  return {
    mu1: rng.pick([0.5, 1]), s1: rng.pick([1, 1.5]), mu2: rng.pick([-1, -0.5]), s2: rng.pick([2, 3]),
    p11: rng.pick([0.9, 0.95, 0.98]), p22: rng.pick([0.8, 0.85, 0.9]), pi: rng.pick([0.5, 0.6, 0.7, 0.8, 0.9]), y: rng.int(-40, 30) / 10,
  }
}

export const npdf = (y: number, m: number, s: number) => Math.exp(-0.5 * ((y - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI))

export function build({ mu1, s1, mu2, s2, p11, p22, pi, y }: Params): LQInstance {
  const prior = pi * p11 + (1 - pi) * (1 - p22)
  const lr = (s2 / s1) * Math.exp(-0.5 * (((y - mu1) / s1) ** 2 - ((y - mu2) / s2) ** 2))
  const post = (prior * lr) / (prior * lr + (1 - prior))
  const dur = 1 / (1 - p11)
  const stat = (1 - p22) / (2 - p11 - p22)

  return {
    intro:
      'Returns follow a two-regime Markov switching model: in regime 1, ' + tex('y_t\\sim N(' + dec(mu1) + ',' + dec(s1 * s1) + ')') + '; in regime 2, ' + tex('y_t\\sim N(' + dec(mu2) + ',' + dec(s2 * s2) + ')') +
      '. The transition probabilities are ' + tex('p_{11}=' + dec(p11) + ',\\ p_{22}=' + dec(p22)) + '. At time ' + tex('t-1') + ' the filtered probability of regime 1 is ' + tex(dec(pi)) + ', and then ' + tex('y_t=' + dec(y)) + ' is observed. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the predicted probability ' + tex('P(s_t=1\\mid y_{1:t-1})') + ' of regime 1 before seeing ' + tex('y_t') + '.',
        answer: prior, tolerance: tol4, lecture: 9,
        explanation: tex(dec(pi) + '\\cdot' + dec(p11) + '+' + dec(1 - pi) + '\\cdot' + dec(1 - p22)) + ' = ' + dec(prior) + '.',
      },
      {
        prompt: 'Find the ratio of densities ' + tex('f_1(y_t)/f_2(y_t)') + ' of the observation under the two regimes.',
        answer: lr, tolerance: { abs: 0.0001, rel: 0.0005 }, lecture: 9,
        explanation: tex('\\dfrac{s_2}{s_1}\\exp\\{-\\tfrac12[(y-\\mu_1)^2/s_1^2-(y-\\mu_2)^2/s_2^2]\\}') + ' = ' + dec(lr) + '.',
      },
      {
        prompt: 'Find the filtered probability ' + tex('P(s_t=1\\mid y_{1:t})') + ' of regime 1 after seeing ' + tex('y_t') + '.',
        answer: post, tolerance: tol4, lecture: 9,
        explanation: 'Bayes: ' + tex('\\dfrac{' + dec(prior) + '\\cdot f_1}{' + dec(prior) + '\\cdot f_1+' + dec(1 - prior) + '\\cdot f_2}') + ' = ' + dec(post) + '.',
      },
      {
        prompt: 'Find the expected duration (in periods) of a spell in regime 1.',
        answer: dur, tolerance: { abs: 0.0001, rel: 0.0005 }, lecture: 9,
        explanation: tex('1/(1-p_{11})=1/' + dec(1 - p11)) + ' = ' + dec(dur) + '.',
      },
      {
        prompt: 'Find the long-run (stationary) probability of regime 1, ' + tex('(1-p_{22})/(2-p_{11}-p_{22})') + '.',
        answer: stat, tolerance: tol4, lecture: 9,
        explanation: tex(dec(1 - p22) + '/' + dec(2 - p11 - p22)) + ' = ' + dec(stat) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'ts2-lq-h-regime', generate: (rng) => build(sample(rng)) }
