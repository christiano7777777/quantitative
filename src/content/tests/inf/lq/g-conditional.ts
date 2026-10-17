// LQ-G: conditional tests: comparing two Poisson rates by conditioning on the total (binomial with p = 1/2 under H0), the two-sided UMPU p-value, Fisher's exact test, and conditional probabilities under an alternative.
// Lectures 9 (UMP unbiased and conditional tests) and 8 (one-sided tests).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { m: number; x: number; rho: number; r1: number; r2: number; a: number; b: number }

export function sample(rng: Rng): Params {
  const m = rng.int(10, 14)
  const x = rng.int(Math.floor(m / 2) + 2, m - 1)
  const r1 = rng.int(4, 8), r2 = rng.int(4, 8)
  return { m, x, rho: rng.pick([2, 3]), r1, r2, a: rng.int(Math.ceil(r1 / 2) + 1, r1), b: rng.int(0, Math.floor(r2 / 2)) }
}

export const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }

export function build({ m, x, rho, r1, r2, a, b }: Params): LQInstance {
  const pt = choose(m, x) / 2 ** m
  let upper = 0
  for (let k = x; k <= m; k++) upper += choose(m, k) / 2 ** m
  const two = 2 * upper
  const c1 = a + b
  let fisher = 0
  for (let k = a; k <= Math.min(r1, c1); k++) fisher += (choose(r1, k) * choose(r2, c1 - k)) / choose(r1 + r2, c1)
  const q = rho / (1 + rho)
  const alt = choose(m, x) * q ** x * (1 - q) ** (m - x)

  return {
    intro: 'Two independent Poisson counts ' + tex('X\\sim\\mathrm{Poisson}(\\lambda_1)') + ' and ' + tex('Y\\sim\\mathrm{Poisson}(\\lambda_2)') + ' are observed with ' + tex('X=' + x) + ' and ' + tex('Y=' + (m - x)) + ', total ' + tex('m=' + m) + '. To test ' + tex('H_0:\\lambda_1=\\lambda_2') + ' condition on the sufficient statistic ' + tex('X+Y') + ' for the nuisance parameter: given ' + tex('X+Y=m') + ', ' + tex('X\\sim\\mathrm{Bin}(m,\\lambda_1/(\\lambda_1+\\lambda_2))') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Under ' + tex('H_0') + ', find the conditional probability ' + tex('P(X=' + x + '\\mid X+Y=' + m + ')') + '.',
        answer: pt, tolerance: tol4, lecture: 9,
        explanation: 'Under ' + tex('H_0') + ' the conditional law is ' + tex('\\mathrm{Bin}(' + m + ',\\tfrac12)') + ', free of the common rate: ' + tex('\\binom{' + m + '}{' + x + '}/2^{' + m + '}=' + choose(m, x) + '/' + 2 ** m + '=' + dec(pt)) + '.',
      },
      {
        prompt: 'Find the one-sided conditional p-value ' + tex('P(X\\ge' + x + '\\mid X+Y=' + m + ')') + ' for ' + tex('H_1:\\lambda_1>\\lambda_2') + '.',
        answer: upper, tolerance: tol4, lecture: 8,
        explanation: 'Sum ' + tex('\\binom{' + m + '}{k}/2^{' + m + '}') + ' for ' + tex('k=' + x + ',\\dots,' + m) + ': ' + dec(upper) + '. The conditional test is UMP among conditional level-' + tex('\\alpha') + ' tests for the one-sided alternative.',
      },
      {
        prompt: 'The UMP unbiased test of ' + tex('H_0') + ' against ' + tex('\\lambda_1\\ne\\lambda_2') + ' has a two-sided p-value. Because ' + tex('\\mathrm{Bin}(m,\\frac12)') + ' is symmetric, it is ' + tex('P(X\\ge' + x + ')+P(X\\le' + (m - x) + ')') + '. Find it.',
        answer: two, tolerance: tol4, lecture: 9,
        explanation: 'By symmetry the two tails are equal: ' + tex('2\\cdot' + dec(upper) + '=' + dec(two)) + '. For an asymmetric null law the two tails would be chosen to satisfy the unbiasedness condition instead.',
      },
      {
        prompt: 'In a ' + tex('2\\times2') + ' table, group 1 has ' + tex(a) + ' successes out of ' + tex(r1) + ' and group 2 has ' + tex(b) + ' successes out of ' + tex(r2) + '. With all margins fixed and independence, the count in the top-left cell is hypergeometric. Find the one-sided Fisher exact p-value ' + tex('P(A\\ge' + a + ')') + '.',
        answer: fisher, tolerance: tol4, lecture: 9,
        explanation: tex('\\sum_{k\\ge' + a + '}\\binom{' + r1 + '}{k}\\binom{' + r2 + '}{' + c1 + '-k}\\Big/\\binom{' + (r1 + r2) + '}{' + c1 + '}=' + dec(fisher)) + ' with ' + tex(c1) + ' successes in total.',
      },
      {
        prompt: 'Now suppose ' + tex('\\lambda_1/\\lambda_2=' + rho) + '. Find the conditional probability ' + tex('P(X=' + x + '\\mid X+Y=' + m + ')') + ' under this alternative.',
        answer: alt, tolerance: tol4, lecture: 9,
        explanation: 'Given the total, ' + tex('X\\sim\\mathrm{Bin}(' + m + ',' + rho + '/' + (1 + rho) + ')') + ': ' + tex('\\binom{' + m + '}{' + x + '}(' + dec(q) + ')^{' + x + '}(' + dec(1 - q) + ')^{' + (m - x) + '}=' + dec(alt)) + '. The alternative shifts the conditional law towards larger ' + tex('X') + ', which is what the test exploits.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'inf-lq-g-conditional', generate: (rng) => build(sample(rng)) }
