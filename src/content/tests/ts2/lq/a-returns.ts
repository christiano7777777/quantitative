// LQ-A: sample moments of a short return series (variance, kurtosis) and an ARCH(1) model (conditional, unconditional variance, kurtosis).
// Lectures 1 (stylised facts of returns, sample moments) and 2 (ARCH models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { tenths: number[]; omega: number; alpha: number }

export function sample(rng: Rng): Params {
  let tenths: number[]
  do tenths = Array.from({ length: 8 }, () => rng.int(-30, 30))
  while (new Set(tenths).size < 4)
  return { tenths, omega: rng.pick([0.1, 0.2, 0.3]), alpha: rng.pick([0.1, 0.2, 0.3]) }
}

export function build({ tenths, omega, alpha }: Params): LQInstance {
  const r = tenths.map((t) => t / 10)
  const n = r.length
  const mean = r.reduce((a, v) => a + v, 0) / n
  const s2 = r.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)
  const m2 = r.reduce((a, v) => a + (v - mean) ** 2, 0) / n
  const m4 = r.reduce((a, v) => a + (v - mean) ** 4, 0) / n
  const kurt = m4 / (m2 * m2)
  const last = r[n - 1]
  const cond = omega + alpha * last * last
  const uncond = omega / (1 - alpha)
  const arch4 = (3 * (1 - alpha * alpha)) / (1 - 3 * alpha * alpha)

  return {
    intro: 'Eight daily returns (in per cent) are ' + r.map(dec).join(', ') + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the sample variance with divisor ' + tex('n-1') + '.',
        answer: s2, tolerance: tol3, lecture: 1,
        explanation: tex('\\bar r=' + dec(mean)) + ' and ' + tex('\\sum(r_i-\\bar r)^2/7') + ' = ' + dec(s2) + '.',
      },
      {
        prompt: 'Find the sample kurtosis ' + tex('m_4/m_2^2') + ', where ' + tex('m_k=\\frac1n\\sum(r_i-\\bar r)^k') + ' (a normal distribution has kurtosis 3).',
        answer: kurt, tolerance: tol3, lecture: 1,
        explanation: tex('m_2=' + dec(m2) + ',\\ m_4=' + dec(m4)) + ', so the kurtosis is ' + dec(kurt) + '.',
      },
      {
        prompt: 'An ARCH(1) model has ' + tex('\\sigma_t^2=' + dec(omega) + '+' + dec(alpha) + '\\varepsilon_{t-1}^2') + '. The last return above, ' + tex('\\varepsilon_8=' + dec(last)) + ', is the shock at time 8. Find the conditional variance ' + tex('\\sigma_9^2') + '.',
        answer: cond, tolerance: tol3, lecture: 2,
        explanation: tex('\\sigma_9^2=' + dec(omega) + '+' + dec(alpha) + '\\cdot' + dec(last) + '^2') + ' = ' + dec(cond) + '.',
      },
      {
        prompt: 'Find the unconditional variance ' + tex('\\omega/(1-\\alpha)') + ' of this ARCH(1) process.',
        answer: uncond, tolerance: tol3, lecture: 2,
        explanation: tex(dec(omega) + '/(1-' + dec(alpha) + ')') + ' = ' + dec(uncond) + '.',
      },
      {
        prompt: 'With normal innovations the kurtosis of an ARCH(1) process is ' + tex('3(1-\\alpha^2)/(1-3\\alpha^2)') + '. Evaluate it for this ' + tex('\\alpha') + '.',
        answer: arch4, tolerance: tol3, lecture: 2,
        explanation: tex('3(1-' + dec(alpha * alpha) + ')/(1-' + dec(3 * alpha * alpha) + ')') + ' = ' + dec(arch4) + ', above 3 even with normal innovations.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'ts2-lq-a-returns', generate: (rng) => build(sample(rng)) }
