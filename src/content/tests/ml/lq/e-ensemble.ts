// LQ-E: variance of an average of correlated models (bagging) and posterior class probabilities of generative classifiers.
// Lectures 7 (ensembles) and 8 (generative models: LDA, naive Bayes).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { B: number; s2: number; rho: number; m0: number; m1: number; sd: number; pi1: number; x: number; q: number[]; r: number[]; obs: number[] }

export function sample(rng: Rng): Params {
  const m0 = rng.int(0, 20) / 10
  return {
    B: rng.pick([10, 25, 100]), s2: rng.pick([1, 2, 4]), rho: rng.pick([0.1, 0.3, 0.5, 0.7]),
    m0, m1: m0 + rng.int(10, 30) / 10, sd: rng.pick([1, 1.5, 2]), pi1: rng.pick([0.2, 0.3, 0.4, 0.5]), x: rng.int(-10, 40) / 10,
    q: [rng.int(5, 9) / 10, rng.int(5, 9) / 10], r: [rng.int(1, 5) / 10, rng.int(1, 5) / 10], obs: [1, rng.int(0, 1)],
  }
}

export function build({ B, s2, rho, m0, m1, sd, pi1, x, q, r, obs }: Params): LQInstance {
  const varAvg = rho * s2 + ((1 - rho) * s2) / B
  const varInf = rho * s2
  const dens = (m: number) => Math.exp(-0.5 * ((x - m) / sd) ** 2)
  const post = (pi1 * dens(m1)) / (pi1 * dens(m1) + (1 - pi1) * dens(m0))
  const bound = (m0 + m1) / 2 + (sd * sd * Math.log((1 - pi1) / pi1)) / (m1 - m0)
  const like = (p: number[], o: number[]) => p.reduce((a, pj, j) => a * (o[j] ? pj : 1 - pj), 1)
  const nb = (pi1 * like(q, obs)) / (pi1 * like(q, obs) + (1 - pi1) * like(r, obs))

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: tex(B) + ' predictors each have variance ' + tex('\\sigma^2=' + dec(s2)) + ' and pairwise correlation ' + tex('\\rho=' + dec(rho)) + '. Find the variance of their average, ' + tex('\\rho\\sigma^2+(1-\\rho)\\sigma^2/B') + '.',
        answer: varAvg, tolerance: tol4, lecture: 7,
        explanation: tex(dec(rho) + '\\cdot' + dec(s2) + '+' + dec(1 - rho) + '\\cdot' + dec(s2) + '/' + B) + ' = ' + dec(varAvg) + '.',
      },
      {
        prompt: 'What does that variance tend to as the number of averaged predictors ' + tex('B\\to\\infty') + '? (Averaging cannot remove the correlated part.)',
        answer: varInf, tolerance: tol4, lecture: 7,
        explanation: tex('\\rho\\sigma^2=' + dec(rho) + '\\cdot' + dec(s2)) + ' = ' + dec(varInf) + '.',
      },
      {
        prompt: 'In a two-class generative model, ' + tex('x\\mid y=k\\sim N(\\mu_k,' + dec(sd * sd) + ')') + ' with ' + tex('\\mu_0=' + dec(m0) + ',\\ \\mu_1=' + dec(m1)) + ' and prior ' + tex('P(y=1)=' + dec(pi1)) + '. Find the posterior probability of class 1 at ' + tex('x=' + dec(x)) + '.',
        answer: post, tolerance: tol4, lecture: 8,
        explanation: 'Bayes: ' + tex('\\dfrac{\\pi_1e^{-(x-\\mu_1)^2/2\\sigma^2}}{\\pi_1e^{-(x-\\mu_1)^2/2\\sigma^2}+\\pi_0e^{-(x-\\mu_0)^2/2\\sigma^2}}') + ' = ' + dec(post) + '.',
      },
      {
        prompt: 'For the same LDA model find the decision boundary, the ' + tex('x') + ' at which the posterior is ' + tex('1/2') + ': ' + tex('\\tfrac{\\mu_0+\\mu_1}2+\\dfrac{\\sigma^2\\ln(\\pi_0/\\pi_1)}{\\mu_1-\\mu_0}') + '.',
        answer: bound, tolerance: tol4, lecture: 8,
        explanation: tex(dec((m0 + m1) / 2) + '+' + dec(sd * sd) + '\\ln(' + dec(1 - pi1) + '/' + dec(pi1) + ')/' + dec(m1 - m0)) + ' = ' + dec(bound) + '; a rarer class 1 pushes the boundary towards it.',
      },
      {
        prompt: 'A naive Bayes classifier has two binary features that are independent given the class. Given class 1 they equal 1 with probabilities ' + tex(q.map(dec).join(',')) + '; given class 0 with probabilities ' + tex(r.map(dec).join(',')) + '. With prior ' + tex('P(y=1)=' + dec(pi1)) + ', find ' + tex('P(y=1\\mid x_1=' + obs[0] + ',x_2=' + obs[1] + ')') + '.',
        answer: nb, tolerance: tol4, lecture: 8,
        explanation: 'Likelihoods ' + tex(dec(like(q, obs)) + '\\text{ (class 1)},\\ ' + dec(like(r, obs)) + '\\text{ (class 0)}') + '; Bayes gives ' + dec(nb) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'ml-lq-e-ensemble', generate: (rng) => build(sample(rng)) }
