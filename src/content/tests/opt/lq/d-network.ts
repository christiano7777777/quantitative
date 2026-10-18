// LQ-D: a maximum-flow network (cut capacity, max flow, capacity increase) and a foreign-exchange arbitrage cycle.
// Lecture 6 (network flows and applications).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { tex, tol2, tol4, tolInt } from '../../../shared/format'

export const NODES = ['s', 'a', 'b', 'c', 'd', 't']
export const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 5]]

export interface Params { cap: number[]; inS: boolean[]; raise: number; rates: [number, number, number] }

/** Edmonds-Karp maximum flow (breadth-first augmenting paths). */
export function maxFlow(cap: number[]): number {
  const n = NODES.length
  const res = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  EDGES.forEach(([u, v], i) => { res[u][v] += cap[i] })
  let flow = 0
  for (;;) {
    const prev = new Array<number>(n).fill(-1)
    prev[0] = 0
    const queue = [0]
    for (let h = 0; h < queue.length && prev[n - 1] < 0; h++) {
      for (let v = 0; v < n; v++) if (prev[v] < 0 && res[queue[h]][v] > 0) { prev[v] = queue[h]; queue.push(v) }
    }
    if (prev[n - 1] < 0) return flow
    let bott = Infinity
    for (let v = n - 1; v !== 0; v = prev[v]) bott = Math.min(bott, res[prev[v]][v])
    for (let v = n - 1; v !== 0; v = prev[v]) { res[prev[v]][v] -= bott; res[v][prev[v]] += bott }
    flow += bott
  }
}

export function sample(rng: Rng): Params {
  for (;;) {
    const cap = EDGES.map(() => rng.int(3, 14))
    const raise = rng.int(0, EDGES.length - 1)
    const raised = cap.map((v, i) => (i === raise ? v + 4 : v))
    if (maxFlow(raised) === maxFlow(cap)) continue
    const inS = [true, rng.next() < 0.5, rng.next() < 0.5, rng.next() < 0.5, rng.next() < 0.5, false]
    if (inS.slice(1, 5).every((v) => !v)) continue
    const r1 = rng.int(800, 1600) / 1000, r2 = rng.int(800, 1600) / 1000
    const target = rng.int(102, 110) / 100
    const r3 = Math.round((target / (r1 * r2)) * 1000) / 1000
    const prod = r1 * r2 * r3
    if (prod < 1.01 || prod > 1.15 || r3 < 0.5 || r3 > 2) continue
    return { cap, inS, raise, rates: [r1, r2, r3] }
  }
}

export function build({ cap, inS, raise, rates }: Params): LQInstance {
  const cutCap = EDGES.reduce((s, [u, v], i) => s + (inS[u] && !inS[v] ? cap[i] : 0), 0)
  const mf = maxFlow(cap)
  const raised = cap.map((v, i) => (i === raise ? v + 4 : v))
  const mf2 = maxFlow(raised)
  const prod = rates[0] * rates[1] * rates[2]
  const final = 1000 * prod
  const logSum = -(Math.log(rates[0]) + Math.log(rates[1]) + Math.log(rates[2]))
  const name = (u: number, v: number) => NODES[u] + '\\to ' + NODES[v]
  const edgeList = EDGES.map(([u, v], i) => tex(name(u, v) + ':' + cap[i])).join(', ')
  const side = NODES.filter((_, i) => inS[i]).join(',')
  const [eu, ev] = EDGES[raise]

  return {
    intro:
      'Network part. A directed network has source ' + tex('s') + ', sink ' + tex('t') + ' and edge capacities (edge: capacity) ' + edgeList + '. Currency part. Three currencies P, Q, R can be exchanged at the rates 1 P buys ' + tex(rates[0].toFixed(3)) + ' Q, 1 Q buys ' + tex(rates[1].toFixed(3)) + ' R, and 1 R buys ' + tex(rates[2].toFixed(3)) + ' P (conversions only in these directions).',
    parts: [
      {
        prompt: 'Find the capacity of the cut that separates the set ' + tex('\\{' + side + '\\}') + ' from the other nodes (the sum of capacities of the edges leaving the set).',
        answer: cutCap, tolerance: tolInt, lecture: 6,
        explanation: 'Edges leaving ' + tex('\\{' + side + '\\}') + ': ' + EDGES.map(([u, v], i) => (inS[u] && !inS[v] ? tex(name(u, v) + '=' + cap[i]) : '')).filter(Boolean).join(', ') + ', total ' + cutCap + '.',
      },
      {
        prompt: 'Find the value of a maximum flow from ' + tex('s') + ' to ' + tex('t') + '.',
        answer: mf, tolerance: tolInt, lecture: 6,
        explanation: 'Augmenting along paths until none is left in the residual network gives ' + mf + ', which equals the capacity of a minimum cut (max-flow min-cut theorem).',
      },
      {
        prompt: 'The capacity of the edge ' + tex(name(eu, ev)) + ' is raised by 4. Find the new maximum flow value.',
        answer: mf2, tolerance: tolInt, lecture: 6,
        explanation: 'With ' + tex(name(eu, ev)) + ' at ' + (cap[raise] + 4) + ' the minimum cut becomes ' + mf2 + ' (the old value was ' + mf + ').',
      },
      {
        prompt: 'Start with 1000 units of P and convert P to Q to R to P, without rounding intermediate amounts. How many units of P do you hold at the end? (2 decimal places.)',
        answer: final, tolerance: tol2, lecture: 6,
        explanation: tex('1000\\times' + rates[0].toFixed(3) + '\\times' + rates[1].toFixed(3) + '\\times' + rates[2].toFixed(3) + '=' + final.toFixed(4)) + ', a gain of ' + (final - 1000).toFixed(2) + ' per 1000 units: an arbitrage cycle.',
      },
      {
        prompt: 'Give each conversion the weight ' + tex('-\\ln r') + '. Find the total weight of the cycle P to Q to R to P (4 decimal places); a negative total signals arbitrage.',
        answer: logSum, tolerance: tol4, lecture: 6,
        explanation: tex('-\\ln(' + prod.toFixed(6) + ')=' + logSum.toFixed(5)) + ', which is negative, so the cycle is a negative cycle and an arbitrage.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'opt-lq-d-network', generate: (rng) => build(sample(rng)) }
