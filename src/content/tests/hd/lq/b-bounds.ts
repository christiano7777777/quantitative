// LQ-B: comparing tail bounds for the mean of bounded variables: Chebyshev, Hoeffding, Bernstein, McDiarmid.
// Lecture 3 (concentration inequalities).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; q: number; t: number } // Bernoulli(q) variables, deviation t of the mean

export function sample(rng: Rng): Params {
  return { n: rng.pick([100, 200, 400, 1000]), q: rng.pick([0.02, 0.05, 0.1, 0.2]), t: rng.pick([0.02, 0.03, 0.05, 0.08]) }
}

export function build({ n, q, t }: Params): LQInstance {
  const v = q * (1 - q)
  const cheb = Math.min(1, v / (n * t * t))
  const hoeff = Math.exp(-2 * n * t * t)
  const bern = Math.exp(-(n * t * t) / (2 * (v + t / 3)))
  const mcd = Math.exp((-2 * t * t) / (n * (1 / n) ** 2)) // c_i = 1/n for the sample mean of [0,1] variables: exp(-2 t^2 n)
  const exactApprox = Math.exp(-(n * t * t) / (2 * v))

  return {
    intro: tex('X_1,\\dots,X_{' + n + '}') + ' are independent Bernoulli variables with success probability ' + tex('q=' + dec(q)) + ' (so variance ' + tex('\\sigma^2=q(1-q)=' + dec(v)) + ', values in ' + tex('[0,1]') + '). Let ' + tex('\\bar X') + ' be their mean and ' + tex('t=' + dec(t)) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Chebyshev gives ' + tex('P(|\\bar X-q|\\ge t)\\le\\sigma^2/(nt^2)') + ' (at most 1). Evaluate it.',
        answer: cheb, tolerance: tol4, lecture: 3,
        explanation: tex(dec(v) + '/(' + n + '\\cdot' + dec(t * t) + ')') + ' = ' + dec(cheb) + '.',
      },
      {
        prompt: 'Hoeffding gives ' + tex('P(\\bar X-q\\ge t)\\le\\exp(-2nt^2)') + ' for variables in ' + tex('[0,1]') + '. Evaluate it.',
        answer: hoeff, tolerance: tol4, lecture: 3,
        explanation: tex('\\exp(-2\\cdot' + n + '\\cdot' + dec(t * t) + ')') + ' = ' + dec(hoeff) + '.',
      },
      {
        prompt: 'Bernstein gives ' + tex('P(\\bar X-q\\ge t)\\le\\exp\\{-nt^2/(2(\\sigma^2+t/3))\\}') + ' (centred variables bounded by 1). Evaluate it.',
        answer: bern, tolerance: tol4, lecture: 3,
        explanation: tex('\\exp\\{-' + n + '\\cdot' + dec(t * t) + '/(2(' + dec(v) + '+' + dec(t / 3) + '))\\}') + ' = ' + dec(bern) + (bern < hoeff ? ', smaller than Hoeffding\'s ' + dec(hoeff) + ': using the variance sharpens the bound.' : '.'),
      },
      {
        prompt: 'The mean ' + tex('f(x_1,\\dots,x_n)=\\bar x') + ' changes by at most ' + tex('c_i=1/n') + ' when one coordinate changes. McDiarmid gives ' + tex('\\exp(-2t^2/\\sum c_i^2)') + '. Evaluate it; compare with Hoeffding\'s.',
        answer: mcd, tolerance: tol4, lecture: 3,
        explanation: tex('\\sum c_i^2=' + n + '/' + n + '^2=1/' + n) + ', so the bound is ' + tex('\\exp(-2' + n + '\\cdot' + dec(t * t) + ')') + ' = ' + dec(mcd) + ', identical to Hoeffding\'s: Hoeffding is the special case of McDiarmid for sums.',
      },
      {
        prompt: 'Evaluate the Gaussian-like approximation ' + tex('\\exp\\{-nt^2/(2\\sigma^2)\\}') + ', which Bernstein\'s bound approaches when ' + tex('t') + ' is small relative to ' + tex('\\sigma^2') + '.',
        answer: exactApprox, tolerance: tol4, lecture: 3,
        explanation: tex('\\exp\\{-' + n + '\\cdot' + dec(t * t) + '/(2\\cdot' + dec(v) + ')\\}') + ' = ' + dec(exactApprox) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'hd-lq-b-bounds', generate: (rng) => build(sample(rng)) }
