// LQ-B: Poisson regression with an exposure offset: variance, rate ratio, deviance contribution, dispersion, negative binomial variance.
// Lectures 1 (variance function), 3 (deviance), 4 (Poisson and count models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  b0: number; b1: number; t: number; x: number; y: number; dx: number; k: number
  obs: { y: number; mu: number }[] // five fitted counts for the dispersion estimate
}

export function sample(rng: Rng): Params {
  return {
    b0: rng.pick([0.5, 1, 1.5]), b1: rng.pick([0.1, 0.2, 0.3]), t: rng.pick([1, 2, 3]), x: rng.int(1, 4), y: rng.int(2, 25),
    dx: rng.pick([2, 3, 5]), k: rng.pick([1, 2, 4]),
    obs: Array.from({ length: 5 }, () => { const mu = rng.int(20, 120) / 10; return { mu, y: Math.max(0, Math.round(mu + rng.int(-5, 5))) } }),
  }
}

export function build(p: Params): LQInstance {
  const mu = p.t * Math.exp(p.b0 + p.b1 * p.x)
  const rr = Math.exp(p.dx * p.b1)
  const dev = 2 * (p.y * Math.log(p.y / mu) - (p.y - mu))
  const phi = p.obs.reduce((s, o) => s + (o.y - o.mu) ** 2 / o.mu, 0) / (p.obs.length - 2)
  const nb = mu + (mu * mu) / p.k

  return {
    intro:
      'Counts ' + tex('Y') + ' are modelled by Poisson regression with exposure ' + tex('t') + ': ' + tex('\\log E[Y]=\\log t+' + dec(p.b0) + '+' + dec(p.b1) + 'x') +
      '. Consider a unit with exposure ' + tex('t=' + p.t) + ' and ' + tex('x=' + p.x) + '. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The Poisson variance function is ' + tex('V(\\mu)=\\mu') + '. Find ' + tex('\\operatorname{Var}(Y)') + ' for this unit under the fitted model.',
        answer: mu, tolerance: tol3, lecture: 1,
        explanation: tex('\\mu=t\\,e^{' + dec(p.b0) + '+' + dec(p.b1) + '\\cdot' + p.x + '}=' + p.t + 'e^{' + dec(p.b0 + p.b1 * p.x) + '}') + ' = ' + dec(mu) + ', and for the Poisson the variance equals the mean.',
      },
      {
        prompt: 'By what factor is the expected count multiplied (the rate ratio) when ' + tex('x') + ' increases by ' + tex(p.dx) + ' units? Give 4 decimal places.',
        answer: rr, tolerance: tol4, lecture: 4,
        explanation: tex('e^{' + p.dx + '\\beta_1}=e^{' + dec(p.dx * p.b1) + '}') + ' = ' + dec(rr) + '.',
      },
      {
        prompt: 'The observed count for this unit is ' + tex('y=' + p.y) + '. Find its Poisson deviance contribution ' + tex('2\\{y\\ln(y/\\mu)-(y-\\mu)\\}') + '.',
        answer: dev, tolerance: tol3, lecture: 3,
        explanation: tex('2\\{' + p.y + '\\ln(' + p.y + '/' + dec(mu) + ')-(' + p.y + '-' + dec(mu) + ')\\}') + ' = ' + dec(dev) + '.',
      },
      {
        prompt: 'For five other units the observed and fitted counts ' + tex('(y_i,\\hat\\mu_i)') + ' are ' + p.obs.map((o) => tex('(' + o.y + ',' + dec(o.mu) + ')')).join(', ') +
          '. The model has 2 parameters. Find the dispersion estimate ' + tex('\\hat\\phi=\\dfrac{1}{n-2}\\sum_i\\dfrac{(y_i-\\hat\\mu_i)^2}{\\hat\\mu_i}') + '.',
        answer: phi, tolerance: tol3, lecture: 4,
        explanation: 'Sum the Pearson terms ' + tex('(y_i-\\hat\\mu_i)^2/\\hat\\mu_i') + ' and divide by ' + tex('5-2=3') + ': ' + dec(phi) + '. A value above 1 suggests overdispersion.',
      },
      {
        prompt: 'Suppose instead the counts follow a negative binomial model with the same mean and ' + tex('\\operatorname{Var}(Y)=\\mu+\\mu^2/k') + ', ' + tex('k=' + p.k) + '. Find the variance of ' + tex('Y') + ' for this unit.',
        answer: nb, tolerance: tol3, lecture: 4,
        explanation: tex('\\mu+\\mu^2/k=' + dec(mu) + '+' + dec(mu) + '^2/' + p.k) + ' = ' + dec(nb) + ', larger than the Poisson variance ' + dec(mu) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'reg2-lq-b-poisson', generate: (rng) => build(sample(rng)) }
