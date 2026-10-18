// LQ-D: Bayes and minimax estimation of a binomial proportion: Bayes estimate and posterior expected loss, Bayes risk, and the constant-risk minimax estimator.
// Lectures 6 (Bayes and minimax rules) and 5 (risk functions).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; x: number; al: number; be: number }

export function sample(rng: Rng): Params {
  const n = rng.pick([4, 9, 16])
  return { n, x: rng.int(1, n - 1), al: rng.int(1, 4), be: rng.int(1, 4) }
}

export function build({ n, x, al, be }: Params): LQInstance {
  const N = al + be + n
  const a = al + x, b = be + n - x
  const est = a / N
  const postVar = (a * b) / ((a + b) ** 2 * (a + b + 1))
  const bayesRisk = (al * be) / ((al + be) * (al + be + 1) * N)
  const rn = Math.sqrt(n)
  const minimax = (x + rn / 2) / (n + rn)
  const constRisk = 1 / (4 * (1 + rn) ** 2)

  return {
    intro: 'Let ' + tex('X\\sim\\mathrm{Bin}(' + n + ',\\theta)') + ' with prior ' + tex('\\theta\\sim\\mathrm{Beta}(' + al + ',' + be + ')') + ' and squared error loss. The observed value is ' + tex('x=' + x) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the Bayes estimate of ' + tex('\\theta') + ' (the posterior mean) at ' + tex('x=' + x) + '.',
        answer: est, tolerance: tol4, lecture: 2,
        explanation: 'The posterior is ' + tex('\\mathrm{Beta}(' + a + ',' + b + ')') + ', with mean ' + tex(a + '/' + N + '=' + dec(est)) + '.',
      },
      {
        prompt: 'Find the posterior expected loss of this estimate, that is the posterior variance of ' + tex('\\theta') + '.',
        answer: postVar, tolerance: tol4, lecture: 2,
        explanation: tex('\\dfrac{ab}{(a+b)^2(a+b+1)}=\\dfrac{' + a * b + '}{' + (a + b) ** 2 * (a + b + 1) + '}=' + dec(postVar)) + ' with ' + tex('a=' + a + ',\\ b=' + b) + '.',
      },
      {
        prompt: 'The Bayes risk of the Bayes estimator (averaging its risk over the prior) equals ' + tex('\\dfrac{\\alpha\\beta}{(\\alpha+\\beta)(\\alpha+\\beta+1)(\\alpha+\\beta+n)}') + '. Evaluate it.',
        answer: bayesRisk, tolerance: tol4, lecture: 2,
        explanation: tex('\\dfrac{' + al * be + '}{' + (al + be) * (al + be + 1) * N + '}=' + dec(bayesRisk)) + '. This is the average of the posterior variance over the marginal distribution of ' + tex('X') + '.',
      },
      {
        prompt: 'For ' + tex('n=' + n) + ' the Bayes rule for the prior ' + tex('\\mathrm{Beta}(\\sqrt n/2,\\sqrt n/2)') + ' has constant risk, hence is minimax: ' + tex('\\delta(x)=(x+\\sqrt n/2)/(n+\\sqrt n)') + '. Find its value at ' + tex('x=' + x) + '.',
        answer: minimax, tolerance: tol4, lecture: 2,
        explanation: tex('\\sqrt n=' + rn) + ', so ' + tex('\\delta(' + x + ')=(' + x + '+' + rn / 2 + ')/(' + n + '+' + rn + ')=' + dec(minimax)) + '.',
      },
      {
        prompt: 'Find the constant risk of this minimax estimator, ' + tex('n/\\{4(n+\\sqrt n)^2\\}') + '. (The maximum risk of the sample proportion ' + tex('x/n') + ' is ' + tex('1/(4n)=' + dec(1 / (4 * n))) + '.)',
        answer: constRisk, tolerance: tol4, lecture: 1,
        explanation: tex(n + '/\\{4(' + n + '+' + rn + ')^2\\}=' + dec(constRisk)) + ', smaller than the worst-case risk ' + dec(1 / (4 * n)) + ' of ' + tex('x/n') + ', although ' + tex('x/n') + ' is better near ' + tex('\\theta=0') + ' and ' + tex('1') + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'inf-lq-d-bayes-minimax', generate: (rng) => build(sample(rng)) }
