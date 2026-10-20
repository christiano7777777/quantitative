// bay lecture 7 (MCMC in practice: Gibbs, diagnostics, HMC): one story. A Gibbs sampler for a standard bivariate normal with correlation rho:
// the full conditional's mean and variance, the lag-1 autocorrelation of the chain, the effective sample size, the Gelman-Rubin statistic from two chains, and one HMC half step.
// Lecture 7.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { rho: number; y: number; m: [number, number]; s2: [number, number]; q: number; p: number; eps: number }

export function sample(rng: Rng): Params {
  return {
    rho: rng.pick([0.5, 0.6, 0.8]), y: rng.pick([1, 1.5, 2, -1]),
    // chain means at least 0.2 apart, so that B/(nW) > 1/n and R-hat exceeds 1
    m: [rng.pick([-0.3, -0.2, 0, 0.1]), rng.pick([0.3, 0.4, 0.5])], s2: [rng.pick([0.9, 1, 1.1]), rng.pick([0.95, 1.05, 1.2])],
    q: rng.pick([1, 1.5, 2]), p: rng.pick([0.5, 1, 1.2]), eps: rng.pick([0.2, 0.4]),
  }
}

export function build({ rho, y, m, s2, q, p, eps }: Params): LQInstance {
  const cm = rho * y
  const cv = 1 - rho * rho
  const phi = rho * rho
  const N = 1000
  const ess = (N * (1 - phi)) / (1 + phi)
  const n = 100
  const W = (s2[0] + s2[1]) / 2
  const B = (n * (m[0] - m[1]) ** 2) / 2
  const varPlus = ((n - 1) / n) * W + B / n
  const rhat = Math.sqrt(varPlus / W)
  const pHalf = p - (eps / 2) * q

  return {
    intro: 'We sample from a bivariate normal distribution with standard normal margins and correlation ' + tex('\\rho=' + dec(rho)) + ' by Gibbs sampling: alternately draw ' + tex('X\\mid Y=y\\sim N(\\rho y,\\ 1-\\rho^2)') + ' and ' + tex('Y\\mid X=x\\sim N(\\rho x,\\ 1-\\rho^2)') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The current value is ' + tex('y=' + dec(y)) + '. Find the mean of the full conditional ' + tex('X\\mid Y=y') + '.',
        answer: cm, tolerance: tol4, lecture: 7,
        explanation: tex('\\rho y=' + dec(rho) + '\\times' + dec(y)) + ' = ' + dec(cm) + '.',
      },
      {
        prompt: 'Find the variance of that conditional, ' + tex('1-\\rho^2') + '.',
        answer: cv, tolerance: tol4, lecture: 7,
        explanation: tex('1-' + dec(rho) + '^2') + ' = ' + dec(cv) + '.',
      },
      {
        prompt: 'The sequence of ' + tex('X') + ' values from the Gibbs sampler is an AR(1) chain whose lag-1 autocorrelation is ' + tex('\\rho^2') + '. Find it.',
        answer: phi, tolerance: tol4, lecture: 7,
        explanation: tex(dec(rho) + '^2') + ' = ' + dec(phi) + '. The stronger the dependence between the variables, the more slowly the chain moves.',
      },
      {
        prompt: 'For an AR(1) chain with autocorrelation ' + tex('\\phi') + ' the effective sample size of ' + tex('N=1000') + ' draws is ' + tex('N(1-\\phi)/(1+\\phi)') + '. Find it with ' + tex('\\phi=\\rho^2') + '.',
        answer: ess, tolerance: tol4, lecture: 7,
        explanation: tex('1000\\times(1-' + dec(phi) + ')/(1+' + dec(phi) + ')') + ' = ' + dec(ess) + ' effectively independent draws.',
      },
      {
        prompt: 'Two chains of ' + tex(n) + ' draws each give means ' + tex(dec(m[0])) + ' and ' + tex(dec(m[1])) + ' and variances ' + tex(dec(s2[0])) + ' and ' + tex(dec(s2[1])) + '. The within-chain variance is ' + tex('W=\\bar s^2') + ', the between-chain variance is ' + tex('B=n\\,\\mathrm{Var}(\\text{means})') + ' (divisor ' + tex(1) + '), and the Gelman-Rubin statistic is ' + tex('\\hat R=\\sqrt{\\{(n-1)W/n+B/n\\}/W}') + '. Find ' + tex('\\hat R') + '.',
        answer: rhat, tolerance: tol4, lecture: 7,
        explanation: tex('W=' + dec(W) + ',\\ B=' + n + '\\times(' + dec(m[0]) + '-' + dec(m[1]) + ')^2/2=' + dec(B)) + ', so ' + tex('\\hat R=\\sqrt{' + dec(varPlus) + '/' + dec(W) + '}') + ' = ' + dec(rhat) + '. Values near ' + tex(1) + ' indicate the chains agree.',
      },
      {
        prompt: 'Hamiltonian Monte Carlo targets ' + tex('N(0,1)') + ' with potential energy ' + tex('U(q)=q^2/2') + ' (so ' + tex('U\'(q)=q') + '). The leapfrog method starts with a half step for the momentum, ' + tex('p\\leftarrow p-\\tfrac\\varepsilon2U\'(q)') + '. With ' + tex('q=' + dec(q)) + ', ' + tex('p=' + dec(p)) + ' and step size ' + tex('\\varepsilon=' + dec(eps)) + ', find the new momentum.',
        answer: pHalf, tolerance: tol4, lecture: 7,
        explanation: tex(dec(p) + '-' + dec(eps / 2) + '\\times' + dec(q)) + ' = ' + dec(pHalf) + '. A full step then moves ' + tex('q') + ' by ' + tex('\\varepsilon p') + ' and a second half step updates the momentum again.',
      },
    ],
  }
}

export const genLec7: LQGenerator = { id: 'bay-lq-lec7', generate: (rng) => build(sample(rng)) }
