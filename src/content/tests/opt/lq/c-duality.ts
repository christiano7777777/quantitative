// LQ-C: shadow prices (dual optimum), strong duality, and allowable ranges for a right-hand side and a cost coefficient.
// Lectures 4 (duality) and 5 (sensitivity analysis).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { A: [[number, number], [number, number]]; b: [number, number]; c: [number, number] }

export function sample(rng: Rng): Params {
  for (;;) {
    const A: Params['A'] = [[rng.int(1, 5), rng.int(1, 5)], [rng.int(1, 5), rng.int(1, 5)]]
    const b: [number, number] = [rng.int(12, 40), rng.int(12, 40)]
    const c: [number, number] = [rng.int(1, 8), rng.int(1, 8)]
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
    if (det === 0) continue
    const x = [(b[0] * A[1][1] - A[0][1] * b[1]) / det, (A[0][0] * b[1] - A[1][0] * b[0]) / det]
    // dual: A^T y = c
    const y = [(c[0] * A[1][1] - A[1][0] * c[1]) / det, (A[0][0] * c[1] - A[0][1] * c[0]) / det]
    if (x.some((v) => v < 0.5) || y.some((v) => v < 0.1)) continue
    const d = [A[1][1] / det, -A[1][0] / det] // d(x)/d(b1) = first column of A^{-1}
    const neg = d.map((v, i) => (v < -1e-12 ? x[i] / -v : Infinity))
    if (Math.min(...neg) > 1e6 || Math.min(...neg) < 0.5) continue
    return { A, b, c }
  }
}

export function build({ A, b, c }: Params): LQInstance {
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
  const x = [(b[0] * A[1][1] - A[0][1] * b[1]) / det, (A[0][0] * b[1] - A[1][0] * b[0]) / det]
  const y = [(c[0] * A[1][1] - A[1][0] * c[1]) / det, (A[0][0] * c[1] - A[0][1] * c[0]) / det]
  const z = c[0] * x[0] + c[1] * x[1]
  const d = [A[1][1] / det, -A[1][0] / det]
  const room = Math.min(...d.map((v, i) => (v < -1e-12 ? x[i] / -v : Infinity)))
  const b1max = b[0] + room
  const ratios = [A[0][0] / A[0][1], A[1][0] / A[1][1]]
  const c1max = c[1] * Math.max(...ratios)
  const cons = A.map((r, i) => tex(r[0] + 'x_1+' + r[1] + 'x_2\\le ' + b[i]))

  return {
    intro:
      'Consider the LP: maximise ' + tex('z=' + c[0] + 'x_1+' + c[1] + 'x_2') + ' subject to ' + cons[0] + ' (constraint 1), ' + cons[1] + ' (constraint 2) and ' + tex('x_1,x_2\\ge0') + '. Its optimal solution has ' + tex('x_1,x_2>0') + ' with both constraints binding. Let ' + tex('y_1,y_2') + ' be the dual variables (shadow prices). Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'The dual is: minimise ' + tex(b[0] + 'y_1+' + b[1] + 'y_2') + ' subject to ' + tex(A[0][0] + 'y_1+' + A[1][0] + 'y_2\\ge ' + c[0]) + ', ' + tex(A[0][1] + 'y_1+' + A[1][1] + 'y_2\\ge ' + c[1]) + ', ' + tex('y\\ge0') + '. Both primal variables are positive, so both dual constraints hold with equality. Find ' + tex('y_1') + ', the shadow price of constraint 1.',
        answer: y[0], tolerance: tol3, lecture: 4,
        explanation: 'Solve ' + tex(A[0][0] + 'y_1+' + A[1][0] + 'y_2=' + c[0]) + ' and ' + tex(A[0][1] + 'y_1+' + A[1][1] + 'y_2=' + c[1]) + ' (complementary slackness): ' + tex('y_1=' + dec(y[0]) + ',\\ y_2=' + dec(y[1])) + '.',
      },
      {
        prompt: 'Find ' + tex('y_2') + ', the shadow price of constraint 2.',
        answer: y[1], tolerance: tol3, lecture: 4,
        explanation: 'From the same two equations, ' + tex('y_2=' + dec(y[1])) + '.',
      },
      {
        prompt: 'Find the optimal value ' + tex('z^*') + ' of the primal, which by strong duality equals the dual objective at the optimum.',
        answer: z, tolerance: tol3, lecture: 4,
        explanation: tex(b[0] + '(' + dec(y[0]) + ')+' + b[1] + '(' + dec(y[1]) + ')=' + dec(z)) + '; the primal point ' + tex('x=(' + dec(x[0]) + ',' + dec(x[1]) + ')') + ' gives the same value.',
      },
      {
        prompt: 'The right-hand side ' + tex('b_1') + ' of constraint 1 is allowed to vary. Up to what value of ' + tex('b_1') + ' does the current optimal basis stay feasible (so that the shadow price ' + tex('y_1') + ' stays valid)?',
        answer: b1max, tolerance: tol3, lecture: 5,
        explanation: 'With ' + tex('b_1') + ' changing, the basic variables move at rates ' + tex('(' + dec(d[0]) + ',' + dec(d[1]) + ')') + ' per unit. The first to reach zero does so after an increase of ' + dec(room) + ', so ' + tex('b_1\\le' + dec(b1max)) + '.',
      },
      {
        prompt: 'The coefficient ' + tex('c_1') + ' of ' + tex('x_1') + ' is allowed to vary while ' + tex('c_2=' + c[1]) + ' stays fixed. Up to what value of ' + tex('c_1') + ' does the current vertex stay optimal?',
        answer: c1max, tolerance: tol3, lecture: 5,
        explanation: 'The vertex stays optimal while ' + tex('c') + ' lies between the constraint normals, i.e. ' + tex('c_1/c_2') + ' is at most the larger of ' + tex(dec(ratios[0]) + ',\\ ' + dec(ratios[1])) + '. Hence ' + tex('c_1\\le ' + c[1] + '\\times' + dec(Math.max(...ratios)) + '=' + dec(c1max)) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'opt-lq-c-duality', generate: (rng) => build(sample(rng)) }
