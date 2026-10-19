// LQ-J (lecture quiz only): sufficient statistics of a normal sample, its natural parameter, and sufficiency for a Bernoulli sample.
// Lecture 4 (exponential families and sufficiency).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; nb: number; t: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const x = Array.from({ length: 5 }, () => rng.int(-4, 8))
    if (new Set(x).size >= 3) {
      const nb = rng.int(5, 9)
      return { x, nb, t: rng.int(2, nb - 2) }
    }
  }
}

export function build({ x, nb, t }: Params): LQInstance {
  const n = x.length
  const s1 = x.reduce((s, v) => s + v, 0)
  const s2 = x.reduce((s, v) => s + v * v, 0)
  const mean = s1 / n
  const s2hat = s2 / n - mean * mean
  const eta2 = -1 / (2 * s2hat)
  const cond = (t * (nb - t)) / (nb * (nb - 1))

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise. The normal family ' + tex('N(\\mu,\\sigma^2)') + ' has density ' + tex('\\exp\\{\\eta_1x^2+\\eta_2x-A(\\eta)\\}') + ' with natural parameters ' + tex('\\eta_1=-1/(2\\sigma^2)') + ' and ' + tex('\\eta_2=\\mu/\\sigma^2') + ', so ' + tex('(\\sum x_i^2,\\sum x_i)') + ' is a (minimal) sufficient statistic.',
    parts: [
      {
        prompt: 'A sample from ' + tex('N(\\mu,\\sigma^2)') + ' with both parameters unknown is ' + tex(x.join(',')) + '. Find the first component ' + tex('\\sum x_i') + ' of the sufficient statistic.',
        answer: s1, tolerance: tolInt, lecture: 6,
        explanation: tex(x.join('+')) + ' = ' + s1 + '.',
      },
      {
        prompt: 'For the same sample find the second component ' + tex('\\sum x_i^2') + '.',
        answer: s2, tolerance: tolInt, lecture: 6,
        explanation: tex(x.map((v) => '(' + v + ')^2').join('+')) + ' = ' + s2 + '.',
      },
      {
        prompt: 'The sufficient statistic is all you need to compute the MLE of ' + tex('\\sigma^2') + ', ' + tex('\\hat\\sigma^2=\\sum x_i^2/n-\\bar x^2') + '. Find it.',
        answer: s2hat, tolerance: tol4, lecture: 6,
        explanation: tex(s2 + '/' + n + '-(' + dec(mean) + ')^2') + ' = ' + dec(s2 / n) + ' - ' + dec(mean * mean) + ' = ' + dec(s2hat) + '.',
      },
      {
        prompt: 'Find the estimated natural parameter ' + tex('\\hat\\eta_1=-1/(2\\hat\\sigma^2)') + '.',
        answer: eta2, tolerance: tol4, lecture: 6,
        explanation: tex('-1/(2\\times' + dec(s2hat) + ')') + ' = ' + dec(eta2) + '.',
      },
      {
        prompt: 'A Bernoulli sample ' + tex('X_1,\\dots,X_{' + nb + '}') + ' with success probability ' + tex('p') + ' has total ' + tex('T=\\sum X_i=' + t) + '. Find ' + tex('P(X_1=1,X_2=0\\mid T=' + t + ')') + '. (It does not depend on ' + tex('p') + ', which is what sufficiency of ' + tex('T') + ' means.)',
        answer: cond, tolerance: tol4, lecture: 6,
        explanation: 'Given ' + tex('T=' + t) + ' all ' + tex('\\binom{' + nb + '}{' + t + '}') + ' arrangements are equally likely, and ' + tex('\\binom{' + (nb - 2) + '}{' + (t - 1) + '}') + ' of them have ' + tex('X_1=1,X_2=0') + ': ' + tex('\\dfrac{' + t + '\\cdot' + (nb - t) + '}{' + nb + '\\cdot' + (nb - 1) + '}') + ' = ' + dec(cond) + '.',
      },
    ],
  }
}

export const genJ: LQGenerator = { id: 'inf-lq-j-sufficiency', generate: (rng) => build(sample(rng)) }
