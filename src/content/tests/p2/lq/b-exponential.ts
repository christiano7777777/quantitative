// LQ-B: an exponential sample: the sampling distribution of the mean, MLE, UMVUE, Cramer-Rao bound and variance of the UMVUE.
// Lectures 1 (sampling distributions), 3 (MLE), 5 (UMVUE via the sufficient statistic), 6 (Fisher information, Cramer-Rao).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  n: number
  lam: number // true rate used in parts (a), (d), (e)
  c: number // threshold for the sample mean
  tenths: number[] // observations in units of 0.1
}

export function sample(rng: Rng): Params {
  const n = rng.pick([3, 4, 5])
  const lam = rng.pick([0.5, 1, 2])
  let c: number
  do c = rng.pick([0.5, 1, 1.5, 2, 2.5, 3])
  while (lam * n * c < 1.5 || lam * n * c > 8)
  const tenths = Array.from({ length: n }, () => rng.int(2, 40))
  return { n, lam, c, tenths }
}

export function build({ n, lam, c, tenths }: Params): LQInstance {
  const xs = tenths.map((t) => t / 10)
  const total = xs.reduce((s, x) => s + x, 0)
  const m = lam * n * c
  // P(Xbar > c) = P(Gamma(n, lam) > n c) = P(Poisson(lam n c) <= n - 1)
  let tail = 0
  let term = Math.exp(-m)
  for (let k = 0; k < n; k++) {
    tail += term
    term *= m / (k + 1)
  }
  const mle = n / total
  const umvue = (n - 1) / total
  const crb = (lam * lam) / n
  const varU = (lam * lam) / (n - 2)
  const L = tex('\\lambda')

  return {
    intro:
      tex('X_1,\\dots,X_n') + ' are i.i.d. exponential with rate ' + L + ' (density ' + tex('\\lambda e^{-\\lambda x}') + ', mean ' + tex('1/\\lambda') + '). The observed sample of size ' + tex(n) + ' is ' + xs.map(dec).join(', ') +
      '. Give decimal answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Suppose the true rate is ' + tex('\\lambda=' + dec(lam)) + '. The sum of ' + tex(n) + ' such variables has a Gamma distribution, and ' + tex('P(\\mathrm{Gamma}(n,\\lambda)>t)=e^{-\\lambda t}\\sum_{k=0}^{n-1}(\\lambda t)^k/k!') + ' for integer ' + tex('n') + '. Find ' + tex('P(\\bar X>' + dec(c) + ')') + ' for a sample of size ' + tex(n) + '.',
        answer: tail, tolerance: tol4, lecture: 1,
        explanation: tex('\\bar X>c') + ' means the sum exceeds ' + tex('nc=' + dec(n * c)) + ', so with ' + tex('\\lambda nc=' + dec(m)) + ' the probability is ' + tex('e^{-' + dec(m) + '}\\sum_{k=0}^{' + (n - 1) + '}' + dec(m) + '^k/k!') + ' = ' + dec(tail) + '.',
      },
      {
        prompt: 'Find the maximum likelihood estimate of ' + L + ' from the observed sample.',
        answer: mle, tolerance: tol4, lecture: 3,
        explanation: tex('\\ell(\\lambda)=n\\log\\lambda-\\lambda\\sum x_i') + ' has score ' + tex('n/\\lambda-\\sum x_i') + ', so ' + tex('\\hat\\lambda=n/\\sum x_i=' + n + '/' + dec(total)) + ' = ' + dec(mle) + '.',
      },
      {
        prompt: tex('T=\\sum X_i') + ' is complete and sufficient and ' + tex('E[1/T]=\\lambda/(n-1)') + '. Find the UMVUE of ' + L + ' evaluated on the observed sample.',
        answer: umvue, tolerance: tol4, lecture: 5,
        explanation: 'Since ' + tex('E\\big[\\tfrac{n-1}{T}\\big]=\\lambda') + ' and it is a function of the complete sufficient ' + tex('T') + ', the UMVUE is ' + tex('(n-1)/T=' + (n - 1) + '/' + dec(total)) + ' = ' + dec(umvue) + '. The MLE is biased upward.',
      },
      {
        prompt: 'The Fisher information of one observation is ' + tex('I(\\lambda)=1/\\lambda^2') + '. For ' + tex('\\lambda=' + dec(lam)) + ', what is the Cramer-Rao lower bound for the variance of an unbiased estimator of ' + L + ' from ' + tex(n) + ' observations?',
        answer: crb, tolerance: tol4, lecture: 6,
        explanation: tex('1/\\{nI(\\lambda)\\}=\\lambda^2/n=' + dec(lam * lam) + '/' + n) + ' = ' + dec(crb) + '.',
      },
      {
        prompt: 'For the UMVUE ' + tex('(n-1)/T') + ' of part (c), use ' + tex('E[1/T^2]=\\dfrac{\\lambda^2}{(n-1)(n-2)}') + ' to find its variance when ' + tex('\\lambda=' + dec(lam)) + '. (It exceeds the bound in part (d).)',
        answer: varU, tolerance: tol4, lecture: 5,
        explanation: tex('\\operatorname{Var}=(n-1)^2\\Big[\\dfrac{\\lambda^2}{(n-1)(n-2)}-\\dfrac{\\lambda^2}{(n-1)^2}\\Big]=\\dfrac{\\lambda^2}{n-2}=\\dfrac{' + dec(lam * lam) + '}{' + (n - 2) + '}') + ' = ' + dec(varU) + ', larger than ' + dec(crb) + ': the UMVUE does not attain the bound.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'inf-lq-b-exponential', generate: (rng) => build(sample(rng)) }
