// LQ-B: a minimisation LP with two ">=" constraints, solved by the two-phase simplex method: Phase I start, first pivot, optimal cost.
// Lectures 2 (pivoting, ratio test) and 3 (two-phase method).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { c: [number, number]; rows: { a: number; b: number; r: number }[] }

/** Corner points of {a x + b y >= r for both rows, x, y >= 0}. */
function corners(rows: Params['rows']): [number, number][] {
  const lines = [...rows.map((q) => [q.a, q.b, q.r]), [1, 0, 0], [0, 1, 0]]
  const out: [number, number][] = []
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const det = lines[i][0] * lines[j][1] - lines[j][0] * lines[i][1]
    if (Math.abs(det) < 1e-12) continue
    const x = (lines[i][2] * lines[j][1] - lines[j][2] * lines[i][1]) / det
    const y = (lines[i][0] * lines[j][2] - lines[j][0] * lines[i][2]) / det
    if (x >= -1e-9 && y >= -1e-9 && rows.every((q) => q.a * x + q.b * y >= q.r - 1e-9)) out.push([x, y])
  }
  return out
}

export function sample(rng: Rng): Params {
  for (;;) {
    const c: [number, number] = [rng.int(2, 9), rng.int(2, 9)]
    const rows = Array.from({ length: 2 }, () => ({ a: rng.int(1, 6), b: rng.int(1, 6), r: rng.int(8, 30) }))
    const sx = rows[0].a + rows[1].a, sy = rows[0].b + rows[1].b
    if (sx === sy) continue
    const j = sx > sy ? 0 : 1
    const rat = rows.map((q) => q.r / (j === 0 ? q.a : q.b))
    if (Math.abs(rat[0] - rat[1]) < 1e-9) continue
    const vals = corners(rows).map((p) => c[0] * p[0] + c[1] * p[1]).sort((u, v) => u - v)
    if (vals.length < 2 || vals[1] - vals[0] < 1e-6) continue
    return { c, rows }
  }
}

export function build({ c, rows }: Params): LQInstance {
  const w0 = rows[0].r + rows[1].r
  const sx = rows[0].a + rows[1].a, sy = rows[0].b + rows[1].b
  const j = sx > sy ? 1 : 2 // entering variable (largest column sum)
  const col = rows.map((q) => (j === 1 ? q.a : q.b))
  const ratios = rows.map((q, i) => q.r / col[i])
  const theta = Math.min(...ratios)
  const leave = ratios.indexOf(theta)
  const other = 1 - leave
  const w1 = w0 - theta * (j === 1 ? sx : sy)
  const cost = Math.min(...corners(rows).map((p) => c[0] * p[0] + c[1] * p[1]))
  const row = (q: Params['rows'][number], k: number) => tex(q.a + 'x_1+' + q.b + 'x_2-s_' + (k + 1) + '+t_' + (k + 1) + '=' + q.r)

  return {
    intro:
      'Minimise ' + tex('C=' + c[0] + 'x_1+' + c[1] + 'x_2') + ' subject to ' + tex(rows[0].a + 'x_1+' + rows[0].b + 'x_2\\ge ' + rows[0].r) + ', ' + tex(rows[1].a + 'x_1+' + rows[1].b + 'x_2\\ge ' + rows[1].r) + ' and ' + tex('x_1,x_2\\ge0') + '. Use surplus variables ' + tex('s_1,s_2') + ' and artificial variables ' + tex('t_1,t_2') + ', so the rows are ' + row(rows[0], 0) + ' and ' + row(rows[1], 1) + '. Phase I minimises ' + tex('w=t_1+t_2') + ' starting from the basis ' + tex('\\{t_1,t_2\\}') + '. In Phase I the variable with the most negative reduced cost enters. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the value of ' + tex('w') + ' at the starting basis of Phase I.',
        answer: w0, tolerance: tol3, lecture: 3,
        explanation: 'Both artificial variables equal the right-hand sides: ' + tex('w=' + rows[0].r + '+' + rows[1].r + '=' + w0) + '.',
      },
      {
        prompt: 'Which of ' + tex('x_1') + ' and ' + tex('x_2') + ' enters the basis in the first Phase I pivot? Enter 1 or 2.',
        answer: j, tolerance: tolInt, lecture: 2,
        explanation: 'The reduced cost of ' + tex('x_k') + ' in the ' + tex('w') + ' row is minus the sum of its column entries: ' + tex('-' + sx) + ' for ' + tex('x_1') + ' and ' + tex('-' + sy) + ' for ' + tex('x_2') + '. The more negative one is ' + tex('x_' + j) + '.',
      },
      {
        prompt: 'Find the minimum ratio ' + tex('\\theta') + ' of the first pivot, which is the value taken by the entering variable.',
        answer: theta, tolerance: tol3, lecture: 2,
        explanation: 'Ratios: ' + tex(ratios.map((r, i) => rows[i].r + '/' + col[i] + '=' + dec(r)).join(',\\ ')) + '. The smallest is ' + dec(theta) + ' (row ' + (leave + 1) + ' leaves).',
      },
      {
        prompt: 'Find the value of ' + tex('w') + ' after this first pivot.',
        answer: w1, tolerance: tol3, lecture: 3,
        explanation: tex('w=' + w0 + '-' + dec(theta) + '\\times' + (j === 1 ? sx : sy) + '=' + dec(w1)) + ', which is also the remaining artificial variable ' + tex('t_' + (other + 1) + '=' + rows[other].r + '-' + col[other] + '(' + dec(theta) + ')') + '.',
      },
      {
        prompt: 'Complete both phases. Find the minimum cost ' + tex('C^*') + '.',
        answer: cost, tolerance: tol3, lecture: 3,
        explanation: 'Phase II ends at the cheapest feasible corner of the region, with ' + tex('C^*=' + dec(cost)) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'opt-lq-b-twophase', generate: (rng) => build(sample(rng)) }
