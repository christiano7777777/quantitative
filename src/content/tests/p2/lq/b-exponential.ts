// LQ-B: an exponential sample: the sampling distribution of the mean, MLE, bias and MSE of the MLE, a Chebyshev bound.
// Lectures 1 (sampling distributions), 4 (MLE), 5 (bias and MSE), 2 (Chebyshev bound).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  n: number
  lam: number // true rate used in parts (a), (d), (e)
  c: number // threshold for the sample mean
  eps: number // Chebyshev deviation for the sample mean
  tenths: number[] // observations in units of 0.1
}

export function sample(rng: Rng): Params {
  const n = rng.pick([3, 4, 5])
  const lam = rng.pick([0.5, 1, 2])
  let c: number
  do c = rng.pick([0.5, 1, 1.5, 2, 2.5, 3])
  while (lam * n * c < 1.5 || lam * n * c > 8)
  let eps: number
  do eps = rng.pick([0.5, 1, 1.5, 2, 3])
  while (1 / (lam * lam * n * eps * eps) > 0.9 || 1 / (lam * lam * n * eps * eps) < 0.05)
  const tenths = Array.from({ length: n }, () => rng.int(2, 40))
  return { n, lam, c, eps, tenths }
}

export function build({ n, lam, c, eps, tenths }: Params): LQInstance {
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
  const bias = lam / (n - 1) // E[n/T] = n lam/(n-1)
  const mseMle = (lam * lam * (n + 2)) / ((n - 1) * (n - 2))
  const cheb = 1 / (lam * lam * n * eps * eps)
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
        answer: mle, tolerance: tol4, lecture: 4,
        explanation: tex('\\ell(\\lambda)=n\\log\\lambda-\\lambda\\sum x_i') + ' has score ' + tex('n/\\lambda-\\sum x_i') + ', so ' + tex('\\hat\\lambda=n/\\sum x_i=' + n + '/' + dec(total)) + ' = ' + dec(mle) + '.',
      },
      {
        prompt: 'The sum ' + tex('T=\\sum X_i') + ' has a Gamma distribution with ' + tex('E[1/T]=\\lambda/(n-1)') + '. When ' + tex('\\lambda=' + dec(lam)) + ', what is the bias of the maximum likelihood estimator ' + tex('\\hat\\lambda=n/T') + ' for a sample of size ' + tex(n) + '?',
        answer: bias, tolerance: tol4, lecture: 5,
        explanation: tex('E\\hat\\lambda=nE[1/T]=\\dfrac{n\\lambda}{n-1}') + ', so the bias is ' + tex('\\dfrac{n\\lambda}{n-1}-\\lambda=\\dfrac{\\lambda}{n-1}=\\dfrac{' + dec(lam) + '}{' + (n - 1) + '}') + ' = ' + dec(bias) + '. The MLE overestimates on average.',
      },
      {
        prompt: 'Use ' + tex('E[1/T^2]=\\dfrac{\\lambda^2}{(n-1)(n-2)}') + ' to find the mean squared error of ' + tex('\\hat\\lambda=n/T') + ' when ' + tex('\\lambda=' + dec(lam)) + '.',
        answer: mseMle, tolerance: tol4, lecture: 5,
        explanation: tex('E\\hat\\lambda^2=\\dfrac{n^2\\lambda^2}{(n-1)(n-2)}') + ', so ' + tex('\\mathrm{MSE}=E\\hat\\lambda^2-2\\lambda E\\hat\\lambda+\\lambda^2=\\lambda^2\\Big[\\dfrac{n^2}{(n-1)(n-2)}-\\dfrac{2n}{n-1}+1\\Big]=\\dfrac{(n+2)\\lambda^2}{(n-1)(n-2)}=\\dfrac{' + dec(lam * lam) + '\\cdot' + (n + 2) + '}{' + (n - 1) * (n - 2) + '}') + ' = ' + dec(mseMle) + '.',
      },
      {
        prompt: 'Still with ' + tex('\\lambda=' + dec(lam)) + ', use Chebyshev\'s inequality to give an upper bound for ' + tex('P(|\\bar X-1/\\lambda|\\ge' + dec(eps) + ')') + ' with ' + tex(n) + ' observations. (The variance of one observation is ' + tex('1/\\lambda^2') + '.)',
        answer: cheb, tolerance: tol4, lecture: 2,
        explanation: tex('E\\bar X=1/\\lambda') + ' and ' + tex('\\operatorname{Var}\\bar X=\\dfrac{1}{n\\lambda^2}') + ', so Chebyshev gives ' + tex('\\dfrac{1}{n\\lambda^2\\varepsilon^2}=\\dfrac{1}{' + dec(n * lam * lam * eps * eps) + '}') + ' = ' + dec(cheb) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'p2-lq-b-exponential', generate: (rng) => build(sample(rng)) }
