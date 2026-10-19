// LQ-M: the Jeffreys prior for a Poisson rate and a power prior for a binomial proportion with its effective sample size.
// Lecture 5 (choosing priors: Jeffreys, invariance, power priors).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { ys: number[]; m: number; x: number; delta: number; n: number; y: number }

export function sample(rng: Rng): Params {
  const m = rng.pick([20, 30, 40])
  const n = rng.pick([10, 15, 20])
  const x = rng.int(Math.ceil(m * 0.25), Math.floor(m * 0.6))
  return {
    ys: Array.from({ length: rng.pick([4, 5, 6]) }, () => rng.int(0, 6)),
    m, x, delta: rng.pick([0.2, 0.25, 0.5, 0.75]), n,
    y: Math.min(n - 1, Math.max(1, Math.round((n * x) / m) + rng.int(-1, 1))),
  }
}

export function build(P: Params): LQInstance {
  const { ys, m, x, delta, n, y } = P
  const sy = ys.reduce((a, b) => a + b, 0)
  const poiMean = (sy + 0.5) / ys.length
  const a0 = delta * x
  const ess = delta * m
  const postMean = (a0 + y) / (ess + n)
  const postEss = ess + n

  return {
    intro: 'Part A. For i.i.d. Poisson(' + tex('\\lambda') + ') data the Fisher information of one observation is ' + tex('1/\\lambda') + ', so the Jeffreys prior is ' + tex('\\pi(\\lambda)\\propto\\lambda^{-1/2}') + ', a (improper) ' + tex('\\mathrm{Gamma}(\\tfrac12,0)') + ' kernel. The data are ' + tex(ys.join(',\\ ')) + '. Part B. A historical study had ' + tex('x=' + x) + ' successes in ' + tex('m=' + m) + ' trials. Starting from the improper prior ' + tex('\\pi_0(p)\\propto p^{-1}(1-p)^{-1}') + ', the power prior with power ' + tex('\\delta=' + dec(delta)) + ' is ' + tex('\\pi_0(p)\\{p^x(1-p)^{m-x}\\}^\\delta') + '. The new study has ' + tex('y=' + y) + ' successes in ' + tex('n=' + n) + ' trials. The effective sample size of a ' + tex('\\mathrm{Beta}(\\alpha,\\beta)') + ' is ' + tex('\\alpha+\\beta') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Part A. With the Jeffreys prior the posterior is ' + tex('\\mathrm{Gamma}(\\sum y_i+\\tfrac12,\\ n)') + ' (shape, rate). Find its mean.',
        answer: poiMean, tolerance: tol4, lecture: 3,
        explanation: tex('\\sum y_i=' + sy + ',\\ n=' + ys.length) + ', so the mean is ' + tex('(' + sy + '+0.5)/' + ys.length) + ' = ' + dec(poiMean) + '.',
      },
      {
        prompt: 'Part B. The power prior is a Beta distribution. Find its first parameter ' + tex('\\alpha_0=\\delta x') + '.',
        answer: a0, tolerance: tol4, lecture: 3,
        explanation: tex('\\pi_0(p)\\,p^{\\delta x}(1-p)^{\\delta(m-x)}\\propto p^{\\delta x-1}(1-p)^{\\delta(m-x)-1}') + ', a ' + tex('\\mathrm{Beta}(\\delta x,\\ \\delta(m-x))') + '; so ' + tex('\\alpha_0=' + dec(delta) + '\\times' + x) + ' = ' + dec(a0) + ' (and ' + tex('\\beta_0=' + dec(delta * (m - x))) + ').',
      },
      {
        prompt: 'Part B. Find the effective sample size of the power prior, ' + tex('\\alpha_0+\\beta_0=\\delta m') + '. It shows how much weight the historical study gets.',
        answer: ess, tolerance: tol4, lecture: 3,
        explanation: tex(dec(delta) + '\\times' + m) + ' = ' + dec(ess) + '. With ' + tex('\\delta=1') + ' the historical study counts fully, with ' + tex('\\delta=0') + ' not at all.',
      },
      {
        prompt: 'Part B. Find the posterior mean of ' + tex('p') + ' after the new data, ' + tex('(\\alpha_0+y)/(\\delta m+n)') + '.',
        answer: postMean, tolerance: tol4, lecture: 3,
        explanation: 'The posterior is ' + tex('\\mathrm{Beta}(\\alpha_0+y,\\ \\beta_0+n-y)=\\mathrm{Beta}(' + dec(a0 + y) + ',' + dec(delta * (m - x) + n - y) + ')') + ', with mean ' + tex(dec(a0 + y) + '/' + dec(postEss)) + ' = ' + dec(postMean) + '.',
      },
      {
        prompt: 'Part B. Find the effective sample size of the posterior, ' + tex('\\delta m+n') + '.',
        answer: postEss, tolerance: tol4, lecture: 3,
        explanation: tex(dec(ess) + '+' + n) + ' = ' + dec(postEss) + ': the prior effective sample size plus the new number of trials.',
      },
    ],
  }
}

export const genM: LQGenerator = { id: 'bay-lq-m-jeffreys', generate: (rng) => build(sample(rng)) }
