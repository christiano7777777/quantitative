// bay lecture 2 (conjugate models): one story. Poisson counts with a Gamma prior for the rate: the posterior shape and rate, mean, variance,
// and the posterior predictive probability of a quiet day and variance of a future count.
// Lecture 2.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { a: number; b: number; x: number[] }

export function sample(rng: Rng): Params {
  const n = rng.int(4, 6)
  return { a: rng.int(2, 4), b: rng.int(1, 2), x: Array.from({ length: n }, () => rng.int(0, 6)) }
}

export function build({ a, b, x }: Params): LQInstance {
  const n = x.length
  const s = x.reduce((p, q) => p + q, 0)
  const A = a + s, B = b + n
  const mean = A / B
  const variance = A / (B * B)
  const p0 = (B / (B + 1)) ** A
  const predVar = A / B + A / (B * B)

  return {
    intro: 'The number of emails received per day is modelled as Poisson(' + tex('\\lambda') + ') with prior ' + tex('\\lambda\\sim\\mathrm{Gamma}(' + a + ',' + b + ')') + ' (shape ' + tex(a) + ', rate ' + tex(b) + ', density proportional to ' + tex('\\lambda^{' + (a - 1) + '}e^{-' + b + '\\lambda}') + '). Over ' + tex(n) + ' days the counts were ' + tex(x.join(',\\ ')) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The posterior is ' + tex('\\mathrm{Gamma}(a+\\sum x_i,\\ b+n)') + '. Find its shape. Give a whole number.',
        answer: A, tolerance: tolInt, lecture: 2,
        explanation: tex(a + '+' + s + '=' + A) + '. Likelihood times prior is ' + tex('\\lambda^{\\sum x_i}e^{-n\\lambda}\\cdot\\lambda^{a-1}e^{-b\\lambda}') + ', again of Gamma form (conjugacy).',
      },
      {
        prompt: 'Find the posterior rate. Give a whole number.',
        answer: B, tolerance: tolInt, lecture: 2,
        explanation: tex(b + '+' + n + '=' + B) + '.',
      },
      {
        prompt: 'Find the posterior mean of ' + tex('\\lambda') + ', shape divided by rate.',
        answer: mean, tolerance: tol4, lecture: 2,
        explanation: tex(A + '/' + B) + ' = ' + dec(mean) + '. It lies between the prior mean ' + tex(dec(a / b)) + ' and the sample mean ' + tex(dec(s / n)) + '.',
      },
      {
        prompt: 'Find the posterior variance, shape divided by rate squared.',
        answer: variance, tolerance: tol4, lecture: 2,
        explanation: tex(A + '/' + B + '^2') + ' = ' + dec(variance) + '.',
      },
      {
        prompt: 'The posterior predictive distribution of tomorrow\'s count is negative binomial. Its probability of zero emails is ' + tex('P(Y=0\\mid x)=\\left(\\dfrac{B}{B+1}\\right)^{A}') + ' with the posterior shape ' + tex('A') + ' and rate ' + tex('B') + '. Find it.',
        answer: p0, tolerance: tol4, lecture: 2,
        explanation: tex('(' + B + '/' + (B + 1) + ')^{' + A + '}') + ' = ' + dec(p0) + '. It averages ' + tex('e^{-\\lambda}') + ' over the Gamma posterior.',
      },
      {
        prompt: 'Find the variance of the predictive distribution of tomorrow\'s count, ' + tex('E[\\lambda\\mid x]+\\mathrm{Var}(\\lambda\\mid x)') + ' (the Poisson variance averaged over the posterior plus the variance of the posterior mean of the count).',
        answer: predVar, tolerance: tol4, lecture: 2,
        explanation: tex(dec(mean) + '+' + dec(variance)) + ' = ' + dec(predVar) + '. It exceeds the predictive mean ' + tex(dec(mean)) + ': a Poisson count with an uncertain rate is over-dispersed.',
      },
    ],
  }
}

export const genLec2: LQGenerator = { id: 'bay-lq-lec2', generate: (rng) => build(sample(rng)) }
