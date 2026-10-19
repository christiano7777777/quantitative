// inf lecture 10 (large-sample likelihood ratio tests and confidence sets): one story. A binomial proportion tested against theta0:
// the MLE, the likelihood ratio statistic, its chi-square p-value, the Wald statistic and interval limit, and whether theta0 lies in the likelihood ratio confidence set.
// Lecture 10.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { n: number; k: number; th0: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const n = rng.int(20, 30)
    const th0 = rng.pick([0.3, 0.4, 0.5, 0.6])
    const k = Math.round(n * th0) + rng.int(-6, 6)
    if (k >= 2 && k <= n - 2 && k !== Math.round(n * th0)) return { n, k, th0 }
  }
}

export function build({ n, k, th0 }: Params): LQInstance {
  const mle = k / n
  const lrt = 2 * (k * Math.log(mle / th0) + (n - k) * Math.log((1 - mle) / (1 - th0)))
  const p = 2 * (1 - normalCdf(Math.sqrt(lrt)))
  const wald = (mle - th0) ** 2 / ((mle * (1 - mle)) / n)
  const waldLow = mle - 1.96 * Math.sqrt((mle * (1 - mle)) / n)
  const inSet = lrt <= 3.841 ? 1 : 0

  return {
    intro: 'In a survey of ' + tex(n) + ' people, ' + tex(k) + ' prefer product A. Model the count as ' + tex('\\mathrm{Bin}(' + n + ',\\theta)') + ' and test ' + tex('H_0:\\theta=' + dec(th0)) + '. Use large-sample theory: under ' + tex('H_0') + ' the likelihood ratio statistic ' + tex('-2\\ln\\Lambda') + ' is approximately ' + tex('\\chi^2_1') + ', whose 5% point is ' + tex('3.841') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the maximum likelihood estimate ' + tex('\\hat\\theta=k/n') + '.',
        answer: mle, tolerance: tol4, lecture: 10,
        explanation: tex(k + '/' + n) + ' = ' + dec(mle) + '.',
      },
      {
        prompt: 'Find ' + tex('-2\\ln\\Lambda=2\\{k\\ln(\\hat\\theta/\\theta_0)+(n-k)\\ln\\frac{1-\\hat\\theta}{1-\\theta_0}\\}') + '.',
        answer: lrt, tolerance: tol4, lecture: 10,
        explanation: tex('2\\{' + k + '\\ln(' + dec(mle) + '/' + dec(th0) + ')+' + (n - k) + '\\ln(' + dec(1 - mle) + '/' + dec(1 - th0) + ')\\}') + ' = ' + dec(lrt) + '.',
      },
      {
        prompt: 'For one degree of freedom ' + tex('P(\\chi^2_1>s)=2\\{1-\\Phi(\\sqrt s)\\}') + '. Find the approximate p-value of the likelihood ratio test.',
        answer: p, tolerance: { abs: 0.0002 }, lecture: 10,
        explanation: tex('2\\{1-\\Phi(\\sqrt{' + dec(lrt) + '})\\}=2\\{1-\\Phi(' + dec(Math.sqrt(lrt)) + ')\\}') + ' = ' + dec(p) + '.',
      },
      {
        prompt: 'Find the Wald statistic ' + tex('(\\hat\\theta-\\theta_0)^2\\big/\\{\\hat\\theta(1-\\hat\\theta)/n\\}') + '.',
        answer: wald, tolerance: tol4, lecture: 10,
        explanation: tex('(' + dec(mle) + '-' + dec(th0) + ')^2/(' + dec(mle) + '\\times' + dec(1 - mle) + '/' + n + ')') + ' = ' + dec(wald) + '. It is close to the likelihood ratio statistic but not equal.',
      },
      {
        prompt: 'Find the lower limit of the Wald 95% confidence interval ' + tex('\\hat\\theta\\pm1.96\\sqrt{\\hat\\theta(1-\\hat\\theta)/n}') + '.',
        answer: waldLow, tolerance: tol4, lecture: 10,
        explanation: tex(dec(mle) + '-1.96\\sqrt{' + dec(mle) + '\\times' + dec(1 - mle) + '/' + n + '}') + ' = ' + dec(waldLow) + '.',
      },
      {
        prompt: 'The likelihood ratio confidence set is the set of all ' + tex('\\theta_0') + ' that the 5% test does not reject, i.e. with ' + tex('-2\\ln\\Lambda\\le3.841') + '. Is ' + tex('\\theta_0=' + dec(th0)) + ' in it? Answer ' + tex(1) + ' for yes and ' + tex(0) + ' for no.',
        answer: inSet, tolerance: tolInt, lecture: 10,
        explanation: 'The statistic ' + dec(lrt) + ' is ' + (inSet ? 'at most' : 'above') + ' ' + tex('3.841') + ', so ' + tex('\\theta_0=' + dec(th0)) + ' is ' + (inSet ? '' : 'not ') + 'in the 95% confidence set (answer ' + inSet + '). Inverting a family of tests in this way gives a confidence set.',
      },
    ],
  }
}

export const genLec10: LQGenerator = { id: 'inf-lq-lec10', generate: (rng) => build(sample(rng)) }
