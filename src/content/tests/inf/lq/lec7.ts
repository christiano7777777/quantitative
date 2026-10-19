// inf lecture 7 (completeness, UMVU estimation, the information inequality): one story. Poisson counts: the complete sufficient statistic,
// UMVUEs of lambda and of exp(-lambda), the Fisher information, the Cramer-Rao bound, and the variance of a crude unbiased estimator.
// Lecture 7.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; lam0: number }

export function sample(rng: Rng): Params {
  const n = rng.int(4, 6)
  return { x: Array.from({ length: n }, () => rng.int(0, 5)), lam0: rng.pick([1, 2, 3]) }
}

export function build({ x, lam0 }: Params): LQInstance {
  const n = x.length
  const T = x.reduce((a, b) => a + b, 0)
  const umvuLam = T / n
  const umvuExp = (1 - 1 / n) ** T
  const info = n / lam0
  const bound = (lam0 * Math.exp(-2 * lam0)) / n
  const p = Math.exp(-lam0)
  const crude = p * (1 - p)

  return {
    intro: 'A call centre records the number of calls in each of ' + tex(n) + ' independent hours, ' + tex(x.join(',\\ ')) + ', modelled as i.i.d. Poisson(' + tex('\\lambda') + '). We want to estimate ' + tex('\\lambda') + ' and the probability ' + tex('g(\\lambda)=e^{-\\lambda}') + ' that an hour has no calls. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The total ' + tex('T=\\sum X_i') + ' is complete and sufficient for ' + tex('\\lambda') + ' (the Poisson family is a full-rank exponential family). Find its observed value. Give a whole number.',
        answer: T, tolerance: tolInt, lecture: 7,
        explanation: tex(x.join('+') + '=' + T) + '.',
      },
      {
        prompt: 'By the Lehmann-Scheffe theorem, an unbiased estimator that is a function of ' + tex('T') + ' is the UMVUE. Find the UMVUE of ' + tex('\\lambda') + ', ' + tex('T/n') + '.',
        answer: umvuLam, tolerance: tol4, lecture: 7,
        explanation: tex(T + '/' + n) + ' = ' + dec(umvuLam) + ', since ' + tex('E[T/n]=\\lambda') + '.',
      },
      {
        prompt: 'The indicator ' + tex('\\mathbf 1\\{X_1=0\\}') + ' is unbiased for ' + tex('e^{-\\lambda}') + '. Rao-Blackwellising it on ' + tex('T') + ' gives the UMVUE ' + tex('P(X_1=0\\mid T)=(1-1/n)^T') + ' (given ' + tex('T') + ', ' + tex('X_1\\sim\\mathrm{Bin}(T,1/n)') + '). Find its value.',
        answer: umvuExp, tolerance: tol4, lecture: 7,
        explanation: tex('(1-1/' + n + ')^{' + T + '}') + ' = ' + dec(umvuExp) + '.',
      },
      {
        prompt: 'The Fisher information of one Poisson observation is ' + tex('1/\\lambda') + ', so for ' + tex(n) + ' observations ' + tex('I_n(\\lambda)=n/\\lambda') + '. Find it at ' + tex('\\lambda=' + lam0) + '.',
        answer: info, tolerance: tol4, lecture: 7,
        explanation: tex(n + '/' + lam0) + ' = ' + dec(info) + '.',
      },
      {
        prompt: 'The Cramer-Rao bound for an unbiased estimator of ' + tex('g(\\lambda)') + ' is ' + tex('\\{g\'(\\lambda)\\}^2/I_n(\\lambda)') + '. With ' + tex('g(\\lambda)=e^{-\\lambda}') + ', find the bound at ' + tex('\\lambda=' + lam0) + '.',
        answer: bound, tolerance: { abs: 0.000005 }, lecture: 7,
        explanation: tex('g\'(\\lambda)=-e^{-\\lambda}') + ', so the bound is ' + tex('e^{-' + 2 * lam0 + '}/(' + n + '/' + lam0 + ')=' + lam0 + 'e^{-' + 2 * lam0 + '}/' + n) + ' = ' + dec(bound) + '.',
      },
      {
        prompt: 'Find the variance of the crude unbiased estimator ' + tex('\\mathbf 1\\{X_1=0\\}') + ' at ' + tex('\\lambda=' + lam0) + ', ' + tex('p(1-p)') + ' with ' + tex('p=e^{-\\lambda}') + '. Compare it with the bound of the previous part.',
        answer: crude, tolerance: tol4, lecture: 7,
        explanation: tex('p=' + dec(p)) + ', so ' + tex('p(1-p)=' + dec(crude)) + ', far above the bound ' + dec(bound) + ': the crude estimator uses only one observation. The UMVUE has variance below it, and the Cramer-Rao bound is a lower limit that the UMVUE of ' + tex('e^{-\\lambda}') + ' does not quite attain.',
      },
    ],
  }
}

export const genLec7: LQGenerator = { id: 'inf-lq-lec7', generate: (rng) => build(sample(rng)) }
