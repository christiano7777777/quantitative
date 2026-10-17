// LQ-C: model comparison for binomial data (marginal likelihoods, Bayes factor, posterior model probability) and a WAIC calculation.
// Lecture 5 (model evaluation and selection).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { n: number; k: number; L: number[][] } // L: 3 observations x 4 posterior draws, likelihood values in hundredths

export function sample(rng: Rng): Params {
  const n = rng.pick([10, 12, 16, 20])
  return { n, k: rng.int(Math.floor(n * 0.3), Math.ceil(n * 0.8)), L: Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => rng.int(8, 90))) }
}

export const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }

export function build({ n, k, L }: Params): LQInstance {
  const m1 = choose(n, k) / 2 ** n
  const m2 = 1 / (n + 1)
  const bf = m1 / m2
  const post1 = bf / (1 + bf)
  const P = L.map((r) => r.map((v) => v / 100))
  const lppd = P.reduce((s, r) => s + Math.log(r.reduce((a, v) => a + v, 0) / 4), 0)
  const pw = P.reduce((s, r) => { const lg = r.map(Math.log); const m = lg.reduce((a, v) => a + v, 0) / 4; return s + lg.reduce((a, v) => a + (v - m) ** 2, 0) / 3 }, 0)
  const waic = -2 * (lppd - pw)
  const tbl = String.raw`\begin{array}{c|cccc} & s=1&s=2&s=3&s=4 \\ \hline i=1 & ${P[0].map(dec).join('&')} \\ i=2 & ${P[1].map(dec).join('&')} \\ i=3 & ${P[2].map(dec).join('&')} \end{array}`

  return {
    intro: tex(k) + ' successes are observed in ' + tex(n) + ' trials. Model ' + tex('M_1') + ' says ' + tex('\\theta=0.5') + ' exactly; model ' + tex('M_2') + ' puts a uniform prior on ' + tex('\\theta') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the marginal likelihood of the data under ' + tex('M_1') + ', ' + tex('\\binom nk2^{-n}') + '.',
        answer: m1, tolerance: tol4, lecture: 5,
        explanation: tex('\\binom{' + n + '}{' + k + '}/2^{' + n + '}=' + choose(n, k) + '/' + 2 ** n) + ' = ' + dec(m1) + '.',
      },
      {
        prompt: 'Under ' + tex('M_2') + ' the marginal likelihood is ' + tex('\\int_0^1\\binom nk\\theta^k(1-\\theta)^{n-k}d\\theta=\\dfrac1{n+1}') + '. Find the Bayes factor ' + tex('BF_{12}=p(y\\mid M_1)/p(y\\mid M_2)') + '.',
        answer: bf, tolerance: tol4, lecture: 5,
        explanation: tex(dec(m1) + '/' + dec(m2)) + ' = ' + dec(bf) + (bf > 1 ? ', favouring the simple model.' : ', favouring the flexible model.'),
      },
      {
        prompt: 'With equal prior probabilities for the two models, find the posterior probability of ' + tex('M_1') + ', ' + tex('BF/(1+BF)') + '.',
        answer: post1, tolerance: tol4, lecture: 5,
        explanation: tex(dec(bf) + '/(1+' + dec(bf) + ')') + ' = ' + dec(post1) + '.',
      },
      {
        prompt: 'For a WAIC calculation, the table gives the likelihood ' + tex('p(y_i\\mid\\theta_s)') + ' of each of 3 observations under each of 4 posterior draws: $$' + tbl + '$$ Find lppd ' + tex('=\\sum_i\\ln\\big(\\tfrac14\\sum_sp(y_i\\mid\\theta_s)\\big)') + ' (natural logarithm, 3 decimal places).',
        answer: lppd, tolerance: tol3, lecture: 5,
        explanation: 'The row means are ' + tex(P.map((r) => dec(r.reduce((a, v) => a + v, 0) / 4)).join(',')) + '; the sum of their logs is ' + dec(lppd) + '.',
      },
      {
        prompt: 'Find WAIC ' + tex('=-2(\\text{lppd}-p_{\\text{WAIC}})') + ', where ' + tex('p_{\\text{WAIC}}=\\sum_i\\operatorname{Var}_s\\{\\ln p(y_i\\mid\\theta_s)\\}') + ' with sample variance (divisor 3). (3 decimal places)',
        answer: waic, tolerance: tol3, lecture: 5,
        explanation: tex('p_{\\text{WAIC}}=' + dec(pw)) + ', so ' + tex('-2(' + dec(lppd) + '-' + dec(pw) + ')') + ' = ' + dec(waic) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'bay-lq-c-evidence', generate: (rng) => build(sample(rng)) }
