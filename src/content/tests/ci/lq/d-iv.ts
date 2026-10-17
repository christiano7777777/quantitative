// LQ-D: a binary instrument: reduced form, first stage, Wald estimate, first-stage F statistic, bias from an exclusion violation.
// Lecture 6 (instrumental variables).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { y1: number; y0: number; t1: number; t0: number; se: number; delta: number } // y in tenths, t in hundredths

export const wald = (y1: number, y0: number, t1: number, t0: number) => (y1 - y0) / (t1 - t0)

export function sample(rng: Rng): Params {
  const t0 = rng.int(10, 40), t1 = t0 + rng.int(15, 45)
  return { y1: rng.int(40, 120), y0: rng.int(10, 38), t1, t0, se: rng.pick([0.03, 0.05, 0.08, 0.1]), delta: rng.int(1, 8) / 10 }
}

export function build({ y1, y0, t1, t0, se, delta }: Params): LQInstance {
  const Y1 = y1 / 10, Y0 = y0 / 10, T1 = t1 / 100, T0 = t0 / 100
  const rf = Y1 - Y0, fs = T1 - T0
  const w = wald(Y1, Y0, T1, T0)
  const F = (fs / se) ** 2
  const bias = delta / fs

  return {
    intro:
      'A binary instrument ' + tex('Z') + ' (random encouragement) is used for a treatment ' + tex('T') + '. Among units with ' + tex('Z=1') + ' the mean outcome is ' + tex(dec(Y1)) + ' and ' + tex(dec(T1 * 100) + '\\%') + ' take the treatment; among units with ' + tex('Z=0') + ' the mean outcome is ' + tex(dec(Y0)) + ' and ' + tex(dec(T0 * 100) + '\\%') + ' take it. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the reduced form: the difference in mean outcomes between ' + tex('Z=1') + ' and ' + tex('Z=0') + '.',
        answer: rf, tolerance: tol4, lecture: 6,
        explanation: tex(dec(Y1) + '-' + dec(Y0)) + ' = ' + dec(rf) + '.',
      },
      {
        prompt: 'Find the first stage: the difference in treatment take-up between ' + tex('Z=1') + ' and ' + tex('Z=0') + ' (as a proportion). Under monotonicity this is the share of compliers.',
        answer: fs, tolerance: tol4, lecture: 6,
        explanation: tex(dec(T1) + '-' + dec(T0)) + ' = ' + dec(fs) + '.',
      },
      {
        prompt: 'Find the Wald (IV) estimate of the effect of the treatment: reduced form divided by first stage. It is the average effect for compliers.',
        answer: w, tolerance: tol4, lecture: 6,
        explanation: tex(dec(rf) + '/' + dec(fs)) + ' = ' + dec(w) + '.',
      },
      {
        prompt: 'The first-stage estimate has standard error ' + tex(dec(se)) + '. Find the first-stage ' + tex('F') + ' statistic ' + tex('(\\hat\\pi/\\mathrm{se})^2') + ' (3 decimal places). A value below 10 signals a weak instrument.',
        answer: F, tolerance: tol3, lecture: 6,
        explanation: tex('(' + dec(fs) + '/' + dec(se) + ')^2') + ' = ' + dec(F) + '.',
      },
      {
        prompt: 'Suppose the instrument also affects the outcome directly by ' + tex(dec(delta)) + ' (an exclusion violation). Then the reduced form contains this extra amount. By how much is the Wald estimate biased, ' + tex('\\delta/\\hat\\pi') + '?',
        answer: bias, tolerance: tol4, lecture: 6,
        explanation: tex('\\hat\\beta_{Wald}=\\beta+\\delta/\\pi=\\beta+' + dec(delta) + '/' + dec(fs)) + ': the bias is ' + dec(bias) + ', larger when the first stage is weaker.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'ci-lq-d-iv', generate: (rng) => build(sample(rng)) }
