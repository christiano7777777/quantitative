// LQ-E: an integer program with two constraints: LP relaxation, one branch-and-bound step, a Gomory cut coefficient, the integer optimum.
// Lectures 7 (branch-and-bound) and 8 (cutting planes, bound comparison).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'
import { fracRat, lpMax } from '../lp2'
import type { Con } from '../lp2'

export interface Params { c: [number, number]; A: [[number, number], [number, number]]; r: [number, number] }

function relax(p: Params) {
  const { A, r, c } = p
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
  const x = [(r[0] * A[1][1] - A[0][1] * r[1]) / det, (A[0][0] * r[1] - A[1][0] * r[0]) / det]
  const y = [(c[0] * A[1][1] - A[1][0] * c[1]) / det, (A[0][0] * c[1] - A[0][1] * c[0]) / det]
  return { det, x, y }
}

export function sample(rng: Rng): Params {
  for (;;) {
    const A: Params['A'] = [[rng.int(1, 7), rng.int(1, 7)], [rng.int(1, 7), rng.int(1, 7)]]
    const r: [number, number] = [rng.int(15, 60), rng.int(15, 60)]
    const c: [number, number] = [rng.int(2, 9), rng.int(2, 9)]
    const p = { c, A, r }
    const { det, x, y } = relax(p)
    if (det === 0 || x.some((v) => v < 0.5) || y.some((v) => v < 0.05)) continue
    const f1 = fracRat(r[0] * A[1][1] - A[0][1] * r[1], det)
    if (f1 < 0.15 || f1 > 0.85) continue
    if (fracRat(A[1][1], det) === 0) continue
    // the integer optimum must be strictly below the relaxation
    const z0 = c[0] * x[0] + c[1] * x[1]
    if (z0 - bestInt(p) < 0.2) continue
    return p
  }
}

function bestInt({ c, A, r }: Params): number {
  let best = -Infinity
  for (let x1 = 0; x1 <= 60; x1++) {
    const room = [(r[0] - A[0][0] * x1) / A[0][1], (r[1] - A[1][0] * x1) / A[1][1]]
    const x2 = Math.floor(Math.min(...room) + 1e-9)
    if (x2 < 0) continue
    best = Math.max(best, c[0] * x1 + c[1] * x2)
  }
  return best
}

export function build(p: Params): LQInstance {
  const { c, A, r } = p
  const { det, x, y } = relax(p)
  const z0 = c[0] * x[0] + c[1] * x[1]
  const k = Math.floor(x[0])
  const cons: Con[] = [{ a: A[0], r: r[0] }, { a: A[1], r: r[1] }, { a: [1, 0], r: k }]
  const zDown = lpMax(c, cons).value
  const g1 = A[1][1] / det, g2 = -A[0][1] / det
  const beta = x[0]
  const f1 = fracRat(A[1][1], det), f2 = fracRat(-A[0][1], det), f0 = fracRat(r[0] * A[1][1] - A[0][1] * r[1], det)
  const zi = bestInt(p)
  const ct = (j: number) => tex(A[j][0] + 'x_1+' + A[j][1] + 'x_2\\le ' + r[j])

  return {
    intro:
      'Consider the integer program: maximise ' + tex('z=' + c[0] + 'x_1+' + c[1] + 'x_2') + ' subject to ' + ct(0) + ', ' + ct(1) + ' and ' + tex('x_1,x_2\\ge0') + ' integer. Add slack variables ' + tex('s_1,s_2') + '. The LP relaxation (integrality dropped) is optimal where both constraints are binding. Give answers to 3 decimal places, except the last.',
    parts: [
      {
        prompt: 'Find the optimal value ' + tex('z_0') + ' of the LP relaxation.',
        answer: z0, tolerance: tol3, lecture: 7,
        explanation: 'Solving the two binding constraints gives ' + tex('x=(' + dec(x[0]) + ',' + dec(x[1]) + ')') + ' and ' + tex('z_0=' + dec(z0)) + '.',
      },
      {
        prompt: 'The relaxation has ' + tex('x_1') + ' fractional. Find its value ' + tex('x_1^{LP}') + '.',
        answer: x[0], tolerance: tol3, lecture: 7,
        explanation: tex('x_1^{LP}=' + dec(x[0])) + ', so branch-and-bound splits on ' + tex('x_1\\le' + k) + ' and ' + tex('x_1\\ge' + (k + 1)) + '.',
      },
      {
        prompt: 'Branch with the extra constraint ' + tex('x_1\\le' + k) + ' (integrality still ignored). Find the LP bound of this branch.',
        answer: zDown, tolerance: tol3, lecture: 7,
        explanation: 'Re-solving the LP with ' + tex('x_1\\le' + k) + ' gives the bound ' + dec(zDown) + ', which is at most ' + dec(z0) + '.',
      },
      {
        prompt: 'In the optimal tableau of the relaxation the row of ' + tex('x_1') + ' reads ' + tex('x_1+g_1s_1+g_2s_2=\\beta') + '. The Gomory fractional cut is ' + tex('f(g_1)s_1+f(g_2)s_2\\ge f(\\beta)') + ' with ' + tex('f(t)=t-\\lfloor t\\rfloor') + '. Find the cut coefficient ' + tex('f(g_1)') + '.',
        answer: f1, tolerance: tol3, lecture: 8,
        explanation: 'Inverting the basis matrix gives ' + tex('g_1=' + dec(g1) + ',\\ g_2=' + dec(g2) + ',\\ \\beta=' + dec(beta)) + '. Then ' + tex('f(g_1)=' + dec(f1) + ',\\ f(g_2)=' + dec(f2) + ',\\ f(\\beta)=' + dec(f0)) + ', so the cut is ' + tex(dec(f1) + 's_1+' + dec(f2) + 's_2\\ge ' + dec(f0)) + ' (violated at the LP optimum where ' + tex('s_1=s_2=0') + ').',
      },
      {
        prompt: 'Find the optimal value of the integer program (a whole number).',
        answer: zi, tolerance: tolInt, lecture: 7,
        explanation: 'Checking the integer points near the relaxation optimum, the best feasible one has ' + tex('z=' + zi) + ', below the bound ' + dec(z0) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'opt-lq-e-integer', generate: (rng) => build(sample(rng)) }
