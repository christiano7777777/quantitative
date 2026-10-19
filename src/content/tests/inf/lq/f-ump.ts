// LQ-F: UMP test for a binomial proportion (monotone likelihood ratio, Karlin-Rubin), with the randomisation constant, its power and the Neyman-Pearson threshold.
// Lecture 8 (uniformly most powerful tests).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { n: number; p0: [number, number]; p1: [number, number]; alpha: [number, number] }

export function sample(rng: Rng): Params {
  return { n: rng.int(8, 12), p0: rng.pick([[1, 4], [1, 3], [1, 2]] as [number, number][]), p1: rng.pick([[2, 3], [3, 4], [4, 5]] as [number, number][]), alpha: rng.pick([[1, 20], [1, 10]] as [number, number][]) }
}

export const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }
export const pmf = (n: number, p: number, k: number) => choose(n, k) * p ** k * (1 - p) ** (n - k)

export function build({ n, p0: q0, p1: q1, alpha: al }: Params): LQInstance {
  const p0 = q0[0] / q0[1], p1 = q1[0] / q1[1], alpha = al[0] / al[1]
  const tail = (p: number, c: number) => { let s = 0; for (let k = c + 1; k <= n; k++) s += pmf(n, p, k); return s }
  let c = 0
  while (tail(p0, c) > alpha) c++
  const size = tail(p0, c)
  const gamma = (alpha - size) / pmf(n, p0, c)
  const power = tail(p1, c) + gamma * pmf(n, p1, c)
  const k = pmf(n, p1, c) / pmf(n, p0, c)
  const fr = (q: [number, number]) => '\\tfrac{' + q[0] + '}{' + q[1] + '}'

  return {
    intro: 'Let ' + tex('Y\\sim\\mathrm{Bin}(' + n + ',p)') + '. To test ' + tex('H_0:p\\le' + fr(q0)) + ' against ' + tex('H_1:p>' + fr(q0)) + ' at level ' + tex('\\alpha=' + fr(al) + '=' + dec(alpha)) + ', use the UMP test (the binomial family has monotone likelihood ratio in ' + tex('Y') + '): reject if ' + tex('Y>c') + ', reject with probability ' + tex('\\gamma') + ' if ' + tex('Y=c') + ', and accept if ' + tex('Y<c') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the critical value ' + tex('c') + ': the smallest integer with ' + tex('P_{p_0}(Y>c)\\le\\alpha') + ' at ' + tex('p_0=' + fr(q0)) + ' (the size is controlled at the boundary of ' + tex('H_0') + ').',
        answer: c, tolerance: tolInt, lecture: 9,
        explanation: 'Upper tail probabilities at ' + tex('p_0') + ': ' + tex('P(Y>' + (c - 1) + ')=' + dec(tail(p0, c - 1))) + ' exceeds ' + dec(alpha) + ' while ' + tex('P(Y>' + c + ')=' + dec(size)) + ' does not, so ' + tex('c=' + c) + '.',
      },
      {
        prompt: 'Find ' + tex('P_{p_0}(Y>c)') + '.',
        answer: size, tolerance: tol4, lecture: 9,
        explanation: 'Sum the binomial probabilities of ' + tex(c + 1) + ' to ' + tex(n) + ' successes at ' + tex('p_0') + ': ' + dec(size) + '.',
      },
      {
        prompt: 'Find the randomisation probability ' + tex('\\gamma=\\dfrac{\\alpha-P_{p_0}(Y>c)}{P_{p_0}(Y=c)}') + '.',
        answer: gamma, tolerance: tol4, lecture: 9,
        explanation: tex('P_{p_0}(Y=' + c + ')=' + dec(pmf(n, p0, c))) + ', so ' + tex('\\gamma=(' + dec(alpha) + '-' + dec(size) + ')/' + dec(pmf(n, p0, c)) + '=' + dec(gamma)) + '. This makes the size exactly ' + tex('\\alpha') + '.',
      },
      {
        prompt: 'Find the power of the test at ' + tex('p=' + fr(q1)) + ': ' + tex('P_p(Y>c)+\\gamma P_p(Y=c)') + '.',
        answer: power, tolerance: tol4, lecture: 9,
        explanation: tex('P(Y>' + c + ')=' + dec(tail(p1, c)) + ',\\ P(Y=' + c + ')=' + dec(pmf(n, p1, c))) + ', so the power is ' + tex(dec(tail(p1, c)) + '+' + dec(gamma) + '\\cdot' + dec(pmf(n, p1, c)) + '=' + dec(power)) + '.',
      },
      {
        prompt: 'The test is the Neyman-Pearson test of ' + tex('p_0') + ' against ' + tex('p_1=' + fr(q1)) + ' that rejects for large likelihood ratio. Find the likelihood ratio ' + tex('f_{p_1}(c)/f_{p_0}(c)') + ' at the boundary value ' + tex('y=c') + ' (4 significant figures).',
        answer: k, tolerance: { rel: 0.001 }, lecture: 9,
        explanation: tex('(p_1/p_0)^c\\{(1-p_1)/(1-p_0)\\}^{n-c}') + ' at ' + tex('c=' + c) + ' equals ' + dec(k) + '. The ratio increases in ' + tex('y') + ', so rejecting for ' + tex('Y>c') + ' is the same as rejecting for ratio above this ' + tex('k') + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'inf-lq-f-ump', generate: (rng) => build(sample(rng)) }
