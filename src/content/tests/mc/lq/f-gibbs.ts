// LQ-F: Gibbs sampling for a bivariate normal (conditionals, autocorrelation, effective sample size) and the R-hat diagnostic.
// Lectures 9 (Gibbs sampling) and 10 (MCMC diagnostics).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { mu1: number; mu2: number; s1: number; s2: number; rho: number; x2: number; N: number; chains: number[][] }

export function sample(rng: Rng): Params {
  for (;;) {
    const rhoMag = rng.int(3, 9) / 10
    const chains = [0, 1].map(() => Array.from({ length: 4 }, () => rng.int(0, 9)))
    if (chains.every((c) => new Set(c).size > 1)) {
      return { mu1: rng.int(-3, 3), mu2: rng.int(-3, 3), s1: rng.int(1, 3), s2: rng.int(1, 3), rho: rng.pick([-1, 1]) * rhoMag, x2: rng.int(-30, 30) / 10, N: rng.pick([1000, 2000, 5000, 10000]), chains }
    }
  }
}

export function rhat(chains: number[][]): number {
  const n = chains[0].length, m = chains.length
  const means = chains.map((c) => c.reduce((s, v) => s + v, 0) / n)
  const grand = means.reduce((s, v) => s + v, 0) / m
  const W = chains.reduce((s, c, j) => s + c.reduce((t, v) => t + (v - means[j]) ** 2, 0) / (n - 1), 0) / m
  const B = (n * means.reduce((s, v) => s + (v - grand) ** 2, 0)) / (m - 1)
  const varPlus = ((n - 1) / n) * W + B / n
  return Math.sqrt(varPlus / W)
}

export function build({ mu1, mu2, s1, s2, rho, x2, N, chains }: Params): LQInstance {
  const cm = mu1 + rho * (s1 / s2) * (x2 - mu2)
  const csd = s1 * Math.sqrt(1 - rho * rho)
  const ar = rho * rho
  const ess = (N * (1 - ar)) / (1 + ar)
  const rh = rhat(chains)

  return {
    intro: 'A Gibbs sampler targets a bivariate normal ' + tex('(X_1,X_2)') + ' with means ' + tex(mu1 + ',\\ ' + mu2) + ', standard deviations ' + tex(s1 + ',\\ ' + s2) + ' and correlation ' + tex('\\rho=' + dec(rho)) + '. Give answers to 4 decimal places except where stated.',
    parts: [
      {
        prompt: 'The Gibbs step for ' + tex('X_1') + ' draws from its full conditional given ' + tex('X_2=' + dec(x2)) + '. Find the conditional mean ' + tex('E[X_1\\mid X_2=' + dec(x2) + ']') + '.',
        answer: cm, tolerance: tol4, lecture: 9,
        explanation: tex('\\mu_1+\\rho\\frac{\\sigma_1}{\\sigma_2}(x_2-\\mu_2)=' + mu1 + '+' + dec(rho) + '\\times\\frac{' + s1 + '}{' + s2 + '}\\times(' + dec(x2 - mu2) + ')=' + dec(cm)) + '.',
      },
      {
        prompt: 'Find the conditional standard deviation of ' + tex('X_1') + ' given ' + tex('X_2') + '.',
        answer: csd, tolerance: tol4, lecture: 9,
        explanation: tex('\\sigma_1\\sqrt{1-\\rho^2}=' + s1 + '\\sqrt{1-' + dec(rho * rho) + '}=' + dec(csd)) + '. It does not depend on the value of ' + tex('x_2') + '.',
      },
      {
        prompt: 'The sequence of ' + tex('X_1') + ' values produced by this Gibbs sampler is an AR(1) process. Find its lag-1 autocorrelation (the AR coefficient ' + tex('\\rho^2') + ').',
        answer: ar, tolerance: tol4, lecture: 10,
        explanation: 'Each sweep multiplies the deviation by ' + tex('\\rho\\cdot\\rho=\\rho^2=' + dec(ar)) + ', so the autocorrelation at lag ' + tex('k') + ' is ' + tex('(\\rho^2)^k') + '.',
      },
      {
        prompt: 'From ' + tex('N=' + N) + ' draws of this AR(1) chain, find the effective sample size ' + tex('N\\,\\dfrac{1-r}{1+r}') + ' with ' + tex('r=\\rho^2') + '. Give it to 1 decimal place.',
        answer: ess, tolerance: { abs: 0.05 }, lecture: 10,
        explanation: tex(N + '\\times\\dfrac{1-' + dec(ar) + '}{1+' + dec(ar) + '}=' + dec(ess)) + '. Strong dependence means far fewer effective draws than ' + tex('N') + '.',
      },
      {
        prompt: 'Two chains of 4 draws each are ' + tex('(' + chains[0].join(',') + ')') + ' and ' + tex('(' + chains[1].join(',') + ')') + '. Compute ' + tex('\\hat R=\\sqrt{\\hat V/W}') + ' with ' + tex('W') + ' the mean within-chain variance (divisor ' + tex('n-1') + '), ' + tex('B=n\\times') + ' the variance of the chain means (divisor ' + tex('m-1') + '), and ' + tex('\\hat V=\\frac{n-1}{n}W+\\frac Bn') + '.',
        answer: rh, tolerance: tol4, lecture: 10,
        explanation: 'Both ' + tex('W') + ' and ' + tex('B') + ' come from the chains: ' + tex('\\hat V/W=' + dec(rh * rh)) + ', so ' + tex('\\hat R=' + dec(rh)) + '. Values near 1 indicate convergence.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'mc-lq-f-gibbs', generate: (rng) => build(sample(rng)) }
