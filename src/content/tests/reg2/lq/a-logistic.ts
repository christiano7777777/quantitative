// LQ-A: a fitted logistic regression (odds ratio, probability, Wald z), a multinomial logit and a proportional odds model.
// Lectures 2 (logistic regression), 3 (Wald test), 5 (multinomial and ordinal models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  b0: number; b1: number; b2: number; x1: number; x2: number; se1: number
  a1: number; c1: number; a2: number; c2: number; xm: number // multinomial: eta_k = a_k + c_k x, baseline eta = 0
  al1: number; al2: number; be: number; xo: number // ordinal: logit P(Y<=j) = alpha_j - beta x
}

const r1 = (rng: Rng, lo: number, hi: number) => rng.int(lo * 10, hi * 10) / 10

export function sample(rng: Rng): Params {
  const al1 = r1(rng, -3, 0)
  return {
    b0: r1(rng, -3, 0.5), b1: rng.pick([0.4, 0.5, 0.6, 0.8, 1.2, -0.5, -0.8]), b2: rng.pick([0.3, 0.5, -0.4, -0.7, 0.9]),
    x1: rng.int(0, 4), x2: rng.int(0, 3), se1: rng.pick([0.15, 0.2, 0.25, 0.3, 0.4]),
    a1: r1(rng, -1.5, 1.5), c1: rng.pick([0.5, 0.8, -0.6, 1.0]), a2: r1(rng, -1.5, 1.5), c2: rng.pick([0.4, -0.5, -0.9, 0.7]), xm: rng.int(1, 3),
    al1, al2: al1 + r1(rng, 0.8, 3), be: rng.pick([0.5, 0.8, 1.0, -0.6]), xo: rng.int(0, 3),
  }
}

export const expit = (z: number) => 1 / (1 + Math.exp(-z))

export function build(p: Params): LQInstance {
  const eta = p.b0 + p.b1 * p.x1 + p.b2 * p.x2
  const or = Math.exp(p.b1)
  const prob = expit(eta)
  const z = p.b1 / p.se1
  const e1 = p.a1 + p.c1 * p.xm, e2 = p.a2 + p.c2 * p.xm
  const pm1 = Math.exp(e1) / (1 + Math.exp(e1) + Math.exp(e2))
  const po2 = expit(p.al2 - p.be * p.xo) - expit(p.al1 - p.be * p.xo)

  return {
    intro:
      'A logistic regression for a binary outcome has fitted ' + tex('\\operatorname{logit}\\,\\hat p=' + dec(p.b0) + (p.b1 >= 0 ? '+' : '') + dec(p.b1) + 'x_1' + (p.b2 >= 0 ? '+' : '') + dec(p.b2) + 'x_2') +
      ', and the standard error of the coefficient of ' + tex('x_1') + ' is ' + tex(dec(p.se1)) + '. Give decimal answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'By what factor does a one-unit increase in ' + tex('x_1') + ' multiply the odds of the outcome (with ' + tex('x_2') + ' fixed)?',
        answer: or, tolerance: tol4, lecture: 2,
        explanation: 'The odds ratio is ' + tex('e^{\\beta_1}=e^{' + dec(p.b1) + '}') + ' = ' + dec(or) + '.',
      },
      {
        prompt: 'Find the fitted probability of the outcome when ' + tex('x_1=' + p.x1 + ',\\ x_2=' + p.x2) + '.',
        answer: prob, tolerance: tol4, lecture: 2,
        explanation: tex('\\eta=' + dec(p.b0) + '+' + dec(p.b1) + '\\cdot' + p.x1 + '+' + dec(p.b2) + '\\cdot' + p.x2 + '=' + dec(eta)) + ' and ' + tex('p=1/(1+e^{-\\eta})') + ' = ' + dec(prob) + '.',
      },
      {
        prompt: 'Find the Wald statistic ' + tex('z=\\hat\\beta_1/\\operatorname{se}(\\hat\\beta_1)') + ' for testing ' + tex('H_0:\\beta_1=0') + ' (3 decimal places).',
        answer: z, tolerance: tol3, lecture: 3,
        explanation: tex('z=' + dec(p.b1) + '/' + dec(p.se1)) + ' = ' + dec(z) + ', compared with the standard normal.',
      },
      {
        prompt: 'A separate three-class multinomial logit model (baseline class 3) has linear predictors ' + tex('\\eta_1=' + dec(p.a1) + (p.c1 >= 0 ? '+' : '') + dec(p.c1) + 'x') + ' and ' + tex('\\eta_2=' + dec(p.a2) + (p.c2 >= 0 ? '+' : '') + dec(p.c2) + 'x') +
          ', with ' + tex('\\eta_3=0') + '. Find the probability of class 1 when ' + tex('x=' + p.xm) + '.',
        answer: pm1, tolerance: tol4, lecture: 5,
        explanation: tex('\\eta_1=' + dec(e1) + ',\\ \\eta_2=' + dec(e2)) + ', so ' + tex('P(1)=e^{\\eta_1}/(1+e^{\\eta_1}+e^{\\eta_2})') + ' = ' + dec(pm1) + '.',
      },
      {
        prompt: 'An ordinal outcome with categories 1, 2, 3 follows the proportional odds model ' + tex('\\operatorname{logit}P(Y\\le j)=\\alpha_j-\\beta x') + ' with ' + tex('\\alpha_1=' + dec(p.al1) + ',\\ \\alpha_2=' + dec(p.al2) + ',\\ \\beta=' + dec(p.be)) +
          '. Find ' + tex('P(Y=2)') + ' when ' + tex('x=' + p.xo) + '.',
        answer: po2, tolerance: tol4, lecture: 5,
        explanation: tex('P(Y\\le1)=\\mathrm{expit}(' + dec(p.al1 - p.be * p.xo) + ')') + ' and ' + tex('P(Y\\le2)=\\mathrm{expit}(' + dec(p.al2 - p.be * p.xo) + ')') + '; the difference is ' + dec(po2) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'reg2-lq-a-logistic', generate: (rng) => build(sample(rng)) }
