// LQ-K (lecture quiz only): Fisher information and the Cramer-Rao bound for a Bernoulli sample.
// Lecture 6 (information inequality).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { p: number; n: number; m: number }

export function sample(rng: Rng): Params {
  const n = rng.pick([10, 20, 25, 40])
  return { p: rng.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.8]), n, m: rng.pick([n / 2, n / 5, (3 * n) / 5].filter(Number.isInteger)) }
}

export function build({ p, n, m }: Params): LQInstance {
  const q = 1 - p
  const info = 1 / (p * q)
  const bound = (p * q) / n
  const boundSq = (4 * p * p * p * q) / n
  const eff = m / n
  const infoLogit = p * q

  return {
    intro: 'Let ' + tex('X_1,\\dots,X_{' + n + '}') + ' be independent Bernoulli observations with success probability ' + tex('p') + ', and take ' + tex('p=' + dec(p)) + ' in every part. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the Fisher information of one observation, ' + tex('I_1(p)=1/\\{p(1-p)\\}') + '.',
        answer: info, tolerance: tol4, lecture: 7,
        explanation: 'The score is ' + tex('x/p-(1-x)/(1-p)') + ' and its variance is ' + tex('1/\\{p(1-p)\\}') + ' = ' + tex('1/(' + dec(p) + '\\times' + dec(q) + ')') + ' = ' + dec(info) + '.',
      },
      {
        prompt: 'Find the Cramer-Rao lower bound for the variance of an unbiased estimator of ' + tex('p') + ' from all ' + tex(n) + ' observations, ' + tex('1/\\{nI_1(p)\\}') + '.',
        answer: bound, tolerance: tol4, lecture: 7,
        explanation: 'The information of ' + tex(n) + ' independent observations adds: ' + tex('1/(' + n + '\\times' + dec(info) + ')') + ' = ' + dec(bound) + '. The sample proportion attains it.',
      },
      {
        prompt: 'Find the Cramer-Rao lower bound for an unbiased estimator of ' + tex('g(p)=p^2') + ', ' + tex('\\{g\'(p)\\}^2/\\{nI_1(p)\\}') + '.',
        answer: boundSq, tolerance: tol4, lecture: 7,
        explanation: tex('g\'(p)=2p=' + dec(2 * p)) + ', so the bound is ' + tex('(' + dec(2 * p) + ')^2\\times' + dec(bound)) + ' = ' + dec(boundSq) + '.',
      },
      {
        prompt: 'An estimator uses only the first ' + tex(m) + ' of the ' + tex(n) + ' observations: ' + tex('\\bar X_{' + m + '}') + '. Find its efficiency, the Cramer-Rao bound for ' + tex('p') + ' divided by its variance.',
        answer: eff, tolerance: tol4, lecture: 7,
        explanation: tex('\\mathrm{Var}(\\bar X_{' + m + '})=pq/' + m) + ', so the efficiency is ' + tex('(pq/' + n + ')/(pq/' + m + ')=' + m + '/' + n) + ' = ' + dec(eff) + '.',
      },
      {
        prompt: 'Reparametrise by the log-odds ' + tex('\\eta=\\log\\{p/(1-p)\\}') + '. Find the Fisher information of one observation about ' + tex('\\eta') + ', ' + tex('I_1(p)\\{dp/d\\eta\\}^2') + ' with ' + tex('dp/d\\eta=p(1-p)') + '.',
        answer: infoLogit, tolerance: tol4, lecture: 7,
        explanation: tex(dec(info) + '\\times(' + dec(p * q) + ')^2') + ' = ' + dec(infoLogit) + ', that is ' + tex('p(1-p)') + '. Information changes with the parametrisation by the squared derivative.',
      },
    ],
  }
}

export const genK: LQGenerator = { id: 'inf-lq-k-information', generate: (rng) => build(sample(rng)) }
