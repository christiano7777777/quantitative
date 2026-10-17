// LQ-A: geometry of high dimensions (shell volume, squared distance) and Hoeffding bounds for a sum of bounded variables.
// Lectures 1 (the high-dimensional regime), 2 (sub-Gaussian variables), 3 (concentration inequalities).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4, tolInt } from '../../../shared/format'

export interface Params { p: number; eps: number; n: number; a: number; b: number; t: number; delta: number; err: number }

export function sample(rng: Rng): Params {
  let p: Params
  do {
    const a = rng.pick([0, -1, -2]), b = a + rng.pick([2, 3, 4])
    p = { p: rng.pick([10, 20, 50, 100]), eps: rng.pick([0.01, 0.02, 0.05]), n: rng.pick([50, 100, 200, 400]), a, b, t: rng.pick([5, 8, 10, 15, 20]), delta: rng.pick([0.01, 0.05]), err: rng.pick([0.05, 0.1, 0.2]) }
    const need = (Math.log(2 / p.delta) * (p.b - p.a) ** 2) / (2 * p.err ** 2)
    if (Math.abs(need - Math.round(need)) > 0.01) return p
  } while (true)
}

export function build({ p, eps, n, a, b, t, delta, err }: Params): LQInstance {
  const shell = 1 - (1 - eps) ** p
  const dist2 = p / 6
  const sigmaSum = ((b - a) * Math.sqrt(n)) / 2
  const hoeff = Math.exp((-2 * t * t) / (n * (b - a) ** 2))
  const need = Math.ceil((Math.log(2 / delta) * (b - a) ** 2) / (2 * err * err))

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'In dimension ' + tex('p=' + p) + ', what fraction of the volume of the unit ball lies within ' + tex(dec(eps)) + ' of the surface (radius between ' + tex(dec(1 - eps)) + ' and 1)?',
        answer: shell, tolerance: tol4, lecture: 1,
        explanation: 'Volume scales as ' + tex('r^p') + ', so the inner ball holds ' + tex(dec(1 - eps) + '^{' + p + '}=' + dec((1 - eps) ** p)) + ' and the shell ' + dec(shell) + '.',
      },
      {
        prompt: 'Two points are drawn independently and uniformly from the cube ' + tex('[0,1]^{' + p + '}') + '. Each coordinate difference has ' + tex('E(X_j-Y_j)^2=1/6') + '. Find ' + tex('E\\|X-Y\\|^2') + ' (3 decimal places).',
        answer: dist2, tolerance: tol3, lecture: 1,
        explanation: tex(p + '/6') + ' = ' + dec(dist2) + '.',
      },
      {
        prompt: 'Variables ' + tex('X_1,\\dots,X_{' + n + '}') + ' are independent with values in ' + tex('[' + a + ',' + b + ']') + ', hence sub-Gaussian with parameter ' + tex('\\sigma=(b-a)/2') + ' each. Find the sub-Gaussian parameter ' + tex('\\sqrt{\\sum\\sigma_i^2}') + ' of their centred sum (3 decimal places).',
        answer: sigmaSum, tolerance: tol3, lecture: 2,
        explanation: tex('\\sigma=' + dec((b - a) / 2) + ',\\ \\sqrt{' + n + '}\\cdot' + dec((b - a) / 2)) + ' = ' + dec(sigmaSum) + '.',
      },
      {
        prompt: 'For the same variables, Hoeffding\'s inequality gives ' + tex('P(S-ES\\ge t)\\le\\exp\\{-2t^2/(n(b-a)^2)\\}') + '. Evaluate the bound for ' + tex('t=' + t) + '.',
        answer: hoeff, tolerance: tol4, lecture: 3,
        explanation: tex('\\exp\\{-2\\cdot' + t * t + '/(' + n + '\\cdot' + (b - a) ** 2 + ')\\}') + ' = ' + dec(hoeff) + '.',
      },
      {
        prompt: 'Hoeffding also gives ' + tex('P(|\\bar X-E\\bar X|\\ge\\varepsilon)\\le2\\exp\\{-2n\\varepsilon^2/(b-a)^2\\}') + '. What is the smallest ' + tex('n') + ' that makes this at most ' + tex('\\delta=' + dec(delta)) + ' for ' + tex('\\varepsilon=' + dec(err)) + '? (Range ' + tex('b-a=' + (b - a)) + '.)',
        answer: need, tolerance: tolInt, lecture: 3,
        explanation: tex('n\\ge\\dfrac{(b-a)^2\\ln(2/\\delta)}{2\\varepsilon^2}=\\dfrac{' + (b - a) ** 2 + '\\cdot' + dec(Math.log(2 / delta)) + '}{' + dec(2 * err * err) + '}=' + dec((Math.log(2 / delta) * (b - a) ** 2) / (2 * err * err))) + ', rounded up to ' + need + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'hd-lq-a-concentration', generate: (rng) => build(sample(rng)) }
