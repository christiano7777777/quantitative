// LQ-S: the natural statistic of two Poisson samples and conditioning on the total to remove the nuisance parameter.
// Lecture 9 (distributional properties of the natural statistic).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { m: number; n: number; lam: number; mu: number; t: number; k: number }

export function sample(rng: Rng): Params {
  const m = rng.int(2, 5), n = rng.int(2, 5)
  const t = rng.int(5, 9)
  return { m, n, lam: rng.pick([1, 1.5, 2, 3]), mu: rng.pick([0.5, 1, 1.5, 2]), t, k: rng.int(Math.ceil(t / 2), t - 1) }
}

function choose(t: number, j: number): number {
  let c = 1
  for (let i = 1; i <= j; i++) c = (c * (t - j + i)) / i
  return c
}

export function build({ m, n, lam, mu, t, k }: Params): LQInstance {
  const eta1 = Math.log(lam / mu)
  const pAlt = (m * lam) / (m * lam + n * mu)
  const p0 = m / (m + n)
  const pmf = (j: number, p: number) => choose(t, j) * p ** j * (1 - p) ** (t - j)
  let tail = 0
  for (let j = k; j <= t; j++) tail += pmf(j, p0)

  return {
    intro: 'Independent samples ' + tex('X_1,\\dots,X_{' + m + '}') + ' i.i.d. Poisson(' + tex('\\lambda') + ') and ' + tex('Y_1,\\dots,Y_{' + n + '}') + ' i.i.d. Poisson(' + tex('\\mu') + ') have joint probability function proportional to ' + tex('\\exp\\{\\eta_1\\sum X_i+\\eta_2(\\sum X_i+\\sum Y_j)\\}') + ' with ' + tex('\\eta_1=\\ln(\\lambda/\\mu)') + ' and ' + tex('\\eta_2=\\ln\\mu') + '. We want to test ' + tex('H_0:\\lambda=\\mu') + ' against ' + tex('H_1:\\lambda>\\mu') + ', so ' + tex('\\eta_2') + ' is a nuisance parameter. Conditional on ' + tex('\\sum X_i+\\sum Y_j=t') + ', the statistic ' + tex('S=\\sum X_i') + ' has a distribution that depends on ' + tex('\\eta_1') + ' only. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the natural parameter ' + tex('\\eta_1=\\ln(\\lambda/\\mu)') + ' when ' + tex('\\lambda=' + dec(lam) + ',\\ \\mu=' + dec(mu)) + '.',
        answer: eta1, tolerance: tol4, lecture: 9,
        explanation: tex('\\ln(' + dec(lam) + '/' + dec(mu) + ')=' + dec(eta1)) + '. The hypothesis ' + tex('H_0:\\lambda=\\mu') + ' is ' + tex('\\eta_1=0') + ', which does not involve the nuisance parameter ' + tex('\\eta_2') + '.',
      },
      {
        prompt: 'Given the total ' + tex('t') + ', ' + tex('S\\sim\\mathrm{Bin}(t,\\ m\\lambda/(m\\lambda+n\\mu))') + '. Find this success probability for ' + tex('m=' + m + ',\\ n=' + n) + ', ' + tex('\\lambda=' + dec(lam) + ',\\ \\mu=' + dec(mu)) + '.',
        answer: pAlt, tolerance: tol4, lecture: 9,
        explanation: tex('\\dfrac{' + m + '\\times' + dec(lam) + '}{' + m + '\\times' + dec(lam) + '+' + n + '\\times' + dec(mu) + '}') + ' = ' + dec(pAlt) + '.',
      },
      {
        prompt: 'Under ' + tex('H_0') + ' the success probability is ' + tex('m/(m+n)') + '. With total ' + tex('t=' + t) + ' find the conditional probability ' + tex('P(S=' + k + '\\mid t)') + '.',
        answer: pmf(k, p0), tolerance: tol4, lecture: 9,
        explanation: tex('\\binom{' + t + '}{' + k + '}(' + m + '/' + (m + n) + ')^{' + k + '}(' + n + '/' + (m + n) + ')^{' + (t - k) + '}') + ' = ' + dec(pmf(k, p0)) + '.',
      },
      {
        prompt: 'Find the one-sided conditional p-value ' + tex('P(S\\ge' + k + '\\mid t=' + t + ')') + ' under ' + tex('H_0') + '.',
        answer: tail, tolerance: tol4, lecture: 9,
        explanation: 'Add ' + tex('\\binom{' + t + '}{j}(' + m + '/' + (m + n) + ')^j(' + n + '/' + (m + n) + ')^{' + t + '-j}') + ' for ' + tex('j=' + k + ',\\dots,' + t) + ': ' + dec(tail) + '. The null distribution is completely known, so no nuisance parameter is left.',
      },
      {
        prompt: 'Under the alternative with the values of ' + tex('\\lambda,\\mu') + ' above, find the conditional mean ' + tex('E(S\\mid t=' + t + ')=t\\,m\\lambda/(m\\lambda+n\\mu)') + '.',
        answer: t * pAlt, tolerance: tol4, lecture: 9,
        explanation: tex(t + '\\times' + dec(pAlt)) + ' = ' + dec(t * pAlt) + ', compared with ' + dec(t * p0) + ' under ' + tex('H_0') + '.',
      },
    ],
  }
}

export const genS: LQGenerator = { id: 'inf-lq-s-natural', generate: (rng) => build(sample(rng)) }
