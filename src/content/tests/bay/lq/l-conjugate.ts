// LQ-L: two conjugate models from the tutorials: Dirichlet-multinomial (a canteen) and Gamma-Weibull (waiting times with shape 2).
// Lecture 3 (conjugate models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { alpha: number[]; counts: number[]; a: number; b: number; T: number[] }

export function sample(rng: Rng): Params {
  return {
    alpha: [rng.pick([1, 2, 3]), rng.pick([1, 2, 3]), rng.pick([1, 2])],
    counts: [rng.int(1, 6), rng.int(1, 6), rng.int(0, 4)],
    a: rng.pick([2, 3, 4]), b: rng.pick([1, 2, 3]),
    T: Array.from({ length: rng.pick([3, 4]) }, () => rng.int(2, 18) / 10),
  }
}

export function build({ alpha, counts, a, b, T }: Params): LQInstance {
  const n = counts.reduce((s, v) => s + v, 0), a0 = alpha.reduce((s, v) => s + v, 0)
  const post1 = alpha[0] + counts[0]
  const pred2 = (alpha[1] + counts[1]) / (a0 + n)
  const k = 2
  const sk = T.reduce((s, t) => s + t ** k, 0)
  const alphaN = a + T.length, betaN = b + sk
  const mean = alphaN / betaN
  const mode = (alphaN - 1) / betaN

  return {
    intro: 'Part A. A student eats at a canteen and each meal ends in one of three ways: diarrhea, healthy, or leaves without eating, with probabilities ' + tex('\\theta=(\\theta_1,\\theta_2,\\theta_3)') + ' and prior ' + tex('\\mathrm{Dirichlet}(' + alpha.join(',') + ')') + '. In ' + tex('n=' + n) + ' meals the counts are ' + tex('(n_1,n_2,n_3)=(' + counts.join(',') + ')') + '. Part B. Waiting times ' + tex('T_i\\mid\\lambda\\sim\\mathrm{Weibull}(\\lambda,k=2)') + ' with density ' + tex('\\lambda kt^{k-1}e^{-\\lambda t^k}') + ' and prior ' + tex('\\lambda\\sim\\mathrm{Gamma}(' + a + ',' + b + ')') + ' (shape, rate) are observed: ' + tex(T.map(dec).join(',\\ ')) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Part A. The posterior is ' + tex('\\mathrm{Dirichlet}(\\alpha_1+n_1,\\alpha_2+n_2,\\alpha_3+n_3)') + '. Find the first parameter ' + tex('\\alpha_1+n_1') + '. Give a whole number.',
        answer: post1, tolerance: { abs: 0.25 }, lecture: 3,
        explanation: tex(alpha[0] + '+' + counts[0]) + ' = ' + post1 + '. Conjugacy: the counts are added to the prior parameters.',
      },
      {
        prompt: 'Part A. Find the posterior predictive probability that the next meal is healthy, ' + tex('\\dfrac{\\alpha_2+n_2}{\\alpha_1+\\alpha_2+\\alpha_3+n}') + '.',
        answer: pred2, tolerance: tol4, lecture: 3,
        explanation: tex('\\dfrac{' + alpha[1] + '+' + counts[1] + '}{' + a0 + '+' + n + '}') + ' = ' + dec(pred2) + '. It equals the posterior mean of ' + tex('\\theta_2') + '.',
      },
      {
        prompt: 'Part B. The posterior is ' + tex('\\lambda\\mid T\\sim\\mathrm{Gamma}(a+n,\\ b+\\sum T_i^k)') + '. Find the posterior rate ' + tex('\\beta_n=b+\\sum_iT_i^2') + '.',
        answer: betaN, tolerance: tol4, lecture: 3,
        explanation: tex('\\sum T_i^2=' + T.map((t) => dec(t) + '^2').join('+') + '=' + dec(sk)) + ', so ' + tex('\\beta_n=' + b + '+' + dec(sk)) + ' = ' + dec(betaN) + ' (and the shape is ' + tex('\\alpha_n=' + a + '+' + T.length + '=' + alphaN) + ').',
      },
      {
        prompt: 'Part B. Find the posterior mean ' + tex('E(\\lambda\\mid T)=\\alpha_n/\\beta_n') + '.',
        answer: mean, tolerance: tol4, lecture: 3,
        explanation: tex(alphaN + '/' + dec(betaN)) + ' = ' + dec(mean) + '.',
      },
      {
        prompt: 'Part B. Find the posterior mode ' + tex('(\\alpha_n-1)/\\beta_n') + '.',
        answer: mode, tolerance: tol4, lecture: 3,
        explanation: tex('(' + alphaN + '-1)/' + dec(betaN)) + ' = ' + dec(mode) + ', below the mean ' + dec(mean) + ' because a Gamma posterior is right-skewed.',
      },
    ],
  }
}

export const genL: LQGenerator = { id: 'bay-lq-l-conjugate', generate: (rng) => build(sample(rng)) }
