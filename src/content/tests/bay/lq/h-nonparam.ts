// LQ-H: Dirichlet process and Chinese restaurant probabilities, expected stick weights, and a Gaussian process posterior mean and variance.
// Lecture 12 (nonparametric Bayes).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { alpha: number; sizes: number[]; j: number; ell: number; sf: number; sn: number; yobs: number; d: number }

export function sample(rng: Rng): Params {
  return { alpha: rng.pick([0.5, 1, 2, 3]), sizes: [rng.int(2, 6), rng.int(1, 5), rng.int(1, 4)], j: rng.int(2, 4), ell: rng.pick([0.5, 1, 2]), sf: rng.pick([1, 2]), sn: rng.pick([0.1, 0.5, 1]), yobs: rng.int(-20, 20) / 10, d: rng.int(1, 20) / 10 }
}

export function build({ alpha, sizes, j, ell, sf, sn, yobs, d }: Params): LQInstance {
  const n = sizes.reduce((a, b) => a + b, 0)
  const pNew = alpha / (n + alpha)
  const pJoin = sizes[0] / (n + alpha)
  let tables = 0
  for (let i = 1; i <= n; i++) tables += alpha / (alpha + i - 1)
  const stick = (alpha / (1 + alpha)) ** (j - 1) / (1 + alpha)
  const kxx = sf * sf, kxs = sf * sf * Math.exp(-(d * d) / (2 * ell * ell))
  const mean = (kxs / (kxx + sn * sn)) * yobs
  const varp = kxx - (kxs * kxs) / (kxx + sn * sn)

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'In a Chinese restaurant process with concentration ' + tex('\\alpha=' + dec(alpha)) + ', ' + tex(n) + ' customers have been seated at three tables of sizes ' + tex(sizes.join(',')) + '. Find the probability that the next customer starts a new table, ' + tex('\\alpha/(n+\\alpha)') + '.',
        answer: pNew, tolerance: tol4, lecture: 15,
        explanation: tex(dec(alpha) + '/(' + n + '+' + dec(alpha) + ')') + ' = ' + dec(pNew) + '.',
      },
      {
        prompt: 'Find the probability that the next customer joins the first table (size ' + tex(sizes[0]) + '), ' + tex('n_1/(n+\\alpha)') + '.',
        answer: pJoin, tolerance: tol4, lecture: 15,
        explanation: tex(sizes[0] + '/(' + n + '+' + dec(alpha) + ')') + ' = ' + dec(pJoin) + '. Larger tables attract new customers (rich get richer).',
      },
      {
        prompt: 'The expected number of occupied tables after ' + tex(n) + ' customers is ' + tex('\\sum_{i=1}^n\\alpha/(\\alpha+i-1)') + '. Find it.',
        answer: tables, tolerance: tol4, lecture: 15,
        explanation: 'Customer ' + tex('i') + ' opens a new table with probability ' + tex('\\alpha/(\\alpha+i-1)') + '; summing gives ' + dec(tables) + '.',
      },
      {
        prompt: 'In the stick-breaking construction the stick fractions are ' + tex('\\beta_k\\sim\\mathrm{Beta}(1,' + dec(alpha) + ')') + ', so ' + tex('E[\\beta_k]=1/(1+\\alpha)') + '. Find the expected weight of atom ' + tex(j) + ', ' + tex('E[w_j]=\\big(\\tfrac{\\alpha}{1+\\alpha}\\big)^{j-1}\\tfrac1{1+\\alpha}') + '.',
        answer: stick, tolerance: tol4, lecture: 15,
        explanation: tex('(' + dec(alpha / (1 + alpha)) + ')^{' + (j - 1) + '}\\cdot' + dec(1 / (1 + alpha))) + ' = ' + dec(stick) + '.',
      },
      {
        prompt: 'A Gaussian process has kernel ' + tex('k(x,x\')=' + dec(sf * sf) + '\\exp\\{-(x-x\')^2/(2\\cdot' + dec(ell * ell) + ')\\}') + '. One observation ' + tex('y=' + dec(yobs)) + ' with noise variance ' + tex(dec(sn * sn)) + ' is made at ' + tex('x=0') + '. Find the posterior mean of ' + tex('f') + ' at ' + tex('x_*=' + dec(d)) + ': ' + tex('k(x_*,0)\\,y/(k(0,0)+\\sigma_n^2)') + '.',
        answer: mean, tolerance: tol4, lecture: 15,
        explanation: tex('k(x_*,0)=' + dec(kxs) + ',\\ k(0,0)+\\sigma_n^2=' + dec(kxx + sn * sn)) + ', so the mean is ' + tex(dec(kxs) + '\\cdot' + dec(yobs) + '/' + dec(kxx + sn * sn)) + ' = ' + dec(mean) + '; the posterior variance is ' + dec(varp) + ', below the prior variance ' + dec(kxx) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'bay-lq-h-nonparam', generate: (rng) => build(sample(rng)) }
