// LQ-A: a two-variable maximisation LP with three constraints: optimal vertex, slack, corner points (basic feasible solutions).
// Lectures 1 (LP models, graphical method) and 2 (basic feasible solutions).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'
import { lpVertices, tightCount } from '../lp2'
import type { Con, Pt } from '../lp2'

export interface Params { c: [number, number]; cons: Con[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const c: [number, number] = [rng.int(1, 6), rng.int(1, 6)]
    const cons: Con[] = Array.from({ length: 3 }, () => ({ a: [rng.int(1, 6), rng.int(1, 6)] as [number, number], r: rng.int(12, 48) }))
    const vs = lpVertices(cons)
    if (vs.length !== 5) continue
    if (vs.some((p) => tightCount(cons, p) > 2)) continue
    const vals = vs.map((p) => c[0] * p[0] + c[1] * p[1]).sort((a, b) => b - a)
    if (vals[0] - vals[1] < 1e-6) continue
    const best = vs.find((p) => c[0] * p[0] + c[1] * p[1] === vals[0])!
    if (best[0] < 1e-6 || best[1] < 1e-6) continue
    return { c, cons }
  }
}

const pt = (p: Pt) => '(' + dec(p[0]) + ',' + dec(p[1]) + ')'
const con = (k: Con) => k.a[0] + 'x+' + k.a[1] + 'y\\le ' + k.r

export function build({ c, cons }: Params): LQInstance {
  const vs = lpVertices(cons)
  const val = (p: Pt) => c[0] * p[0] + c[1] * p[1]
  const sorted = [...vs].sort((p, q) => val(q) - val(p))
  const best = sorted[0]
  const slacks = cons.map((k) => k.r - k.a[0] * best[0] - k.a[1] * best[1])
  const free = slacks.findIndex((s) => s > 1e-6)

  return {
    intro:
      'A firm makes two products in quantities ' + tex('x') + ' and ' + tex('y') + ' and wants to maximise the profit ' + tex('z=' + c[0] + 'x+' + c[1] + 'y') + ' subject to ' + tex(con(cons[0])) + ', ' + tex(con(cons[1])) + ', ' + tex(con(cons[2])) + ' and ' + tex('x,y\\ge0') + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the maximum profit ' + tex('z^*') + '.',
        answer: val(best), tolerance: tol3, lecture: 1,
        explanation: 'Corner points and profits: ' + sorted.map((p) => tex(pt(p)) + ' gives ' + dec(val(p))).join('; ') + '. The largest is ' + dec(val(best)) + ' at ' + tex(pt(best)) + '.',
      },
      {
        prompt: 'Find the value of ' + tex('x') + ' at the optimal corner.',
        answer: best[0], tolerance: tol3, lecture: 1,
        explanation: 'The optimal corner is ' + tex(pt(best)) + ', the intersection of the two binding constraints, so ' + tex('x=' + dec(best[0])) + '.',
      },
      {
        prompt: 'Add a slack variable to each constraint. How many basic feasible solutions does the resulting system have? (Each corresponds to a corner of the feasible region, the origin included.)',
        answer: vs.length, tolerance: tolInt, lecture: 2,
        explanation: 'The feasible region has the corners ' + sorted.map((p) => tex(pt(p))).join(', ') + ': ' + vs.length + ' in total, one basic feasible solution each.',
      },
      {
        prompt: 'Exactly one of the three constraints is not binding at the optimal corner. Find its slack there.',
        answer: slacks[free], tolerance: tol3, lecture: 2,
        explanation: 'Constraint ' + (free + 1) + ' is the non-binding one: ' + tex(cons[free].r + '-' + cons[free].a[0] + '(' + dec(best[0]) + ')-' + cons[free].a[1] + '(' + dec(best[1]) + ')=' + dec(slacks[free])) + '.',
      },
      {
        prompt: 'Evaluate the profit at every corner point. Find the second largest of these values.',
        answer: val(sorted[1]), tolerance: tol3, lecture: 1,
        explanation: 'Sorted profits: ' + sorted.map((p) => dec(val(p))).join(', ') + '. The second largest is ' + dec(val(sorted[1])) + ' at ' + tex(pt(sorted[1])) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'opt-lq-a-graphical', generate: (rng) => build(sample(rng)) }
