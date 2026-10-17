// LQ-H: a transient-impact (propagator) model with exponential kernel: displacement, decay, cost of a schedule, permanent comparison, calibration of the decay rate.
// Lectures 9 (impact and alpha, propagator) and 10 (estimation, calibration of the kernel).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { g: number; rho: number; gaps: number[]; q: number[]; w: number; ta: number; tb: number; rhoTrue: number; i0: number }

export function sample(rng: Rng): Params {
  const ta = rng.pick([0.5, 1]), tb = ta + rng.pick([1, 2])
  return {
    g: rng.pick([0.1, 0.2, 0.5]), rho: rng.pick([0.5, 1, 2]), gaps: [rng.pick([0.5, 1, 2]), rng.pick([0.5, 1, 2])], q: [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)],
    w: rng.pick([0.5, 1, 2]), ta, tb, rhoTrue: rng.pick([0.4, 0.6, 0.8, 1.2]), i0: rng.pick([0.6, 0.8, 1, 1.5]),
  }
}

export function build({ g, rho, gaps, q, w, ta, tb, rhoTrue, i0 }: Params): LQInstance {
  const t = [0, gaps[0], gaps[0] + gaps[1]]
  const disp = g * (q[2] + q[1] * Math.exp(-rho * gaps[1]) + q[0] * Math.exp(-rho * (gaps[0] + gaps[1])))
  const later = disp * Math.exp(-rho * w)
  const before = [0, g * q[0] * Math.exp(-rho * gaps[0]), g * (q[0] * Math.exp(-rho * (gaps[0] + gaps[1])) + q[1] * Math.exp(-rho * gaps[1]))]
  const cost = q.reduce((a, qi, i) => a + qi * (before[i] + (g * qi) / 2), 0)
  const Q = q[0] + q[1] + q[2]
  const perm = (g * Q * Q) / 2
  const ia = Math.round(i0 * Math.exp(-rhoTrue * ta) * 1000) / 1000, ib = Math.round(i0 * Math.exp(-rhoTrue * tb) * 1000) / 1000
  const rhoHat = Math.log(ia / ib) / (tb - ta)

  return {
    intro:
      'A propagator model has price displacement ' + tex('I(t)=\\sum_{t_i\\le t}G(t-t_i)\\,q_i') + ' with kernel ' + tex('G(\\tau)=g\\,e^{-\\rho\\tau}') + ', ' + tex('g=' + dec(g) + ',\\ \\rho=' + dec(rho)) +
      ' (price units per thousand shares, time in minutes). A trader buys ' + tex(q[0]) + ', ' + tex(q[1]) + ' and ' + tex(q[2]) + ' thousand shares at times ' + tex('0,\\ ' + dec(t[1]) + ',\\ ' + dec(t[2])) +
      '. A trade pays the displacement just before it plus half of its own impact ' + tex('\\tfrac12 g q_i') + '. Give answers to 3 decimal places (the last to 4) and do not round intermediate values.',
    parts: [
      {
        prompt: 'Find the displacement ' + tex('I') + ' just after the third trade.',
        answer: disp, tolerance: tol3, lecture: 9,
        explanation: tex(dec(g) + '\\bigl(' + q[2] + '+' + q[1] + 'e^{-' + dec(rho * gaps[1]) + '}+' + q[0] + 'e^{-' + dec(rho * t[2]) + '}\\bigr)=' + dec(disp)) + '.',
      },
      {
        prompt: 'No further trading occurs. Find the displacement ' + tex(dec(w)) + ' minutes after the third trade.',
        answer: later, tolerance: tol3, lecture: 9,
        explanation: 'Impact decays exponentially: ' + tex(dec(disp) + '\\times e^{-' + dec(rho * w) + '}=' + dec(later)) + '.',
      },
      {
        prompt: 'Find the total execution cost ' + tex('\\sum_i q_i\\bigl(I(t_i^-)+\\tfrac12 g q_i\\bigr)') + ' of the three trades.',
        answer: cost, tolerance: tol3, lecture: 9,
        explanation: 'The displacements just before the trades are ' + tex('0,\\ ' + dec(before[1]) + ',\\ ' + dec(before[2])) + ', so the cost is ' + tex(dec(cost)) + '.',
      },
      {
        prompt: 'If instead the impact were permanent (' + tex('\\rho=0') + '), the same cost formula gives ' + tex('\\tfrac12 gQ^2') + ' for total size ' + tex('Q') + '. Evaluate it for these three trades.',
        answer: perm, tolerance: tol3, lecture: 9,
        explanation: tex('Q=' + Q + ',\\ \\tfrac12\\cdot' + dec(g) + '\\cdot' + Q * Q + '=' + dec(perm)) + '. Decay makes the cost of the same trades lower, here ' + tex(dec(perm - cost)) + ' less.',
      },
      {
        prompt: 'Calibration: after a single trade the displacement was measured as ' + tex(dec(ia)) + ' at time ' + tex(dec(ta)) + ' and ' + tex(dec(ib)) + ' at time ' + tex(dec(tb)) + ' after the trade. Estimate the decay rate ' + tex('\\rho=\\ln(I_a/I_b)/(t_b-t_a)') + ' (4 decimal places).',
        answer: rhoHat, tolerance: tol4, lecture: 10,
        explanation: tex('\\ln(' + dec(ia) + '/' + dec(ib) + ')/(' + dec(tb - ta) + ')=' + dec(rhoHat)) + '. The log of an exponential decay is linear in time.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'ms2-lq-h-propagator', generate: (rng) => build(sample(rng)) }
