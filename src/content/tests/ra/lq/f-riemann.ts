// LQ-F: Lebesgue versus Riemann: Dirichlet-type functions, Darboux sums, improper integrals, and the discontinuity set.
// Lecture 8 (Lebesgue vs Riemann integrals).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { L: number; k: number; lo: number; hi: number; kk: number; nn: number; s: number[]; A: number; Bw: number }

export function sample(rng: Rng): Params {
  const L = rng.int(2, 5)
  const lo = rng.int(1, 4)
  const A = rng.int(0, L - 1)
  return {
    L, k: rng.int(1, 3), lo, hi: lo + rng.int(1, 5), kk: rng.int(1, 4), nn: rng.pick([4, 5, 8, 10, 20]),
    s: rng.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]), A, Bw: rng.int(1, L - A),
  }
}

export function build({ L, k, lo, hi, kk, nn, s, A, Bw }: Params): LQInstance {
  const lebesgue = L ** (k + 1) / (k + 1)
  const gap = (hi - lo) * L
  const darb = L ** (kk + 1) / nn
  const sv = s[0] / s[1]
  const improper = 1 / (1 - sv)
  const wEff = Bw
  const disc = L - wEff
  const sTex = '\\frac{' + s[0] + '}{' + s[1] + '}'

  return {
    intro: 'All functions are defined on a bounded interval with Lebesgue measure. Give every answer to 4 decimal places.',
    parts: [
      {
        prompt: 'Let ' + tex('f(x)=x^{' + k + '}') + ' if ' + tex('x') + ' is irrational and ' + tex('f(x)=0') + ' if ' + tex('x') + ' is rational, for ' + tex('x\\in[0,' + L + ']') + '. This ' + tex('f') + ' is not Riemann integrable. Find its Lebesgue integral ' + tex('\\int_{[0,' + L + ']}f\\,d\\lambda') + '.',
        answer: lebesgue, tolerance: tol4, lecture: 8,
        explanation: 'The rationals are null, so ' + tex('f') + ' equals ' + tex('x^{' + k + '}') + ' almost everywhere and ' + tex('\\int f=\\int_0^{' + L + '}x^{' + k + '}dx=\\frac{' + L + '^{' + (k + 1) + '}}{' + (k + 1) + '}=' + dec(lebesgue)) + '.',
      },
      {
        prompt: 'Let ' + tex('g(x)=' + lo + '') + ' for rational ' + tex('x') + ' and ' + tex('g(x)=' + hi + '') + ' for irrational ' + tex('x') + ', on ' + tex('[0,' + L + ']') + '. For any partition ' + tex('P') + ' of ' + tex('[0,' + L + ']') + ' find the difference ' + tex('U(g,P)-L(g,P)') + ' of the upper and lower Darboux sums.',
        answer: gap, tolerance: tol4, lecture: 8,
        explanation: 'Every subinterval contains rationals and irrationals, so its supremum is ' + tex(String(hi)) + ' and its infimum is ' + tex(String(lo)) + '. Then ' + tex('U-L=(' + hi + '-' + lo + ')\\cdot' + L + '=' + gap) + ' for every ' + tex('P') + ', so ' + tex('g') + ' is not Riemann integrable although its Lebesgue integral is ' + tex(String(hi * L)) + '.',
      },
      {
        prompt: 'Let ' + tex('h(x)=x^{' + kk + '}') + ' on ' + tex('[0,' + L + ']') + ' and let ' + tex('P') + ' split the interval into ' + tex(String(nn)) + ' equal subintervals. Find ' + tex('U(h,P)-L(h,P)') + '.',
        answer: darb, tolerance: tol4, lecture: 8,
        explanation: tex('h') + ' is increasing, so on each subinterval of width ' + tex('\\Delta=' + dec(L / nn)) + ' the sup minus the inf is the increment of ' + tex('h') + '. The increments telescope: ' + tex('U-L=\\Delta\\,(h(' + L + ')-h(0))=\\frac{' + L + '}{' + nn + '}\\cdot' + L ** kk + '=' + dec(darb)) + '. This tends to 0 as the partition is refined, so ' + tex('h') + ' is Riemann integrable.',
      },
      {
        prompt: 'For ' + tex('0<s<1') + ' with ' + tex('s=' + sTex) + ', the improper Riemann integral ' + tex('\\int_0^1x^{-s}\\,dx') + ' of the nonnegative function ' + tex('x^{-s}') + ' agrees with its Lebesgue integral. Find it.',
        answer: improper, tolerance: tol4, lecture: 8,
        explanation: 'By monotone convergence the Lebesgue integral is the limit of ' + tex('\\int_\\delta^1x^{-s}dx=\\frac{1-\\delta^{1-s}}{1-s}') + ' as ' + tex('\\delta\\downarrow0') + ', that is ' + tex('\\frac1{1-s}=' + dec(improper)) + '.',
      },
      {
        prompt: 'On ' + tex('[0,' + L + ']') + ' let ' + tex('u(x)=1') + ' if ' + tex('x') + ' is rational or ' + tex('x\\in[' + A + ',' + (A + wEff) + ']') + ', and ' + tex('u(x)=0') + ' otherwise. Find the Lebesgue measure of the set ' + tex('D') + ' of points where ' + tex('u') + ' is discontinuous. (By the Lebesgue criterion ' + tex('u') + ' is Riemann integrable exactly when ' + tex('\\lambda(D)=0') + '.)',
        answer: disc, tolerance: tol4, lecture: 8,
        explanation: tex('u') + ' is continuous exactly on the open interval ' + tex('(' + A + ',' + (A + wEff) + ')') + ', where it is constantly 1. Everywhere else (including the endpoints) every neighbourhood contains both rationals and irrationals with different values, so ' + tex('\\lambda(D)=' + L + '-' + wEff + '=' + disc) + ' and ' + tex('u') + ' is not Riemann integrable.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'ra-lq-f-riemann', generate: (rng) => build(sample(rng)) }
