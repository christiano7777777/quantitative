// inf lecture 5 (exponential families and their natural statistic): one story. Poisson counts from two groups of days: the natural
// statistic and natural parameter, the mean of the natural statistic, and the conditional (binomial) law of one group's total given the grand total.
// Lecture 5.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; lam1: number; n2: number; lam2: number; k: number }

export function sample(rng: Rng): Params {
  const lam1 = rng.pick([1, 2, 3, 4])
  const n2 = rng.pick([2, 3, 4])
  const x = Array.from({ length: 4 }, () => rng.int(0, 6))
  return { x, lam1, n2, lam2: rng.pick([1, 2, 3]), k: rng.int(1, 3) }
}

export function build({ x, lam1, n2, lam2, k }: Params): LQInstance {
  const n = x.length
  const T = x.reduce((a, b) => a + b, 0)
  const eta = Math.log(lam1)
  const ET = n * lam1
  const p = (n * lam1) / (n * lam1 + n2 * lam2)
  const t = 6
  let c = 1
  for (let i = 1; i <= k; i++) c = (c * (t - k + i)) / i
  const pk = c * p ** k * (1 - p) ** (t - k)

  return {
    intro: 'Daily customer counts at a shop are independent Poisson. On ' + tex(n) + ' ordinary days they were ' + tex(x.join(',\\ ')) + ', with rate ' + tex('\\lambda_1=' + lam1) + ' per day. On ' + tex(n2) + ' sale days the total count ' + tex('U') + ' is Poisson with rate ' + tex('\\lambda_2=' + lam2) + ' per day. The ordinary-day total is ' + tex('S') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The Poisson family is an exponential family ' + tex('f(x\\mid\\lambda)=\\frac1{x!}\\exp\\{x\\ln\\lambda-\\lambda\\}') + ' with natural statistic ' + tex('x') + '. For the ' + tex(n) + ' ordinary days the natural statistic is the total ' + tex('T=\\sum x_i') + '. Find its observed value. Give a whole number.',
        answer: T, tolerance: tolInt, lecture: 5,
        explanation: tex(x.join('+') + '=' + T) + '.',
      },
      {
        prompt: 'Find the natural parameter ' + tex('\\eta=\\ln\\lambda_1') + ' of the ordinary days.',
        answer: eta, tolerance: tol4, lecture: 5,
        explanation: tex('\\ln' + lam1) + ' = ' + dec(eta) + '. Writing the density as ' + tex('\\exp\\{\\eta T-A(\\eta)\\}') + ' gives ' + tex('A(\\eta)=n e^{\\eta}') + ' for the total of ' + tex(n) + ' days.',
      },
      {
        prompt: 'The mean of the natural statistic is ' + tex('A\'(\\eta)') + '. With ' + tex('A(\\eta)=ne^\\eta') + ', find ' + tex('E[T]') + ' at ' + tex('\\lambda_1=' + lam1) + '. (The variance ' + tex('A\'\'(\\eta)') + ' has the same value.)',
        answer: ET, tolerance: tol4, lecture: 5,
        explanation: tex('A\'(\\eta)=ne^\\eta=' + n + '\\times' + lam1) + ' = ' + dec(ET) + '.',
      },
      {
        prompt: 'Given the grand total ' + tex('S+U=' + t) + ', the ordinary-day total ' + tex('S') + ' is binomial ' + tex('\\mathrm{Bin}(' + t + ',p)') + ' with ' + tex('p=\\dfrac{n\\lambda_1}{n\\lambda_1+n_2\\lambda_2}') + '. Find ' + tex('p') + '.',
        answer: p, tolerance: tol4, lecture: 5,
        explanation: tex('S\\sim\\mathrm{Poisson}(' + n * lam1 + ')') + ' and ' + tex('U\\sim\\mathrm{Poisson}(' + n2 * lam2 + ')') + ', so ' + tex('p=' + n * lam1 + '/(' + n * lam1 + '+' + n2 * lam2 + ')') + ' = ' + dec(p) + '. The nuisance structure disappears in the conditional law: it depends on the rates only through their ratio.',
      },
      {
        prompt: 'Find the conditional probability ' + tex('P(S=' + k + '\\mid S+U=' + t + ')') + '.',
        answer: pk, tolerance: tol4, lecture: 5,
        explanation: tex('\\binom{' + t + '}{' + k + '}' + dec(p) + '^{' + k + '}' + dec(1 - p) + '^{' + (t - k) + '}') + ' = ' + dec(pk) + '.',
      },
    ],
  }
}

export const genLec5: LQGenerator = { id: 'inf-lq-lec5', generate: (rng) => build(sample(rng)) }
