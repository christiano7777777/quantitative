// LQ-R: exponential families: natural parameters and natural statistics (Poisson and normal) and the variance of the natural statistic.
// Lecture 8 (exponential families).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { lam: number; x: number[]; mu: number; s2: number; n: number; p: number }

export function sample(rng: Rng): Params {
  return {
    lam: rng.pick([0.5, 1.5, 2, 2.5, 4]), x: Array.from({ length: 5 }, () => rng.int(0, 7)),
    mu: rng.int(-6, 8) / 2, s2: rng.pick([0.5, 1, 2, 4]), n: rng.pick([5, 8, 10, 20]), p: rng.pick([0.2, 0.3, 0.4, 0.6, 0.7]),
  }
}

export function build({ lam, x, mu, s2, n, p }: Params): LQInstance {
  const eta = Math.log(lam)
  const tsum = x.reduce((a, b) => a + b, 0)
  const eta1 = -1 / (2 * s2)
  const eta2 = mu / s2
  const varT = n * p * (1 - p)

  return {
    intro: 'A family ' + tex('f(x\\mid\\eta)=h(x)\\exp\\{\\sum_j\\eta_jt_j(x)-A(\\eta)\\}') + ' is an exponential family with natural parameter ' + tex('\\eta') + ' and natural statistic ' + tex('(t_1,\\dots,t_k)') + '. For ' + tex('N(\\mu,\\sigma^2)') + ' take ' + tex('t_1(x)=x^2') + ' and ' + tex('t_2(x)=x') + '. For an i.i.d. sample the natural statistic is ' + tex('T_j=\\sum_it_j(X_i)') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A Poisson family has ' + tex('f(x\\mid\\lambda)=e^{-\\lambda}\\lambda^x/x!=\\frac1{x!}\\exp\\{x\\ln\\lambda-\\lambda\\}') + '. Find the natural parameter ' + tex('\\eta') + ' when ' + tex('\\lambda=' + dec(lam)) + '.',
        answer: eta, tolerance: tol4, lecture: 5,
        explanation: tex('\\eta=\\ln\\lambda=\\ln' + dec(lam)) + ' = ' + dec(eta) + ', with natural statistic ' + tex('t(x)=x') + ' and ' + tex('A(\\eta)=e^\\eta=\\lambda') + '.',
      },
      {
        prompt: 'For the Poisson sample ' + tex(x.join(',\\ ')) + ' find the natural statistic ' + tex('T=\\sum_iX_i') + '. Give a whole number.',
        answer: tsum, tolerance: tolInt, lecture: 5,
        explanation: tex(x.join('+')) + ' = ' + tsum + '. The joint probability function of the sample is again of exponential family form with the same natural parameter.',
      },
      {
        prompt: 'For ' + tex('N(\\mu,\\sigma^2)') + ' with ' + tex('\\mu=' + dec(mu) + ',\\ \\sigma^2=' + dec(s2)) + ' find the natural parameter ' + tex('\\eta_1=-1/(2\\sigma^2)') + ' (the coefficient of ' + tex('x^2') + ').',
        answer: eta1, tolerance: tol4, lecture: 5,
        explanation: 'Expand ' + tex('-(x-\\mu)^2/(2\\sigma^2)=-x^2/(2\\sigma^2)+\\mu x/\\sigma^2-\\mu^2/(2\\sigma^2)') + ': the coefficient of ' + tex('x^2') + ' is ' + tex('-1/(2\\times' + dec(s2) + ')') + ' = ' + dec(eta1) + '.',
      },
      {
        prompt: 'For the same normal distribution find ' + tex('\\eta_2=\\mu/\\sigma^2') + ' (the coefficient of ' + tex('x') + ').',
        answer: eta2, tolerance: tol4, lecture: 5,
        explanation: tex('\\mu/\\sigma^2=' + dec(mu) + '/' + dec(s2)) + ' = ' + dec(eta2) + '. The natural parameter space is ' + tex('\\eta_1<0') + ' and ' + tex('\\eta_2\\in\\mathbb R') + '.',
      },
      {
        prompt: 'For ' + tex(n) + ' i.i.d. Bernoulli(' + tex(dec(p)) + ') observations the natural statistic ' + tex('T=\\sum X_i') + ' has variance ' + tex('A_n\'\'(\\eta)=n\\,p(1-p)') + ' where ' + tex('A_n(\\eta)=n\\ln(1+e^\\eta)') + '. Find it.',
        answer: varT, tolerance: tol4, lecture: 5,
        explanation: tex('A_n\'(\\eta)=ne^\\eta/(1+e^\\eta)=np') + ' is the mean of ' + tex('T') + ' and ' + tex('A_n\'\'(\\eta)=np(1-p)=' + n + '\\times' + dec(p) + '\\times' + dec(1 - p)) + ' = ' + dec(varT) + '.',
      },
    ],
  }
}

export const genR: LQGenerator = { id: 'inf-lq-r-expfam', generate: (rng) => build(sample(rng)) }
