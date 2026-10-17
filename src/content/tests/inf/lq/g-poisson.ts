// LQ-G: Poisson counts: MLE, likelihood ratio statistic, and the Neyman-Pearson test (size, power, likelihood ratio).
// Lectures 3 (MLE), 8 (size and power), 9 (likelihood ratio test, Neyman-Pearson).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol4 } from '../../../shared/format'

export interface Params {
  n: number
  lam0: number
  counts: number[]
  c: number // reject H0 when the total S <= c
}

export function sample(rng: Rng): Params {
  const [n, lam0] = rng.pick([[3, 1], [4, 1], [3, 2], [4, 2]] as const)
  let counts: number[]
  do counts = Array.from({ length: n }, () => rng.int(0, 2 * lam0 + 2))
  while (counts.reduce((a, b) => a + b, 0) < 1)
  return { n, lam0, counts, c: rng.pick([1, 2, 3]) }
}

const poisCdf = (m: number, c: number) => {
  let s = 0, t = Math.exp(-m)
  for (let k = 0; k <= c; k++) { s += t; t *= m / (k + 1) }
  return s
}

export function build({ n, lam0, counts, c }: Params): LQInstance {
  const S = counts.reduce((a, b) => a + b, 0)
  const lam1 = lam0 / 2
  const mle = S / n
  const lrt = 2 * (S * Math.log(S / (n * lam0)) - S + n * lam0)
  const alpha = poisCdf(n * lam0, c)
  const power = poisCdf(n * lam1, c)
  const lr = (lam1 / lam0) ** S * Math.exp(n * (lam0 - lam1))
  const L = tex('\\lambda')

  return {
    intro:
      'The counts ' + counts.join(', ') + ' are a sample of size ' + tex(n) + ' from a Poisson distribution with mean ' + L + '. Their total is ' + tex('S=' + S) + '. We test ' + tex('H_0:\\lambda=' + dec(lam0)) + ' against ' + tex('H_1:\\lambda=' + dec(lam1)) +
      '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the maximum likelihood estimate of ' + L + '.',
        answer: mle, tolerance: tol4, lecture: 3,
        explanation: tex('\\ell(\\lambda)=S\\ln\\lambda-n\\lambda+\\text{const}') + ' is maximised at ' + tex('\\hat\\lambda=S/n=' + S + '/' + n) + ' = ' + dec(mle) + '.',
      },
      {
        prompt: 'For the composite test of ' + tex('H_0:\\lambda=' + dec(lam0)) + ' against ' + tex('\\lambda\\ne' + dec(lam0)) + ', find the likelihood ratio statistic ' + tex('-2\\ln\\Lambda=2\\big[S\\ln\\tfrac{S}{n\\lambda_0}-S+n\\lambda_0\\big]') + ' (2 decimal places, natural logarithm).',
        answer: lrt, tolerance: tol2, lecture: 9,
        explanation: tex('-2\\ln\\Lambda=2[' + S + '\\ln(' + S + '/' + dec(n * lam0) + ')-' + S + '+' + dec(n * lam0) + ']') + ' = ' + dec(lrt) + ', compared with ' + tex('\\chi^2_1') + ' (Wilks).',
      },
      {
        prompt: 'The Neyman-Pearson test of ' + tex('H_0') + ' against the simple ' + tex('H_1:\\lambda=' + dec(lam1)) + ' rejects when the total is small: ' + tex('S\\le' + c) + '. Under ' + tex('H_0') + ' the total is Poisson with mean ' + tex(dec(n * lam0)) + '. Find the size of the test.',
        answer: alpha, tolerance: tol4, lecture: 8,
        explanation: tex('\\alpha=\\sum_{k=0}^{' + c + '}e^{-' + dec(n * lam0) + '}' + dec(n * lam0) + '^k/k!') + ' = ' + dec(alpha) + '.',
      },
      {
        prompt: 'Find the power of this test: the probability of ' + tex('S\\le' + c) + ' when ' + tex('\\lambda=' + dec(lam1)) + ' (total Poisson with mean ' + tex(dec(n * lam1)) + ').',
        answer: power, tolerance: tol4, lecture: 8,
        explanation: tex('\\sum_{k=0}^{' + c + '}e^{-' + dec(n * lam1) + '}' + dec(n * lam1) + '^k/k!') + ' = ' + dec(power) + '.',
      },
      {
        prompt: 'For the observed data, find the likelihood ratio ' + tex('L(' + dec(lam1) + ')/L(' + dec(lam0) + ')') + '. (The Neyman-Pearson test rejects ' + tex('H_0') + ' when this is large.)',
        answer: lr, tolerance: { abs: 0.0005, rel: 0.0005 }, lecture: 9,
        explanation: tex('\\dfrac{L(\\lambda_1)}{L(\\lambda_0)}=\\Big(\\dfrac{\\lambda_1}{\\lambda_0}\\Big)^{S}e^{-n(\\lambda_1-\\lambda_0)}=(' + dec(lam1 / lam0) + ')^{' + S + '}e^{' + dec(n * (lam0 - lam1)) + '}') + ' = ' + dec(lr) + '. It is large exactly when ' + tex('S') + ' is small.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'inf-lq-g-poisson', generate: (rng) => build(sample(rng)) }
