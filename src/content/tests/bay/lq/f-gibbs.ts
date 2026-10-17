// LQ-F: Gibbs sampling a bivariate normal (full conditionals), effective sample size, Gelman-Rubin statistic and Monte Carlo standard error.
// Lecture 9 (MCMC II: Gibbs sampling, ESS, R-hat).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { rho: number; y: number; n: number; ac: number; W: number; Bn: number; m: number; sd: number } // Bn = between-chain variance of means (variance of chain means)

export function sample(rng: Rng): Params {
  return { rho: rng.pick([0.3, 0.5, 0.6, 0.8, 0.9]), y: rng.int(-20, 20) / 10, n: rng.pick([1000, 2000, 5000]), ac: rng.pick([0.2, 0.5, 0.7, 0.9]), W: rng.int(8, 20) / 10, Bn: rng.int(1, 30) / 100, m: rng.pick([4, 8]), sd: rng.pick([1, 1.5, 2]) }
}

export function build({ rho, y, n, ac, W, Bn, m, sd }: Params): LQInstance {
  const cm = rho * y, cv = 1 - rho * rho
  const ess = (n * (1 - ac)) / (1 + ac)
  // between-chain variance B = n * Var(chain means); R-hat = sqrt(((n-1)/n W + B/n) / W) = sqrt((n-1)/n + Bn/W)
  const B = n * Bn
  const rhat = Math.sqrt(((n - 1) / n * W + B / n) / W)
  const mcse = sd / Math.sqrt(ess)

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A Gibbs sampler targets a bivariate normal with zero means, unit variances and correlation ' + tex('\\rho=' + dec(rho)) + '. Given ' + tex('y=' + dec(y)) + ', the full conditional of ' + tex('x') + ' is normal with mean ' + tex('\\rho y') + '. Find that mean.',
        answer: cm, tolerance: tol4, lecture: 9,
        explanation: tex(dec(rho) + '\\cdot' + dec(y)) + ' = ' + dec(cm) + '.',
      },
      {
        prompt: 'Find the variance ' + tex('1-\\rho^2') + ' of that full conditional. (A large ' + tex('\\rho') + ' makes the conditional narrow and the Gibbs moves small.)',
        answer: cv, tolerance: tol4, lecture: 9,
        explanation: tex('1-' + dec(rho * rho)) + ' = ' + dec(cv) + '.',
      },
      {
        prompt: 'A chain of ' + tex(n) + ' draws behaves like an AR(1) process with autocorrelation ' + tex(dec(ac)) + '. Find its effective sample size ' + tex('n(1-\\rho)/(1+\\rho)') + ' (3 decimal places).',
        answer: ess, tolerance: tol3, lecture: 9,
        explanation: tex(n + '\\cdot' + dec(1 - ac) + '/' + dec(1 + ac)) + ' = ' + dec(ess) + '.',
      },
      {
        prompt: tex(m) + ' chains of ' + tex(n) + ' draws each have average within-chain variance ' + tex('W=' + dec(W)) + ' and the variance of the chain means is ' + tex(dec(Bn)) + ' (so the between-chain variance is ' + tex('B=n\\cdot' + dec(Bn)) + '). Find ' + tex('\\hat R=\\sqrt{\\{(n-1)W/n+B/n\\}/W}') + '.',
        answer: rhat, tolerance: tol4, lecture: 9,
        explanation: tex('\\sqrt{((n-1)/n\\cdot' + dec(W) + '+' + dec(Bn) + ')/' + dec(W) + '}') + ' = ' + dec(rhat) + (rhat > 1.01 ? ', above 1.01: the chains have not converged.' : ', close to 1: no sign of non-convergence.'),
      },
      {
        prompt: 'The posterior standard deviation of a parameter is ' + tex(dec(sd)) + '. Using the effective sample size from part (c), find the Monte Carlo standard error of the posterior mean, ' + tex('\\mathrm{sd}/\\sqrt{\\mathrm{ESS}}') + '.',
        answer: mcse, tolerance: tol4, lecture: 9,
        explanation: tex(dec(sd) + '/\\sqrt{' + dec(ess) + '}') + ' = ' + dec(mcse) + '; the naive value ' + tex(dec(sd) + '/\\sqrt{' + n + '}') + ' = ' + dec(sd / Math.sqrt(n)) + ' would be too small.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'bay-lq-f-gibbs', generate: (rng) => build(sample(rng)) }
