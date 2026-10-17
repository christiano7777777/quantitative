// LQ-E: significance of a Sharpe ratio: t statistic, standard error, confidence bound, years needed, effective sample size.
// Lecture 7 (statistical significance in practice).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { sr: number; years: number; T: number; rho: number }

export function sample(rng: Rng): Params {
  return { sr: rng.pick([0.5, 0.8, 1, 1.2, 1.5]), years: rng.pick([2, 3, 4, 5, 8, 10]), T: rng.pick([60, 120, 240]), rho: rng.pick([0.1, 0.2, 0.3, 0.5]) }
}

export function build({ sr, years, T, rho }: Params): LQInstance {
  const t = sr * Math.sqrt(years)
  const se = Math.sqrt((1 + (sr * sr) / 24) / years)
  const lo = sr - 1.96 * se
  const need = (2 / sr) ** 2
  const teff = (T * (1 - rho)) / (1 + rho)

  return {
    intro: 'A strategy has an annualised Sharpe ratio of ' + tex(dec(sr)) + ' estimated from ' + tex(years) + ' years of monthly returns that are treated as independent. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the approximate ' + tex('t') + ' statistic of the mean return, ' + tex('SR\\sqrt{T}') + ' with ' + tex('T') + ' in years.',
        answer: t, tolerance: tol4, lecture: 7,
        explanation: tex(dec(sr) + '\\sqrt{' + years + '}') + ' = ' + dec(t) + '.',
      },
      {
        prompt: 'Find the approximate standard error of the annualised Sharpe ratio for monthly data, ' + tex('\\sqrt{(1+SR^2/24)/T}') + ' with ' + tex('T') + ' in years.',
        answer: se, tolerance: tol4, lecture: 7,
        explanation: tex('\\sqrt{(1+' + dec(sr * sr / 24) + ')/' + years + '}') + ' = ' + dec(se) + '.',
      },
      {
        prompt: 'Find the lower end of the 95% confidence interval, ' + tex('SR-1.96\\,\\mathrm{se}') + '. (If it is below 0 the Sharpe ratio is not significantly positive.)',
        answer: lo, tolerance: tol4, lecture: 7,
        explanation: tex(dec(sr) + '-1.96\\cdot' + dec(se)) + ' = ' + dec(lo) + '.',
      },
      {
        prompt: 'How many years of data are needed for ' + tex('t=2') + ' at this Sharpe ratio, ' + tex('(2/SR)^2') + '?',
        answer: need, tolerance: tol3, lecture: 7,
        explanation: tex('(2/' + dec(sr) + ')^2') + ' = ' + dec(need) + ' years.',
      },
      {
        prompt: 'The ' + tex(T) + ' monthly returns follow an AR(1) process with autocorrelation ' + tex('\\rho=' + dec(rho)) + '. The effective number of independent observations is about ' + tex('T(1-\\rho)/(1+\\rho)') + '. Find it (3 decimal places).',
        answer: teff, tolerance: tol3, lecture: 7,
        explanation: tex(T + '\\cdot' + dec(1 - rho) + '/' + dec(1 + rho)) + ' = ' + dec(teff) + ': positive autocorrelation makes the sample carry less information.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'rm-lq-e-significance', generate: (rng) => build(sample(rng)) }
