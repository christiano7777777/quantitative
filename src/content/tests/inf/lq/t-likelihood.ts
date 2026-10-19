// LQ-T: likelihood ratios and minimal sufficiency (Poisson), the uniform likelihood, and the likelihood principle (binomial vs negative binomial).
// Lecture 11 (minimal sufficiency and the likelihood principle).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { A: number[]; B: number[]; C: number[]; lam0: number; mx: number[]; th: [number, number]; r: number; p: [number, number] }

export function sample(rng: Rng): Params {
  for (;;) {
    const A = Array.from({ length: 4 }, () => rng.int(0, 5))
    const sum = A.reduce((a, b) => a + b, 0)
    // B has the same sum as A but a different split; C has a different sum
    const B = [...A]
    const i = rng.int(0, 3), j = (i + rng.int(1, 3)) % 4
    if (B[i] > 0) { B[i]--; B[j]++ }
    const C = [...A]
    C[rng.int(0, 3)] += rng.int(1, 2)
    if (B.join() !== A.join() && A.reduce((a, b) => a + b, 0) === sum) {
      const mx = Array.from({ length: 5 }, () => rng.int(2, 9) / 2)
      const m = Math.max(...mx)
      return { A, B, C, lam0: rng.pick([1, 1.5, 2, 3]), mx, th: [m + rng.int(1, 4) / 2, m + rng.int(5, 8) / 2], r: rng.int(2, 4), p: [0.5, rng.pick([0.2, 0.25, 0.4])] }
    }
  }
}

const fact = (k: number) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f }

export function build({ A, B, C, lam0, mx, th, r, p }: Params): LQInstance {
  const prod = (v: number[]) => v.reduce((a, b) => a * fact(b), 1)
  const eqRatio = prod(B) / prod(A)
  const sA = A.reduce((a, b) => a + b, 0), sC = C.reduce((a, b) => a + b, 0)
  const neRatio = lam0 ** (sA - sC) * (prod(C) / prod(A))
  const n = mx.length
  const lik = th[0] ** -n
  const lr = (th[0] / th[1]) ** n
  const nTrials = 12
  const kSucc = r
  const binRatio = (p[0] / p[1]) ** kSucc * ((1 - p[0]) / (1 - p[1])) ** (nTrials - kSucc)

  return {
    intro: 'For a sample ' + tex('x') + ' the likelihood is ' + tex('L(\\theta;x)=f(x\\mid\\theta)') + '. A statistic ' + tex('T') + ' is minimal sufficient iff ' + tex('L(\\theta;x)/L(\\theta;x\'\\,)') + ' does not depend on ' + tex('\\theta') + ' exactly when ' + tex('T(x)=T(x\'\\,)') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Poisson(' + tex('\\lambda') + ') samples are ' + tex('x=(' + A.join(',') + ')') + ' and ' + tex('x\'=(' + B.join(',') + ')') + ', which have the same total ' + tex(sA) + '. Find the likelihood ratio ' + tex('L(\\lambda;x)/L(\\lambda;x\'\\,)') + ', which does not depend on ' + tex('\\lambda') + '.',
        answer: eqRatio, tolerance: tol4, lecture: 11,
        explanation: 'The terms ' + tex('e^{-n\\lambda}\\lambda^{\\sum x_i}') + ' are equal, so the ratio is ' + tex('\\prod x_i\'!/\\prod x_i!=' + prod(B) + '/' + prod(A)) + ' = ' + dec(eqRatio) + '.',
      },
      {
        prompt: 'For ' + tex('x=(' + A.join(',') + ')') + ' (total ' + tex(sA) + ') and ' + tex('x\'\'=(' + C.join(',') + ')') + ' (total ' + tex(sC) + ') find the likelihood ratio ' + tex('L(\\lambda;x)/L(\\lambda;x\'\'\\,)') + ' at ' + tex('\\lambda=' + dec(lam0)) + '. (It depends on ' + tex('\\lambda') + ', as the totals differ.)',
        answer: neRatio, tolerance: tol4, lecture: 11,
        explanation: tex('\\lambda^{\\sum x_i-\\sum x\'\'_i}\\prod x\'\'_i!/\\prod x_i!=' + dec(lam0) + '^{' + (sA - sC) + '}\\times' + prod(C) + '/' + prod(A)) + ' = ' + dec(neRatio) + '.',
      },
      {
        prompt: 'A sample from ' + tex('U(0,\\theta)') + ' is ' + tex(mx.map(dec).join(',\\ ')) + '. Its likelihood is ' + tex('\\theta^{-n}\\mathbf 1\\{\\max x_i\\le\\theta\\}') + '. Find ' + tex('L(\\theta)') + ' at ' + tex('\\theta=' + dec(th[0])) + ' (6 decimal places).',
        answer: lik, tolerance: { abs: 5e-7 }, lecture: 11,
        explanation: 'The maximum ' + dec(Math.max(...mx)) + ' is at most ' + dec(th[0]) + ', so ' + tex('L=' + dec(th[0]) + '^{-' + n + '}') + ' = ' + dec(lik) + '. The statistic ' + tex('\\max_iX_i') + ' is minimal sufficient.',
      },
      {
        prompt: 'For the same sample find the likelihood ratio ' + tex('L(' + dec(th[1]) + ')/L(' + dec(th[0]) + ')') + '.',
        answer: lr, tolerance: tol4, lecture: 11,
        explanation: tex('(' + dec(th[0]) + '/' + dec(th[1]) + ')^{' + n + '}') + ' = ' + dec(lr) + ' (both values are at least the maximum). The likelihood is decreasing in ' + tex('\\theta') + ' above the maximum, so the MLE is the sample maximum.',
      },
      {
        prompt: 'Experiment 1 observes ' + tex(kSucc) + ' successes in ' + tex(nTrials) + ' Bernoulli trials (binomial). Experiment 2 keeps going until ' + tex(kSucc) + ' successes and happens to need ' + tex(nTrials) + ' trials (negative binomial). Under the likelihood principle the two give the same evidence about ' + tex('p') + '. Find the likelihood ratio ' + tex('L(' + dec(p[0]) + ')/L(' + dec(p[1]) + ')') + ', which is the same in both experiments.',
        answer: binRatio, tolerance: tol4, lecture: 11,
        explanation: 'In both experiments ' + tex('L(p)\\propto p^{' + kSucc + '}(1-p)^{' + (nTrials - kSucc) + '}') + ' (the binomial coefficients differ but cancel in the ratio), so the ratio is ' + tex('(' + dec(p[0]) + '/' + dec(p[1]) + ')^{' + kSucc + '}(' + dec(1 - p[0]) + '/' + dec(1 - p[1]) + ')^{' + (nTrials - kSucc) + '}') + ' = ' + dec(binRatio) + '.',
      },
    ],
  }
}

export const genT: LQGenerator = { id: 'inf-lq-t-likelihood', generate: (rng) => build(sample(rng)) }
