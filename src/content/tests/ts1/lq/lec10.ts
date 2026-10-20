// Lecture 10: one residual ACF and two candidate models; Ljung-Box, AIC and BIC.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { n: number; r1: number; r2: number; r3: number; ellA: number; ellB: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const n = rng.pick([30, 40])
    const r1 = rng.pick([0.15, 0.2, 0.25])
    const r2 = rng.pick([0.05, 0.1])
    const r3 = rng.pick([-0.08, -0.05, 0.04])
    const ellA = -100
    const ellB = -98.6
    const aicDiff = -2 * ellB + 2 * 3 - (-2 * ellA + 2 * 2)
    const bicDiff = -2 * ellB + 3 * Math.log(n) - (-2 * ellA + 2 * Math.log(n))
    if (aicDiff < 0 && bicDiff > 0) return { n, r1, r2, r3, ellA, ellB }
  }
}

export function build({ n, r1, r2, r3, ellA, ellB }: Params): LQInstance {
  const q = n * (n + 2) * (r1 * r1 / (n - 1) + r2 * r2 / (n - 2) + r3 * r3 / (n - 3))
  const crit = 7.815
  const aicA = -2 * ellA + 2 * 2
  const aicB = -2 * ellB + 2 * 3
  const bicA = -2 * ellA + 2 * Math.log(n)
  const bicB = -2 * ellB + 3 * Math.log(n)
  return {
    intro: 'An analyst fits two workload models. For the preferred residual check, ' + tex('n=' + n) + ' and the first three residual autocorrelations are ' + tex('\\hat r_1=' + dec(r1) + ',\\ \\hat r_2=' + dec(r2) + ',\\ \\hat r_3=' + dec(r3)) + '. Use ' + tex('Q=n(n+2)\\sum_{j=1}^3\\hat r_j^2/(n-j)') + ' and the 5% critical value ' + tex('7.815') + '. Model A has ' + tex('\\ell_A=' + dec(ellA) + ',\\ k_A=2') + '; model B has ' + tex('\\ell_B=' + dec(ellB) + ',\\ k_B=3') + '. For the final code enter 1 for model A and 2 for model B. Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Enter the squared first residual autocorrelation ' + tex('\\hat r_1^2') + '.',
        answer: r1 * r1, tolerance: tol4, lecture: 10,
        explanation: tex('\\hat r_1^2=(' + dec(r1) + ')^2=' + dec(r1 * r1)) + '.',
      },
      {
        prompt: 'Compute the Ljung-Box statistic ' + tex('Q') + ' using lags 1 through 3.',
        answer: q, tolerance: tol4, lecture: 10,
        explanation: tex('Q=' + n + '\\times' + (n + 2) + '\\left(\\frac{' + dec(r1 * r1) + '}{' + (n - 1) + '}+\\frac{' + dec(r2 * r2) + '}{' + (n - 2) + '}+\\frac{' + dec(r3 * r3) + '}{' + (n - 3) + '}\\right)=' + dec(q)) + '.',
      },
      {
        prompt: 'Give the Ljung-Box decision code: 1 if white-noise residuals are rejected, 0 otherwise.',
        answer: q > crit ? 1 : 0, tolerance: tolInt, lecture: 10,
        explanation: tex(dec(q) + (q > crit ? '>' : '\\le') + dec(crit)) + ', so the code is ' + (q > crit ? '1' : '0') + '.',
      },
      {
        prompt: 'Find ' + tex('\\mathrm{AIC}_B-\\mathrm{AIC}_A') + '.',
        answer: aicB - aicA, tolerance: tol4, lecture: 10,
        explanation: tex('\\mathrm{AIC}_A=' + dec(aicA)) + ' and ' + tex('\\mathrm{AIC}_B=' + dec(aicB)) + ', so the difference is ' + tex(dec(aicB - aicA)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\mathrm{BIC}_B-\\mathrm{BIC}_A') + '.',
        answer: bicB - bicA, tolerance: tol4, lecture: 10,
        explanation: tex('\\mathrm{BIC}_A=-2(' + dec(ellA) + ')+2\\ln(' + n + ')=' + dec(bicA)) + ' and ' + tex('\\mathrm{BIC}_B=-2(' + dec(ellB) + ')+3\\ln(' + n + ')=' + dec(bicB)) + ', so the difference is ' + tex(dec(bicB - bicA)) + '.',
      },
      {
        prompt: 'Using BIC, enter the code of the preferred model.',
        answer: 1, tolerance: tolInt, lecture: 10,
        explanation: 'Lower BIC is preferred. Since ' + tex(dec(bicA) + '<' + dec(bicB)) + ', model A is preferred and the code is 1.',
      },
    ],
  }
}

export const genLec10: LQGenerator = { id: 'ts1-lq-lec10', generate: (rng) => build(sample(rng)) }
