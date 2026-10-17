// LQ-C: margins and hinge loss of a given linear classifier on six points, and the count of support vectors.
// Lecture 5 (support vector machines).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { w: number[]; b: number; pts: number[][]; y: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const w = [rng.int(1, 3), rng.int(1, 3)], b = rng.int(-4, 4)
    const pts = Array.from({ length: 6 }, () => [rng.int(-4, 4), rng.int(-4, 4)])
    const f = pts.map((p) => w[0] * p[0] + w[1] * p[1] + b)
    if (f.every((v) => v !== 0)) return { w, b, pts, y: f.map((v) => (v > 0 ? 1 : -1)) }
  }
}

export function build({ w, b, pts, y }: Params): LQInstance {
  const nrm = Math.hypot(w[0], w[1])
  const f = pts.map((p) => w[0] * p[0] + w[1] * p[1] + b)
  const fm = f.map((v, i) => y[i] * v)
  const hinge = fm.map((m) => Math.max(0, 1 - m))
  const sv = fm.filter((m) => m <= 1).length
  const idx = fm.indexOf(Math.min(...fm))

  return {
    intro:
      'A linear classifier ' + tex('f(x)=w^\\top x+b') + ' with ' + tex('w=(' + w.join(',') + ')') + ' and ' + tex('b=' + b) + ' labels a point by the sign of ' + tex('f') + '. Six training points with labels are ' + tex(pts.map((p, i) => '(' + p.join(',') + ')\\mapsto' + y[i]).join(',\\ ')) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The width of the margin (the distance between the lines ' + tex('f=\\pm1') + ') is ' + tex('2/\\|w\\|') + '. Find it.',
        answer: 2 / nrm, tolerance: tol4, lecture: 5,
        explanation: tex('\\|w\\|=\\sqrt{' + (w[0] ** 2 + w[1] ** 2) + '}=' + dec(nrm)) + ', so the width is ' + dec(2 / nrm) + '.',
      },
      {
        prompt: 'Find the functional margin ' + tex('y_if(x_i)') + ' of the first point.',
        answer: fm[0], tolerance: tol4, lecture: 5,
        explanation: tex('f(' + pts[0].join(',') + ')=' + f[0]) + ' and ' + tex('y_1=' + y[0]) + ', so the margin is ' + fm[0] + '.',
      },
      {
        prompt: 'Find the total hinge loss ' + tex('\\sum_i\\max(0,1-y_if(x_i))') + ' over the six points.',
        answer: hinge.reduce((a, v) => a + v, 0), tolerance: tol4, lecture: 5,
        explanation: 'Functional margins ' + tex(fm.join(',')) + ' give hinge losses ' + tex(hinge.join(',')) + ', total ' + hinge.reduce((a, v) => a + v, 0) + '.',
      },
      {
        prompt: 'How many points lie on or inside the margin (functional margin at most 1)? These are the points that matter for the SVM solution.',
        answer: sv, tolerance: tolInt, lecture: 5,
        explanation: 'Margins ' + tex(fm.join(',')) + ': ' + sv + ' of them are at most 1.',
      },
      {
        prompt: 'Find the geometric distance (to 4 decimal places) from the point with the smallest functional margin to the decision line, ' + tex('|f(x)|/\\|w\\|') + '.',
        answer: Math.abs(f[idx]) / nrm, tolerance: tol4, lecture: 5,
        explanation: 'The smallest margin is ' + fm[idx] + ' (point ' + tex('(' + pts[idx].join(',') + ')') + '), so the distance is ' + tex(Math.abs(f[idx]) + '/' + dec(nrm)) + ' = ' + dec(Math.abs(f[idx]) / nrm) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'ml-lq-c-svm', generate: (rng) => build(sample(rng)) }
