// inf lecture 8 (likelihood and the large-sample theory of the MLE): one story. Exponential waiting times with rate theta: the MLE, its
// asymptotic standard error, a Wald interval limit, and the Wald, score and likelihood ratio statistics for H0: theta = theta0.
// Lecture 8.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[]; th0: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const x = Array.from({ length: 5 }, () => rng.int(5, 40) / 10)
    const S = x.reduce((a, b) => a + b, 0)
    const th0 = rng.pick([0.3, 0.4, 0.5, 0.6, 0.8])
    if (Math.abs(5 / S - th0) > 0.08) return { x, th0 }
  }
}

export function build({ x, th0 }: Params): LQInstance {
  const n = x.length
  const S = x.reduce((a, b) => a + b, 0)
  const mle = n / S
  const se = mle / Math.sqrt(n)
  const upper = mle + 1.96 * se
  const wald = ((mle - th0) / se) ** 2
  const score = (n / th0 - S) ** 2 / (n / (th0 * th0))
  const lrt = 2 * (n * Math.log(mle / th0) - (mle - th0) * S)

  return {
    intro: 'The waiting times (minutes) of ' + tex(n) + ' customers are ' + tex(x.map(dec).join(',\\ ')) + ', modelled as i.i.d. exponential with rate ' + tex('\\theta') + ' (density ' + tex('\\theta e^{-\\theta x}') + '). The log-likelihood is ' + tex('\\ell(\\theta)=n\\ln\\theta-\\theta\\sum x_i') + ' and the Fisher information of one observation is ' + tex('I(\\theta)=1/\\theta^2') + '. Test ' + tex('H_0:\\theta=' + dec(th0)) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the maximum likelihood estimate ' + tex('\\hat\\theta=n/\\sum x_i') + '.',
        answer: mle, tolerance: tol4, lecture: 8,
        explanation: tex('\\sum x_i=' + dec(S)) + ', so ' + tex('\\hat\\theta=' + n + '/' + dec(S)) + ' = ' + dec(mle) + '.',
      },
      {
        prompt: 'For large ' + tex('n') + ', ' + tex('\\hat\\theta') + ' is approximately ' + tex('N(\\theta,1/\\{nI(\\theta)\\})') + '. Find the estimated standard error ' + tex('\\hat\\theta/\\sqrt n') + '.',
        answer: se, tolerance: tol4, lecture: 8,
        explanation: tex('1/\\{nI(\\hat\\theta)\\}=\\hat\\theta^2/n') + ', so the standard error is ' + tex(dec(mle) + '/\\sqrt{' + n + '}') + ' = ' + dec(se) + '.',
      },
      {
        prompt: 'Find the upper limit of the Wald 95% interval ' + tex('\\hat\\theta\\pm1.96\\,\\widehat{\\mathrm{SE}}') + '.',
        answer: upper, tolerance: tol4, lecture: 8,
        explanation: tex(dec(mle) + '+1.96\\times' + dec(se)) + ' = ' + dec(upper) + '.',
      },
      {
        prompt: 'Find the Wald statistic ' + tex('W=(\\hat\\theta-\\theta_0)^2/\\widehat{\\mathrm{SE}}^2') + ' for ' + tex('H_0:\\theta=' + dec(th0)) + '.',
        answer: wald, tolerance: tol4, lecture: 8,
        explanation: tex('((' + dec(mle) + '-' + dec(th0) + ')/' + dec(se) + ')^2') + ' = ' + dec(wald) + '.',
      },
      {
        prompt: 'Find the score statistic ' + tex('S=U(\\theta_0)^2/I_n(\\theta_0)') + ', with the score ' + tex('U(\\theta)=n/\\theta-\\sum x_i') + ' and ' + tex('I_n(\\theta)=n/\\theta^2') + ', both at ' + tex('\\theta_0') + '. (It needs only ' + tex('\\theta_0') + ', not the MLE.)',
        answer: score, tolerance: tol4, lecture: 8,
        explanation: tex('U(\\theta_0)=' + n + '/' + dec(th0) + '-' + dec(S) + '=' + dec(n / th0 - S)) + ' and ' + tex('I_n(\\theta_0)=' + dec(n / (th0 * th0))) + ', so ' + tex('S=' + dec(score)) + '.',
      },
      {
        prompt: 'Find the likelihood ratio statistic ' + tex('-2\\ln\\Lambda=2\\{\\ell(\\hat\\theta)-\\ell(\\theta_0)\\}=2\\{n\\ln(\\hat\\theta/\\theta_0)-(\\hat\\theta-\\theta_0)\\sum x_i\\}') + '. All three statistics are approximately ' + tex('\\chi^2_1') + ' under ' + tex('H_0') + '.',
        answer: lrt, tolerance: tol4, lecture: 8,
        explanation: tex('2\\{' + n + '\\ln(' + dec(mle) + '/' + dec(th0) + ')-(' + dec(mle) + '-' + dec(th0) + ')\\times' + dec(S) + '\\}') + ' = ' + dec(lrt) + '. Compare with the 5% point ' + tex('3.841') + ' of ' + tex('\\chi^2_1') + '.',
      },
    ],
  }
}

export const genLec8: LQGenerator = { id: 'inf-lq-lec8', generate: (rng) => build(sample(rng)) }
