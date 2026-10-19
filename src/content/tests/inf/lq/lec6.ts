// inf lecture 6 (sufficiency, minimal sufficiency, likelihood principle): one story. n Bernoulli trials with k successes: the number of
// sequences behind the sufficient statistic, a likelihood, a likelihood ratio, the MLE, and the binomial/negative binomial likelihood ratio.
// Lecture 6.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { n: number; k: number; t0: number; t1: number; t2: number }

export function sample(rng: Rng): Params {
  const n = rng.int(7, 10)
  const [t1, t2] = rng.pick<[number, number]>([[0.3, 0.6], [0.4, 0.7], [0.5, 0.8], [0.2, 0.5]])
  return { n, k: rng.int(2, n - 3), t0: rng.pick([0.4, 0.5, 0.6]), t1, t2 }
}

const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c }

export function build({ n, k, t0, t1, t2 }: Params): LQInstance {
  const seqs = choose(n, k)
  const L = (t: number) => t ** k * (1 - t) ** (n - k)
  const lik = L(t0)
  const lr = L(t1) / L(t2)
  const mle = k / n
  const ratio = choose(n, k) / choose(n - 1, k - 1)

  return {
    intro: 'A machine produces a part that is good (' + tex('1') + ') with unknown probability ' + tex('\\theta') + '. In ' + tex(n) + ' independent parts, ' + tex(k) + ' were good. Study what the data tell about ' + tex('\\theta') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The total ' + tex('T=\\sum X_i') + ' is sufficient for ' + tex('\\theta') + ': given ' + tex('T=' + k) + ', every sequence of ' + tex(n) + ' results with ' + tex(k) + ' good parts is equally likely whatever ' + tex('\\theta') + ' is. How many such sequences are there? Give a whole number.',
        answer: seqs, tolerance: tolInt, lecture: 6,
        explanation: tex('\\binom{' + n + '}{' + k + '}=' + seqs) + '. Since ' + tex('P(\\text{sequence}\\mid T=' + k + ')=1/' + seqs) + ' does not involve ' + tex('\\theta') + ', ' + tex('T') + ' is sufficient: the order of the results carries no further information.',
      },
      {
        prompt: 'The likelihood of the observed data (one specific sequence with ' + tex(k) + ' good parts) is ' + tex('L(\\theta)=\\theta^k(1-\\theta)^{n-k}') + '. Evaluate it at ' + tex('\\theta=' + dec(t0)) + '.',
        answer: lik, tolerance: { abs: 0.000005 }, lecture: 6,
        explanation: tex(dec(t0) + '^{' + k + '}\\times' + dec(1 - t0) + '^{' + (n - k) + '}') + ' = ' + dec(lik) + '.',
      },
      {
        prompt: 'Find the likelihood ratio ' + tex('L(' + dec(t1) + ')/L(' + dec(t2) + ')') + '. A minimal sufficient statistic is one that carries exactly the information that such ratios use: two samples with the same ratios for all ' + tex('\\theta') + ' values have the same ' + tex('T') + '.',
        answer: lr, tolerance: tol4, lecture: 6,
        explanation: tex('\\left(\\dfrac{' + dec(t1) + '}{' + dec(t2) + '}\\right)^{' + k + '}\\left(\\dfrac{' + dec(1 - t1) + '}{' + dec(1 - t2) + '}\\right)^{' + (n - k) + '}') + ' = ' + dec(lr) + '.',
      },
      {
        prompt: 'Find the maximum likelihood estimate ' + tex('\\hat\\theta=k/n') + '.',
        answer: mle, tolerance: tol4, lecture: 6,
        explanation: tex(k + '/' + n) + ' = ' + dec(mle) + ', the value of ' + tex('\\theta') + ' at which the likelihood ratio against any other value is at least ' + tex(1) + '.',
      },
      {
        prompt: 'Suppose instead the experimenter had decided to inspect parts until the ' + tex(k) + 'th good one, which happened to be part number ' + tex(n) + '. The negative binomial probability of this is ' + tex('\\binom{n-1}{k-1}\\theta^k(1-\\theta)^{n-k}') + '. By the likelihood principle the two designs give the same evidence about ' + tex('\\theta') + ' because their likelihoods are proportional. Find the constant ratio (binomial likelihood) / (negative binomial likelihood), ' + tex('\\binom nk/\\binom{n-1}{k-1}') + '.',
        answer: ratio, tolerance: tol4, lecture: 6,
        explanation: tex('\\binom{' + n + '}{' + k + '}/\\binom{' + (n - 1) + '}{' + (k - 1) + '}=' + choose(n, k) + '/' + choose(n - 1, k - 1)) + ' = ' + dec(ratio) + ' (it equals ' + tex('n/k') + '). It does not depend on ' + tex('\\theta') + ', so every likelihood ratio and the MLE are the same under both designs.',
      },
    ],
  }
}

export const genLec6: LQGenerator = { id: 'inf-lq-lec6', generate: (rng) => build(sample(rng)) }
