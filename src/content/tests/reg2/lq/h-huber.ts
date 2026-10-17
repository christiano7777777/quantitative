// LQ-H: location estimation with an outlier: median, MAD scale, Huber weights, one IRLS step, Huber loss.
// Lecture 11 (robust regression, M-estimators, Huber loss).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { data: number[]; k: number }

export const huberRho = (r: number, k: number) => (Math.abs(r) <= k ? r * r / 2 : k * Math.abs(r) - k * k / 2)
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2 }

export function sample(rng: Rng): Params {
  for (;;) {
    const c = rng.int(8, 14)
    const clean = Array.from({ length: 6 }, () => c + rng.int(-3, 3))
    const outlier = c + rng.pick([-1, 1]) * rng.int(12, 25)
    const data = rng.shuffle([...clean, outlier])
    const med = median(data)
    if (median(data.map((v) => Math.abs(v - med))) > 0) return { data, k: rng.pick([1, 1.345, 1.5]) }
  }
}

export function build({ data, k }: Params): LQInstance {
  const n = data.length
  const med = median(data)
  const mad = median(data.map((v) => Math.abs(v - med)))
  const s = mad / 0.6745
  const out = data.reduce((a, v) => (Math.abs(v - med) > Math.abs(a - med) ? v : a))
  const rOut = (out - med) / s
  const wOut = Math.min(1, k / Math.abs(rOut))
  const w = data.map((v) => Math.min(1, k / Math.max(Math.abs((v - med) / s), 1e-12)))
  const step = data.reduce((a, v, i) => a + w[i] * v, 0) / w.reduce((a, v) => a + v, 0)
  const rho = huberRho(rOut, k)

  return {
    intro:
      'Seven measurements of a quantity are ' + data.join(', ') + '. Fit a location parameter by Huber\'s method with threshold ' + tex('k=' + dec(k)) + ' on the scaled residuals ' + tex('r_i=(x_i-m)/s') + ', where ' + tex('m') + ' is the current estimate and the scale is ' + tex('s=\\mathrm{MAD}/0.6745') +
      ' with ' + tex('\\mathrm{MAD}=\\operatorname{median}|x_i-\\operatorname{median}(x)|') + '. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the sample median, the starting value of the iteration.',
        answer: med, tolerance: tol3, lecture: 11,
        explanation: 'Sorted data have middle value ' + dec(med) + '.',
      },
      {
        prompt: 'Find the robust scale ' + tex('s=\\mathrm{MAD}/0.6745') + '.',
        answer: s, tolerance: tol3, lecture: 11,
        explanation: 'The absolute deviations from ' + dec(med) + ' have median ' + dec(mad) + ', so ' + tex('s=' + dec(mad) + '/0.6745') + ' = ' + dec(s) + '.',
      },
      {
        prompt: 'The most extreme observation is ' + tex(out) + '. Find its Huber weight ' + tex('w=\\min(1,k/|r|)') + ' at the starting value ' + tex('m=' + dec(med)) + ' (4 decimal places).',
        answer: wOut, tolerance: tol4, lecture: 11,
        explanation: tex('r=(' + out + '-' + dec(med) + ')/' + dec(s) + '=' + dec(rOut)) + ', so ' + tex('w=\\min(1,' + dec(k) + '/' + dec(Math.abs(rOut)) + ')') + ' = ' + dec(wOut) + '.',
      },
      {
        prompt: 'Perform one iteratively reweighted step from ' + tex('m=' + dec(med)) + ': compute every weight ' + tex('w_i=\\min(1,k/|r_i|)') + ' and take the weighted mean ' + tex('\\sum w_ix_i/\\sum w_i') + '.',
        answer: step, tolerance: tol3, lecture: 11,
        explanation: 'Observations with ' + tex('|r_i|\\le' + dec(k)) + ' keep weight 1 and the others are down-weighted. The weighted mean is ' + dec(step) + ', compared with the sample mean ' + dec(data.reduce((a, v) => a + v, 0) / n) + '.',
      },
      {
        prompt: 'Find the Huber loss ' + tex('\\rho_k(r)') + ' (quadratic ' + tex('r^2/2') + ' for ' + tex('|r|\\le k') + ', and ' + tex('k|r|-k^2/2') + ' otherwise) at the scaled residual of the most extreme observation.',
        answer: rho, tolerance: tol3, lecture: 11,
        explanation: tex('|r|=' + dec(Math.abs(rOut)) + (Math.abs(rOut) > k ? '>' : '\\le') + dec(k)) + ', so ' + tex('\\rho=' + (Math.abs(rOut) > k ? dec(k) + '\\cdot' + dec(Math.abs(rOut)) + '-' + dec(k) + '^2/2' : 'r^2/2')) + ' = ' + dec(rho) + '. Least squares would charge ' + dec(rOut * rOut / 2) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'reg2-lq-h-huber', generate: (rng) => build(sample(rng)) }
