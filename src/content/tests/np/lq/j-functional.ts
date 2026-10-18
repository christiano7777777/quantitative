// LQ-J: plug-in estimates from the empirical distribution, the influence function of the variance, and the DKW band.
// Lecture 8 (statistical functionals and the empirical distribution).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; a: number; b: number; x0: number; alpha: number; N: number; eps0: number }

export function sample(rng: Rng): Params {
  const n = rng.pick([6, 8])
  const x = Array.from({ length: n }, () => rng.int(1, 15))
  const a = rng.int(3, 6)
  return { x, a, b: a + rng.int(3, 6), x0: rng.int(18, 26), alpha: rng.pick([0.05, 0.1]), N: rng.pick([50, 100, 200, 400]), eps0: rng.pick([0.05, 0.1]) }
}

export function build({ x, a, b, x0, alpha, N, eps0 }: Params): LQInstance {
  const n = x.length
  const Fn = (t: number) => x.filter((v) => v <= t).length / n
  const p = Fn(b) - Fn(a)
  const mean = x.reduce((s, v) => s + v, 0) / n
  const sig2 = x.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const infl = (x0 - mean) ** 2 - sig2
  const half = Math.sqrt(Math.log(2 / alpha) / (2 * N))
  const nMin = Math.ceil(Math.log(2 / alpha) / (2 * eps0 * eps0) - 1e-9)

  return {
    intro: 'A sample of ' + tex(n) + ' independent observations from an unknown distribution ' + tex('F') + ' is ' + tex(x.join(',')) + '. Let ' + tex('\\hat F_n') + ' be the empirical distribution function, and use plug-in estimators ' + tex('T(\\hat F_n)') + ' of functionals ' + tex('T(F)') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the plug-in estimate of ' + tex('P(' + a + '<X\\le ' + b + ')') + ', that is ' + tex('\\hat F_n(' + b + ')-\\hat F_n(' + a + ')') + '.',
        answer: p, tolerance: tol4, lecture: 11,
        explanation: tex('\\hat F_n(' + b + ')=' + x.filter((v) => v <= b).length + '/' + n + '') + ' and ' + tex('\\hat F_n(' + a + ')=' + x.filter((v) => v <= a).length + '/' + n) + ', so the difference is ' + dec(p) + '.',
      },
      {
        prompt: 'The variance is the functional ' + tex('T(F)=\\int(x-\\mu)^2\\,dF(x)') + '. Find the plug-in estimate ' + tex('T(\\hat F_n)') + '.',
        answer: sig2, tolerance: tol4, lecture: 11,
        explanation: tex('\\hat F_n') + ' puts mass ' + tex('1/' + n) + ' on each observation, so ' + tex('T(\\hat F_n)=\\frac1n\\sum(x_i-\\bar x)^2') + ' with ' + tex('\\bar x=' + dec(mean)) + ', which equals ' + dec(sig2) + ' (divisor ' + tex(n) + ', not ' + tex(n - 1) + ').',
      },
      {
        prompt: 'The influence function of the variance functional is ' + tex('L(y)=(y-\\mu)^2-\\sigma^2') + '. Evaluate it at ' + tex('y=' + x0) + ', using the plug-in estimates of ' + tex('\\mu') + ' and ' + tex('\\sigma^2') + '.',
        answer: infl, tolerance: tol4, lecture: 11,
        explanation: tex('(' + x0 + '-' + dec(mean) + ')^2-' + dec(sig2)) + ' = ' + dec(infl) + '. A single value far from the centre has a large influence on the variance.',
      },
      {
        prompt: 'The DKW inequality gives ' + tex('P(\\sup_x|\\hat F_n(x)-F(x)|>\\varepsilon)\\le 2e^{-2n\\varepsilon^2}') + '. For a sample of size ' + tex('n=' + N) + ', find the half-width ' + tex('\\varepsilon') + ' of the band ' + tex('\\hat F_n\\pm\\varepsilon') + ' that contains ' + tex('F') + ' with probability at least ' + tex(dec(1 - alpha)) + '.',
        answer: half, tolerance: tol4, lecture: 11,
        explanation: 'Set ' + tex('2e^{-2' + N + '\\varepsilon^2}=' + dec(alpha)) + ', so ' + tex('\\varepsilon=\\sqrt{\\ln(2/' + dec(alpha) + ')/(2\\cdot' + N + ')}') + ' = ' + dec(half) + '.',
      },
      {
        prompt: 'What is the smallest sample size ' + tex('n') + ' for which the DKW band at confidence level ' + tex(dec(1 - alpha)) + ' has half-width at most ' + tex(dec(eps0)) + '? Give a whole number.',
        answer: nMin, tolerance: tolInt, lecture: 11,
        explanation: 'Need ' + tex('n\\ge\\ln(2/' + dec(alpha) + ')/(2\\cdot' + dec(eps0) + '^2)=' + dec(Math.log(2 / alpha) / (2 * eps0 * eps0))) + ', so ' + tex('n=' + nMin) + '.',
      },
    ],
  }
}

export const genJ: LQGenerator = { id: 'np-lq-j-functional', generate: (rng) => build(sample(rng)) }
