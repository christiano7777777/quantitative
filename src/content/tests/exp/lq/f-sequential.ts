// LQ-F: monitoring an experiment: an O'Brien-Fleming boundary, the z statistic at an interim look, an always-valid
// mixture likelihood ratio, then CUPED (coefficient and the saving in sample size).
// Lectures 9 (adjusted boundaries, always-valid inference) and 10 (CUPED).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol3, tolInt } from '../../../shared/format'

/** O'Brien-Fleming constants C_K for K equally spaced looks, two-sided overall 5% (boundary at look k is C_K sqrt(K/k)). */
export const OBF: Record<number, number> = { 3: 2.004, 4: 2.024, 5: 2.041 }

export interface Params {
  K: number; k: number; nLook: number; sigma: number; dz: number // boundary, interim look
  sd: number; tau: number; nObs: number; xbar: number // mixture likelihood ratio
  sy: number; sx: number; rho10: number; nBase: number // CUPED
}

export function sample(rng: Rng): Params {
  const K = rng.pick([3, 4, 5])
  const k = rng.int(2, K)
  const nLook = rng.pick([500, 1000, 1500, 2000])
  const sigma = rng.pick([10, 12, 15, 20])
  const nk = k * nLook
  const z0 = rng.int(18, 36) / 10
  const dz = Math.round(z0 * sigma * Math.sqrt(2 / nk) * 100) / 100
  const sd = rng.pick([2, 3, 4, 5])
  const tau = rng.pick([0.5, 1, 2])
  const nObs = rng.pick([100, 200, 400, 900])
  const xbar = Math.round(((rng.int(28, 38) / 10) * sd) / Math.sqrt(nObs) * 100) / 100
  return { K, k, nLook, sigma, dz, sd, tau, nObs, xbar, sy: rng.pick([10, 15, 20, 30]), sx: rng.pick([8, 10, 12, 25]), rho10: rng.int(3, 8), nBase: rng.int(20, 120) * 100 }
}

export function build({ K, k, nLook, sigma, dz, sd, tau, nObs, xbar, sy, sx, rho10, nBase }: Params): LQInstance {
  const C = OBF[K]
  const bound = C * Math.sqrt(K / k)
  const nk = k * nLook
  const z = dz / (sigma * Math.sqrt(2 / nk))
  const s2 = sd * sd, t2 = tau * tau
  const lam = Math.sqrt(s2 / (s2 + nObs * t2)) * Math.exp((nObs * nObs * t2 * xbar * xbar) / (2 * s2 * (s2 + nObs * t2)))
  const rho = rho10 / 10
  const theta = (rho * sy) / sx
  const nAdj = (nBase * (100 - rho10 * rho10)) / 100

  return {
    intro:
      'An experiment is monitored with ' + tex(K) + ' equally spaced looks at two-sided overall level 5%. The O\'Brien-Fleming boundary at look ' + tex('j') + ' is ' + tex('C_K\\sqrt{K/j}') + ' with ' + tex('C_' + K + '=' + dec(C)) + '. Give answers to 3 decimal places unless told otherwise; do not round intermediate values.',
    parts: [
      {
        prompt: 'Find the critical value for the test statistic at look ' + tex(k) + ' of ' + tex(K) + '.',
        answer: bound, tolerance: tol3, lecture: 9,
        explanation: tex(dec(C) + '\\sqrt{' + K + '/' + k + '}=' + dec(bound)) + '. Early looks need overwhelming evidence; the last look is close to 1.96.',
      },
      {
        prompt: 'At look ' + tex(k) + ' there are ' + tex(nk) + ' users per arm, the metric has known standard deviation ' + tex(sigma) + ' per user, and the observed difference in means is ' + tex(dec(dz)) + '. Find the ' + tex('z') + ' statistic ' + tex('\\dfrac{\\bar y_T-\\bar y_C}{\\sigma\\sqrt{2/n}}') + ' (2 decimal places).',
        answer: z, tolerance: tol2, lecture: 9,
        explanation: tex('\\sigma\\sqrt{2/n}=' + dec(sigma * Math.sqrt(2 / nk)) + ',\\ z=' + dec(dz) + '/' + dec(sigma * Math.sqrt(2 / nk)) + '=' + dec(z)) + '. Compare it with the boundary of the previous part, not with 1.96.',
      },
      {
        prompt: 'An always-valid test of the mean difference of paired observations (known standard deviation ' + tex('\\sigma=' + sd) + ') uses a normal mixture prior ' + tex('N(0,\\tau^2)') + ' with ' + tex('\\tau=' + dec(tau)) + '. After ' + tex('n=' + nObs) + ' observations with mean ' + tex('\\bar x=' + dec(xbar)) + ', the mixture likelihood ratio is ' + tex('\\Lambda_n=\\sqrt{\\dfrac{\\sigma^2}{\\sigma^2+n\\tau^2}}\\exp\\!\\left(\\dfrac{n^2\\tau^2\\bar x^2}{2\\sigma^2(\\sigma^2+n\\tau^2)}\\right)') + '. Find it (answers within 1% are accepted). The test rejects at level 5% once ' + tex('\\Lambda_n\\ge 20') + '.',
        answer: lam, tolerance: { rel: 0.01 }, lecture: 9,
        explanation: tex('\\sqrt{' + s2 + '/' + (s2 + nObs * t2) + '}=' + dec(Math.sqrt(s2 / (s2 + nObs * t2))) + ',\\ \\exp(' + dec((nObs * nObs * t2 * xbar * xbar) / (2 * s2 * (s2 + nObs * t2))) + '),\\ \\Lambda_n=' + dec(lam)) + '. The always-valid p-value is ' + tex('\\min(1,1/\\Lambda_n)') + ', valid at any stopping time.',
      },
      {
        prompt: 'For CUPED, the outcome ' + tex('Y') + ' (standard deviation ' + tex(sy) + ') is adjusted with a pre-experiment covariate ' + tex('X') + ' (standard deviation ' + tex(sx) + ') whose correlation with ' + tex('Y') + ' is ' + tex('\\rho=' + dec(rho)) + '. Find the optimal coefficient ' + tex('\\theta=\\mathrm{Cov}(Y,X)/\\mathrm{Var}(X)') + '.',
        answer: theta, tolerance: tol3, lecture: 10,
        explanation: tex('\\theta=\\rho\\sigma_Y/\\sigma_X=' + dec(rho) + '\\times' + sy + '/' + sx + '=' + dec(theta)) + '.',
      },
      {
        prompt: 'Without adjustment the experiment needs ' + tex(nBase) + ' users per arm. CUPED multiplies the variance of the metric by ' + tex('1-\\rho^2') + '. How many users per arm does the adjusted analysis need for the same power (whole number)?',
        answer: nAdj, tolerance: tolInt, lecture: 10,
        explanation: tex(nBase + '\\times(1-' + dec(rho * rho) + ')=' + nAdj) + '. The sample size is proportional to the variance.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'exp-lq-f-sequential', generate: (rng) => build(sample(rng)) }
