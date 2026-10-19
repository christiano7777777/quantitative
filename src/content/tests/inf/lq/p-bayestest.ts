// LQ-P: Bayesian estimation and testing with a Beta posterior: posterior mean, posterior mean of the odds, posterior
// probability of H0, and the expected posterior losses of accepting and rejecting.
// Lecture 6 (Bayesian inference: estimation and testing).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: number; b: number; n: number; x: number; L0: number; L1: number }

export function sample(rng: Rng): Params {
  const n = rng.int(4, 8)
  const a = rng.int(1, 3), b = rng.int(2, 3)
  return { a, b, n, x: rng.int(1, n - 1), L0: rng.pick([1, 2, 3, 4]), L1: rng.pick([1, 2, 3, 5]) }
}

function binom(m: number, j: number): number {
  let c = 1
  for (let i = 1; i <= j; i++) c = (c * (m - j + i)) / i
  return c
}

export function build({ a, b, n, x, L0, L1 }: Params): LQInstance {
  const A = a + x, B = b + n - x
  const mean = A / (A + B)
  const odds = A / (B - 1) // E[theta/(1-theta)] for a Beta(A,B) with B > 1
  // P(theta <= 1/2 | x) = P(Bin(A+B-1, 1/2) >= A)
  const m = A + B - 1
  let p0 = 0
  for (let j = A; j <= m; j++) p0 += binom(m, j) / 2 ** m
  const lossAccept = L1 * (1 - p0)
  const lossReject = L0 * p0
  const decision = lossReject < lossAccept ? 'reject' : 'accept'

  return {
    intro: 'The success probability ' + tex('\\theta') + ' has a ' + tex('\\mathrm{Beta}(' + a + ',' + b + ')') + ' prior, and ' + tex('x=' + x) + ' successes are observed in ' + tex('n=' + n) + ' trials, so the posterior is ' + tex('\\mathrm{Beta}(' + A + ',' + B + ')') + '. We test ' + tex('H_0:\\theta\\le\\tfrac12') + ' against ' + tex('H_1:\\theta>\\tfrac12') + ' with loss ' + tex(L0) + ' for rejecting a true ' + tex('H_0') + ' and loss ' + tex(L1) + ' for accepting a false ' + tex('H_0') + ' (and zero for a correct decision). Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the Bayes estimate of ' + tex('\\theta') + ' under squared error loss, the posterior mean.',
        answer: mean, tolerance: tol4, lecture: 6,
        explanation: tex('A/(A+B)=' + A + '/' + (A + B)) + ' = ' + dec(mean) + '.',
      },
      {
        prompt: 'Find the posterior mean of the odds ' + tex('\\theta/(1-\\theta)') + ', which for a ' + tex('\\mathrm{Beta}(A,B)') + ' posterior with ' + tex('B>1') + ' equals ' + tex('A/(B-1)') + '.',
        answer: odds, tolerance: tol4, lecture: 6,
        explanation: tex(A + '/(' + B + '-1)') + ' = ' + dec(odds) + '. It differs from the odds of the posterior mean, ' + dec(A / B) + ', because the odds are a nonlinear function of ' + tex('\\theta') + '.',
      },
      {
        prompt: 'Find the posterior probability ' + tex('P(H_0\\mid x)=P(\\theta\\le\\tfrac12\\mid x)') + '. (For integer parameters it equals ' + tex('P(\\mathrm{Bin}(A+B-1,\\tfrac12)\\ge A)') + '.)',
        answer: p0, tolerance: tol4, lecture: 6,
        explanation: tex('A+B-1=' + m) + ', so sum ' + tex('\\binom{' + m + '}{j}/2^{' + m + '}') + ' for ' + tex('j=' + A + ',\\dots,' + m) + ': ' + dec(p0) + '.',
      },
      {
        prompt: 'Find the expected posterior loss of accepting ' + tex('H_0') + ', ' + tex(L1 + '\\,P(H_1\\mid x)') + '.',
        answer: lossAccept, tolerance: tol4, lecture: 6,
        explanation: tex('P(H_1\\mid x)=1-' + dec(p0) + '=' + dec(1 - p0)) + ', so the expected loss is ' + tex(L1 + '\\times' + dec(1 - p0)) + ' = ' + dec(lossAccept) + '.',
      },
      {
        prompt: 'Find the expected posterior loss of rejecting ' + tex('H_0') + ', ' + tex(L0 + '\\,P(H_0\\mid x)') + '. (The Bayes decision takes the action with the smaller expected posterior loss.)',
        answer: lossReject, tolerance: tol4, lecture: 6,
        explanation: tex(L0 + '\\times' + dec(p0)) + ' = ' + dec(lossReject) + ', so the Bayes decision is to ' + decision + ' ' + tex('H_0') + '. Equivalently, reject iff ' + tex('P(H_1\\mid x)>L_0/(L_0+L_1)=' + dec(L0 / (L0 + L1))) + '.',
      },
    ],
  }
}

export const genP: LQGenerator = { id: 'inf-lq-p-bayestest', generate: (rng) => build(sample(rng)) }
