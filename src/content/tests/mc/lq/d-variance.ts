// LQ-D: variance reduction for E[exp(cU)]: antithetic pairs, a control variate, importance sampling weight and stratification.
// Lectures 5 (variance reduction I) and 6 (variance reduction II).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { c: number; t: number; x: number }

export function sample(rng: Rng): Params {
  const t = rng.int(20, 30) / 10
  return { c: rng.int(1, 3), t, x: t + rng.int(0, 15) / 10 }
}

/** Closed forms for g(U) = exp(cU), U ~ U(0,1). */
export function moments(c: number) {
  const m = (Math.exp(c) - 1) / c
  const m2 = (Math.exp(2 * c) - 1) / (2 * c)
  const v = m2 - m * m
  const cov = Math.exp(c) - m * m // Cov(g(U), g(1-U)) since g(U)g(1-U) = e^c
  const covU = (Math.exp(c) * (c - 1) + 1) / (c * c) - m / 2 // Cov(g(U), U)
  return { m, v, cov, covU }
}

export function build({ c, t, x }: Params): LQInstance {
  const { m, v, cov, covU } = moments(c)
  const factor = (v + cov) / v
  const beta = covU / (1 / 12)
  const resid = 1 - (covU * covU) / (v * (1 / 12))
  const w = Math.exp(-t * x + (t * t) / 2)
  // stratification into [0,1/2) and [1/2,1] with equal allocation: variance within each stratum
  const half = (lo: number, hi: number) => {
    const e1 = (Math.exp(c * hi) - Math.exp(c * lo)) / c / (hi - lo)
    const e2 = (Math.exp(2 * c * hi) - Math.exp(2 * c * lo)) / (2 * c) / (hi - lo)
    return e2 - e1 * e1
  }
  const vlo = half(0, 0.5), vhi = half(0.5, 1)
  const strat = (0.5 * vlo + 0.5 * vhi) / v

  return {
    intro: 'Let ' + tex('g(U)=e^{' + c + 'U}') + ' with ' + tex('U\\sim U(0,1)') + '. The plain Monte Carlo variance per sample is ' + tex('\\sigma^2=\\mathrm{Var}\\,g(U)=' + dec(v)) + ' and ' + tex('E\\,g(U)=' + dec(m)) + '. Give answers to 3 decimal places except the importance weight (4 decimal places).',
    parts: [
      {
        prompt: 'Antithetic variates pair ' + tex('g(U)') + ' with ' + tex('g(1-U)') + ', and here ' + tex('\\mathrm{Cov}(g(U),g(1-U))=e^{' + c + '}-(E\\,g)^2') + '. Find the ratio ' + tex('\\mathrm{Var}(\\text{antithetic pair mean})/\\mathrm{Var}(\\text{mean of two independent draws})=1+\\rho') + '.',
        answer: factor, tolerance: tol3, lecture: 5,
        explanation: tex('\\mathrm{Cov}=' + dec(cov) + ',\\ \\rho=' + dec(cov / v) + ',\\ 1+\\rho=' + dec(factor)) + '. A value below 1 means variance is reduced.',
      },
      {
        prompt: 'Use ' + tex('U') + ' itself as a control variate (' + tex('E\\,U=\\tfrac12,\\ \\mathrm{Var}\\,U=\\tfrac1{12}') + '), where ' + tex('\\mathrm{Cov}(g(U),U)=\\dfrac{e^{' + c + '}(' + c + '-1)+1}{' + c * c + '}-\\dfrac{E\\,g}{2}') + '. Find the optimal coefficient ' + tex('\\beta^*=\\mathrm{Cov}(g,U)/\\mathrm{Var}(U)') + '.',
        answer: beta, tolerance: tol3, lecture: 5,
        explanation: tex('\\mathrm{Cov}=' + dec(covU) + ',\\ \\beta^*=12\\times' + dec(covU) + '=' + dec(beta)) + '.',
      },
      {
        prompt: 'With that optimal coefficient, find the fraction of the original variance that remains, ' + tex('1-\\rho_{g,U}^2') + '.',
        answer: resid, tolerance: tol3, lecture: 5,
        explanation: tex('\\rho^2=\\dfrac{\\mathrm{Cov}^2}{\\sigma^2\\cdot\\frac1{12}}=' + dec(1 - resid) + ',\\ 1-\\rho^2=' + dec(resid)) + '.',
      },
      {
        prompt: 'To estimate ' + tex('P(Z>' + dec(t) + ')') + ' for ' + tex('Z\\sim N(0,1)') + ', sample from ' + tex('N(' + dec(t) + ',1)') + ' instead. For the draw ' + tex('x=' + dec(x)) + ' find the importance weight ' + tex('w(x)=\\varphi(x)/\\varphi(x-' + dec(t) + ')') + '.',
        answer: w, tolerance: tol4, lecture: 6,
        explanation: tex('w=\\exp(-tx+t^2/2)=\\exp(-' + dec(t) + '\\times' + dec(x) + '+' + dec(t * t / 2) + ')=' + dec(w)) + '.',
      },
      {
        prompt: 'Stratify ' + tex('U') + ' into ' + tex('[0,\\tfrac12)') + ' and ' + tex('[\\tfrac12,1]') + ' with equal sample sizes. The within-stratum variances of ' + tex('g') + ' are ' + tex(dec(vlo)) + ' and ' + tex(dec(vhi)) + '. Find the ratio of the stratified estimator\'s variance to the plain one, ' + tex('\\frac12(\\sigma_1^2+\\sigma_2^2)/\\sigma^2') + '.',
        answer: strat, tolerance: tol3, lecture: 6,
        explanation: tex('\\frac12(' + dec(vlo) + '+' + dec(vhi) + ')/' + dec(v) + '=' + dec(strat)) + '. Stratification removes the between-strata part of the variance.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'mc-lq-d-variance', generate: (rng) => build(sample(rng)) }
