// LQ-E: absorption probabilities and expected absorption time for a small chain, and stationary law and return time of a random walk on a graph.
// Lecture 7 (Markov chain puzzles).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: number; b: number; c: number; d: number; edges: [number, number][]; v: number } // chain probabilities in tenths

export function sample(rng: Rng): Params {
  const a = rng.int(2, 5), b = rng.int(1, 9 - a - 1), c = rng.int(2, 5), d = rng.int(1, 9 - c - 1)
  const extra: [number, number][] = [[1, 3], [2, 4], [3, 5], [1, 5], [2, 5]]
  const edges = [[1, 2], [2, 3], [3, 4], [4, 5], ...rng.sample(extra, rng.int(0, 2))] as [number, number][]
  return { a, b, c, d, edges, v: rng.int(1, 5) }
}

export function build({ a, b, c, d, edges, v }: Params): LQInstance {
  const A = a / 10, B = b / 10, Cc = c / 10, Dd = d / 10
  const det = 1 - A * Cc
  const h1 = (B + A * Dd) / det
  const h2 = (Dd + Cc * B) / det
  const t1 = (1 + A) / det
  const deg = [0, 0, 0, 0, 0, 0]
  for (const [x, y] of edges) { deg[x]++; deg[y]++ }
  const E = edges.length
  const pi = deg[v] / (2 * E)
  const ret = (2 * E) / deg[v]

  return {
    intro:
      'A chain has transient states 1 and 2 and absorbing states ' + tex('\\mathsf A') + ' and ' + tex('\\mathsf B') + '. From state 1 it moves to state 2 with probability ' + tex(dec(A)) + ', to ' + tex('\\mathsf A') + ' with probability ' + tex(dec(B)) + ' and otherwise to ' + tex('\\mathsf B') +
      '. From state 2 it moves to state 1 with probability ' + tex(dec(Cc)) + ', to ' + tex('\\mathsf A') + ' with probability ' + tex(dec(Dd)) + ' and otherwise to ' + tex('\\mathsf B') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the probability of absorption in ' + tex('\\mathsf A') + ' starting from state 1. (Let ' + tex('h_1,h_2') + ' be the absorption probabilities and solve ' + tex('h_1=' + dec(B) + '+' + dec(A) + 'h_2') + ', ' + tex('h_2=' + dec(Dd) + '+' + dec(Cc) + 'h_1') + '.)',
        answer: h1, tolerance: tol4, lecture: 7,
        explanation: tex('h_1=(' + dec(B) + '+' + dec(A) + '\\cdot' + dec(Dd) + ')/(1-' + dec(A) + '\\cdot' + dec(Cc) + ')') + ' = ' + dec(h1) + '.',
      },
      {
        prompt: 'Find the probability of absorption in ' + tex('\\mathsf A') + ' starting from state 2.',
        answer: h2, tolerance: tol4, lecture: 7,
        explanation: tex('h_2=' + dec(Dd) + '+' + dec(Cc) + '\\cdot' + dec(h1)) + ' = ' + dec(h2) + '.',
      },
      {
        prompt: 'Find the expected number of steps until absorption starting from state 1. (Solve ' + tex('t_1=1+' + dec(A) + 't_2') + ', ' + tex('t_2=1+' + dec(Cc) + 't_1') + '.)',
        answer: t1, tolerance: tol4, lecture: 7,
        explanation: tex('t_1=(1+' + dec(A) + ')/(1-' + dec(A) + '\\cdot' + dec(Cc) + ')') + ' = ' + dec(t1) + '.',
      },
      {
        prompt: 'A random walk moves along a uniformly chosen edge of the graph on vertices 1 to 5 with edges ' + tex(edges.map(([x, y]) => '\\{' + x + ',' + y + '\\}').join(',')) + '. Find the stationary probability of vertex ' + tex(v) + ', which is proportional to its degree: ' + tex('\\deg(v)/(2|E|)') + '.',
        answer: pi, tolerance: tol4, lecture: 7,
        explanation: 'Degrees ' + tex(deg.slice(1).join(',')) + ' sum to ' + 2 * E + ', so ' + tex('\\pi_' + v + '=' + deg[v] + '/' + 2 * E) + ' = ' + dec(pi) + '.',
      },
      {
        prompt: 'Find the expected number of steps for the walk, started at vertex ' + tex(v) + ', to return to it for the first time: ' + tex('1/\\pi_v') + '.',
        answer: ret, tolerance: tol4, lecture: 7,
        explanation: tex(2 * E + '/' + deg[v]) + ' = ' + dec(ret) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'pz-lq-e-markov', generate: (rng) => build(sample(rng)) }
