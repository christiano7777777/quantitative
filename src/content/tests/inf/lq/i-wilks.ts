// LQ-I: asymptotic likelihood ratio test for a Poisson mean (Wilks theorem), with the Wald and score statistics, the confidence interval obtained by inverting the test, and a two-sample likelihood ratio test.
// Lectures 10 (large-sample likelihood ratio tests and confidence sets) and 4 (Wald and score statistics from the large-sample theory of the MLE).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { n: number; lam0: number; T: number; n2: number; T2: number }

export const CRIT = 3.8415 // chi-square 0.95 quantile with 1 degree of freedom

export function sample(rng: Rng): Params {
  const n = rng.int(20, 40)
  const lam0 = rng.pick([1.5, 2, 2.5, 3, 4])
  const T = Math.round(n * lam0 * rng.pick([1.15, 1.2, 1.25, 1.3, 1.4]))
  const n2 = rng.int(15, 30)
  const T2 = Math.round(n2 * (T / n) * rng.pick([0.7, 0.75, 0.8, 1.25, 1.3]))
  return { n, lam0, T, n2, T2 }
}

/** -2 log LR of lambda against the MLE T/n for a Poisson total T over n observations. */
export const dev = (T: number, n: number, lam: number) => 2 * (T * Math.log(T / (n * lam)) - T + n * lam)

export function upperLimit(T: number, n: number): number {
  let lo = T / n, hi = (10 * T) / n
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (dev(T, n, mid) > CRIT) hi = mid; else lo = mid }
  return (lo + hi) / 2
}

export function build({ n, lam0, T, n2, T2 }: Params): LQInstance {
  const hat = T / n
  const lr = dev(T, n, lam0)
  const wald = ((hat - lam0) ** 2 * n) / hat
  const score = ((hat - lam0) ** 2 * n) / lam0
  const up = upperLimit(T, n)
  const pooled = (T + T2) / (n + n2)
  const lr2 = 2 * (T * Math.log(T / n / pooled) + T2 * Math.log(T2 / n2 / pooled))
  const hat2 = T2 / n2

  return {
    intro: 'Let ' + tex('X_1,\\dots,X_{' + n + '}') + ' be i.i.d. Poisson(' + tex('\\lambda') + '), observed with total ' + tex('T=\\sum X_i=' + T) + '. Use the large-sample chi-square approximation for ' + tex('-2\\log\\Lambda') + ' with the critical value ' + tex('\\chi^2_{1,\\,0.95}=3.8415') + '. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The maximum likelihood estimate is ' + tex('\\hat\\lambda=T/n=' + dec(hat)) + '. To test ' + tex('H_0:\\lambda=' + dec(lam0)) + ', find the likelihood ratio statistic ' + tex('-2\\log\\Lambda=2\\{T\\log(\\hat\\lambda/\\lambda_0)-T+n\\lambda_0\\}') + '.',
        answer: lr, tolerance: tol3, lecture: 10,
        explanation: tex('2\\{' + T + '\\log(' + dec(hat) + '/' + dec(lam0) + ')-' + T + '+' + n + '\\cdot' + dec(lam0) + '\\}=' + dec(lr)) + '. By Wilks theorem this is compared with ' + tex('\\chi^2_1') + ' (one free parameter under the full model, none under ' + tex('H_0') + '), so ' + (lr > CRIT ? tex('H_0') + ' is rejected at the 5% level.' : tex('H_0') + ' is not rejected at the 5% level.'),
      },
      {
        prompt: 'Find the Wald statistic ' + tex('n(\\hat\\lambda-\\lambda_0)^2/\\hat\\lambda') + ', which uses the Fisher information ' + tex('n/\\lambda') + ' evaluated at ' + tex('\\hat\\lambda') + '.',
        answer: wald, tolerance: tol3, lecture: 7,
        explanation: tex('' + n + '(' + dec(hat) + '-' + dec(lam0) + ')^2/' + dec(hat) + '=' + dec(wald)) + '.',
      },
      {
        prompt: 'Find the score statistic ' + tex('n(\\hat\\lambda-\\lambda_0)^2/\\lambda_0') + ', which uses the information at the null value ' + tex('\\lambda_0') + '.',
        answer: score, tolerance: tol3, lecture: 7,
        explanation: 'The score at ' + tex('\\lambda_0') + ' is ' + tex('n(\\hat\\lambda-\\lambda_0)/\\lambda_0') + ' and the information is ' + tex('n/\\lambda_0') + ', so the statistic is ' + tex('' + n + '(' + dec(hat) + '-' + dec(lam0) + ')^2/' + dec(lam0) + '=' + dec(score)) + '. All three statistics are asymptotically ' + tex('\\chi^2_1') + ' under ' + tex('H_0') + ' and close to each other here.',
      },
      {
        prompt: 'Inverting the test gives the 95% confidence set ' + tex('\\{\\lambda:\\ -2\\log\\Lambda(\\lambda)\\le3.8415\\}') + '. Find its upper endpoint, the root above ' + tex('\\hat\\lambda') + ' of ' + tex('2\\{T\\log(\\hat\\lambda/\\lambda)-T+n\\lambda\\}=3.8415') + ' (2 decimal places; solve by trial and error or Newton steps).',
        answer: up, tolerance: { abs: 0.005 }, lecture: 10,
        explanation: 'The function ' + tex('2\\{' + T + '\\log(' + dec(hat) + '/\\lambda)-' + T + '+' + n + '\\lambda\\}') + ' increases for ' + tex('\\lambda>\\hat\\lambda') + ' and reaches 3.8415 at ' + tex('\\lambda\\approx' + up.toFixed(3)) + '. The interval is not symmetric about ' + tex('\\hat\\lambda') + '; the Wald interval ' + tex('\\hat\\lambda\\pm1.96\\sqrt{\\hat\\lambda/n}') + ' has upper end ' + tex(dec(hat + 1.96 * Math.sqrt(hat / n))) + '.',
      },
      {
        prompt: 'A second independent Poisson sample of size ' + tex(n2) + ' has total ' + tex(T2) + ' (mean ' + tex(dec(hat2)) + '). To test equal means in the two samples, find ' + tex('-2\\log\\Lambda=2\\{T\\log(\\hat\\lambda_1/\\hat\\lambda_0)+T_2\\log(\\hat\\lambda_2/\\hat\\lambda_0)\\}') + ', where ' + tex('\\hat\\lambda_0=(T+T_2)/(n+n_2)=' + dec(pooled)) + ' is the pooled mean. (Under ' + tex('H_0') + ' it is approximately ' + tex('\\chi^2_1') + ': two free parameters minus one.)',
        answer: lr2, tolerance: tol3, lecture: 10,
        explanation: tex('2\\{' + T + '\\log(' + dec(hat) + '/' + dec(pooled) + ')+' + T2 + '\\log(' + dec(hat2) + '/' + dec(pooled) + ')\\}=' + dec(lr2)) + '. The degrees of freedom are ' + tex('2-1=1') + ', so compare with 3.8415.',
      },
    ],
  }
}

export const genI: LQGenerator = { id: 'inf-lq-i-wilks', generate: (rng) => build(sample(rng)) }
