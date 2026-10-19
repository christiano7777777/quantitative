// inf lecture 9 (UMP, UMP unbiased and conditional tests): one story. A binomial test of H0: theta <= theta0 against theta > theta0 with
// a monotone likelihood ratio: the critical value, the size, the power, a randomised test and a likelihood ratio.
// Lecture 9.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { n: number; th0: number; th1: number; x: number }

export function sample(rng: Rng): Params {
  const n = rng.int(10, 12)
  return { n, th0: rng.pick([0.3, 0.4, 0.5]), th1: rng.pick([0.6, 0.7, 0.8]), x: rng.int(4, 8) }
}

const pmf = (n: number, k: number, p: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c * p ** k * (1 - p) ** (n - k) }
const tail = (n: number, c: number, p: number) => { let s = 0; for (let k = c; k <= n; k++) s += pmf(n, k, p); return s }

export function build({ n, th0, th1, x }: Params): LQInstance {
  const alpha = 0.05
  let c = 0
  while (tail(n, c, th0) > alpha) c++
  const size = tail(n, c, th0)
  const power = tail(n, c, th1)
  const gamma = (alpha - size) / pmf(n, c - 1, th0)
  const lr = (th1 / th0) ** x * ((1 - th1) / (1 - th0)) ** (n - x)

  return {
    intro: 'A supplier claims that at most a fraction ' + tex('\\theta_0=' + dec(th0)) + ' of its items are defective. You inspect ' + tex(n) + ' items and let ' + tex('X') + ' be the number of defectives, ' + tex('X\\sim\\mathrm{Bin}(' + n + ',\\theta)') + '. Test ' + tex('H_0:\\theta\\le' + dec(th0)) + ' against ' + tex('H_1:\\theta>' + dec(th0)) + ' at level ' + tex(0.05) + '. The binomial family has a monotone likelihood ratio in ' + tex('X') + ', so the test that rejects for large ' + tex('X') + ' is uniformly most powerful. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the smallest critical value ' + tex('c') + ' such that rejecting when ' + tex('X\\ge c') + ' has size at most ' + tex(0.05) + ' at ' + tex('\\theta_0=' + dec(th0)) + '. Give a whole number.',
        answer: c, tolerance: tolInt, lecture: 9,
        explanation: tex('P_{\\theta_0}(X\\ge' + c + ')=' + dec(size) + '\\le0.05') + ' while ' + tex('P_{\\theta_0}(X\\ge' + (c - 1) + ')=' + dec(tail(n, c - 1, th0)) + '>0.05') + '. The size is largest at ' + tex('\\theta=\\theta_0') + ' because the rejection probability increases with ' + tex('\\theta') + '.',
      },
      {
        prompt: 'Find the actual size of this test, ' + tex('P_{\\theta_0}(X\\ge c)') + '.',
        answer: size, tolerance: tol4, lecture: 9,
        explanation: 'Sum ' + tex('\\binom{' + n + '}{k}' + dec(th0) + '^k' + dec(1 - th0) + '^{' + n + '-k}') + ' for ' + tex('k=' + c + ',\\dots,' + n) + ': ' + dec(size) + '. Because ' + tex('X') + ' is discrete the size is below ' + tex(0.05) + '.',
      },
      {
        prompt: 'Find the power of this test at the alternative ' + tex('\\theta_1=' + dec(th1)) + ', ' + tex('P_{\\theta_1}(X\\ge c)') + '.',
        answer: power, tolerance: tol4, lecture: 9,
        explanation: 'Sum ' + tex('\\binom{' + n + '}{k}' + dec(th1) + '^k' + dec(1 - th1) + '^{' + n + '-k}') + ' for ' + tex('k=' + c + ',\\dots,' + n) + ': ' + dec(power) + '.',
      },
      {
        prompt: 'A randomised test that rejects for ' + tex('X\\ge c') + ' and also rejects with probability ' + tex('\\gamma') + ' when ' + tex('X=c-1') + ' reaches size exactly ' + tex(0.05) + '. Find ' + tex('\\gamma=\\dfrac{0.05-P_{\\theta_0}(X\\ge c)}{P_{\\theta_0}(X=c-1)}') + '.',
        answer: gamma, tolerance: tol4, lecture: 9,
        explanation: tex('(0.05-' + dec(size) + ')/' + dec(pmf(n, c - 1, th0))) + ' = ' + dec(gamma) + '. The Neyman-Pearson lemma allows this randomisation so that the size is exactly ' + tex(0.05) + '.',
      },
      {
        prompt: 'The Neyman-Pearson test of the simple hypotheses ' + tex('\\theta_0') + ' against ' + tex('\\theta_1') + ' rejects for a large likelihood ratio ' + tex('f_{\\theta_1}(x)/f_{\\theta_0}(x)') + '. Find it at the observed ' + tex('x=' + x) + ' (it is increasing in ' + tex('x') + ', which is why the test reduces to ' + tex('X\\ge c') + ').',
        answer: lr, tolerance: tol4, lecture: 9,
        explanation: tex('\\left(\\dfrac{' + dec(th1) + '}{' + dec(th0) + '}\\right)^{' + x + '}\\left(\\dfrac{' + dec(1 - th1) + '}{' + dec(1 - th0) + '}\\right)^{' + (n - x) + '}') + ' = ' + dec(lr) + '.',
      },
    ],
  }
}

export const genLec9: LQGenerator = { id: 'inf-lq-lec9', generate: (rng) => build(sample(rng)) }
