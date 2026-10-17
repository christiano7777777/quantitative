// LQ-C: inverse probability weighting on six units: IPW, Hajek, largest weight, effective sample size, doubly robust estimator.
// Lecture 5 (propensity scores, IPW, doubly robust).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { e: number[]; t: number[]; y: number[]; m1: number[]; m0: number[] } // e in tenths... e/10, m in tenths

export const ipw = (T: number[], Y: number[], e: number[]) => T.reduce((a, t, i) => a + (t * Y[i]) / e[i] - ((1 - t) * Y[i]) / (1 - e[i]), 0) / T.length
export const hajek = (T: number[], Y: number[], e: number[]) => {
  const w1 = T.map((t, i) => t / e[i]), w0 = T.map((t, i) => (1 - t) / (1 - e[i]))
  const s = (w: number[]) => w.reduce((a, v) => a + v, 0)
  return Y.reduce((a, y, i) => a + w1[i] * y, 0) / s(w1) - Y.reduce((a, y, i) => a + w0[i] * y, 0) / s(w0)
}
export const aipw = (T: number[], Y: number[], e: number[], m1: number[], m0: number[]) =>
  T.reduce((a, t, i) => a + m1[i] - m0[i] + (t * (Y[i] - m1[i])) / e[i] - ((1 - t) * (Y[i] - m0[i])) / (1 - e[i]), 0) / T.length

export function sample(rng: Rng): Params {
  for (;;) {
    const t = Array.from({ length: 6 }, () => rng.int(0, 1))
    const k = t.reduce((a, b) => a + b, 0)
    if (k < 2 || k > 4) continue
    return { e: Array.from({ length: 6 }, () => rng.int(2, 8)), t, y: Array.from({ length: 6 }, () => rng.int(2, 20)), m1: Array.from({ length: 6 }, () => rng.int(40, 180)), m0: Array.from({ length: 6 }, () => rng.int(20, 140)) }
  }
}

export function build({ e, t, y, m1, m0 }: Params): LQInstance {
  const E = e.map((v) => v / 10), M1 = m1.map((v) => v / 10), M0 = m0.map((v) => v / 10)
  const w = t.map((ti, i) => (ti ? 1 / E[i] : 1 / (1 - E[i])))
  const a = ipw(t, y, E), b = hajek(t, y, E)
  const ess = w.reduce((s, v) => s + v, 0) ** 2 / w.reduce((s, v) => s + v * v, 0)
  const dr = aipw(t, y, E, M1, M0)
  const row = (name: string, v: number[]) => name + ': ' + v.join(', ')

  return {
    intro:
      'Six units have estimated propensity scores ' + tex(E.map(dec).join(',')) + ', treatment indicators ' + tex(t.join(',')) + ' and outcomes ' + tex(y.join(',')) + '. An outcome model predicts ' + tex('\\hat m_1=(' + M1.map(dec).join(',') + ')') + ' under treatment and ' + tex('\\hat m_0=(' + M0.map(dec).join(',') + ')') + ' under control. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the IPW estimate of the ATE, ' + tex('\\frac1n\\sum\\{T_iY_i/e_i-(1-T_i)Y_i/(1-e_i)\\}') + '.',
        answer: a, tolerance: tol4, lecture: 5,
        explanation: 'Treated units contribute ' + tex('Y_i/e_i') + ' and controls ' + tex('-Y_i/(1-e_i)') + '; the average of the six terms is ' + dec(a) + '.',
      },
      {
        prompt: 'Find the Hajek (normalised) IPW estimate: the weighted mean of treated outcomes with weights ' + tex('1/e_i') + ' minus the weighted mean of control outcomes with weights ' + tex('1/(1-e_i)') + ', each weighted mean divided by its sum of weights.',
        answer: b, tolerance: tol4, lecture: 5,
        explanation: 'Weights are ' + tex(w.map(dec).join(',')) + '; normalising each group by its own weight sum gives ' + dec(b) + '.',
      },
      {
        prompt: 'Find the largest inverse-probability weight used (weight ' + tex('1/e_i') + ' for treated, ' + tex('1/(1-e_i)') + ' for controls).',
        answer: Math.max(...w), tolerance: tol3, lecture: 5,
        explanation: 'The weights are ' + tex(w.map(dec).join(',')) + ', with maximum ' + dec(Math.max(...w)) + '. Large weights signal poor overlap.',
      },
      {
        prompt: 'Find the effective sample size of the weights, ' + tex('(\\sum w_i)^2/\\sum w_i^2') + ' (3 decimal places). It is smaller than 6 when weights are unequal.',
        answer: ess, tolerance: tol3, lecture: 5,
        explanation: tex('(\\sum w_i)^2=' + dec(w.reduce((s, v) => s + v, 0) ** 2) + ',\\ \\sum w_i^2=' + dec(w.reduce((s, v) => s + v * v, 0))) + ', giving ' + dec(ess) + '.',
      },
      {
        prompt: 'Find the doubly robust (augmented IPW) estimate ' + tex('\\frac1n\\sum\\{\\hat m_1-\\hat m_0+T(Y-\\hat m_1)/e-(1-T)(Y-\\hat m_0)/(1-e)\\}') + '.',
        answer: dr, tolerance: tol4, lecture: 5,
        explanation: 'Each unit contributes the model effect plus a weighted residual correction; the average is ' + dec(dr) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'ci-lq-c-ipw', generate: (rng) => build(sample(rng)) }
