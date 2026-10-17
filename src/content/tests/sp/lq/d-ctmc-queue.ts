// LQ-D: a 3-state continuous-time chain (jump probabilities, stationary law) and an M/M/1 queue
// (mean number, mean time via Little's law, tail probability). Lectures 7 and 8.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, pm, tex, tol3 } from './format'
import { solve } from './linalg'

export interface Params {
  q: number[][] // off-diagonal rates, q[i][j] for i != j (0-indexed states 0..2); diagonal entries unused
  from: number; to: number // jump question: P(next state = to | leaving from)
  asked: number // state whose long-run fraction of time is asked
  lambda: number; mu: number // M/M/1 arrival and service rates per minute
  k: number
}

const QUEUES: [number, number][] = [[4, 2], [5, 3], [8, 6], [10, 8], [5, 4], [6, 3], [10, 6], [4, 3]] // [mu, lambda]

export function stationary(q: number[][]): number[] {
  const n = q.length
  const rate = (i: number) => q[i].reduce((s, x, j) => (j === i ? s : s + x), 0)
  // pi Q = 0 transposed: rows of Q^T, with the last equation replaced by sum(pi) = 1
  const A = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => (r === n - 1 ? 1 : c === r ? -rate(c) : q[c][r])))
  return solve(A, Array.from({ length: n }, (_, r) => (r === n - 1 ? 1 : 0)))
}

export function sample(rng: Rng): Params {
  let q: number[][]
  do {
    q = Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => (i === j ? 0 : rng.int(1, 4))))
  } while (Math.max(...stationary(q)) - Math.min(...stationary(q)) < 0.05) // a near-uniform answer is guessable
  const from = rng.int(0, 2)
  const to = rng.pick([0, 1, 2].filter((j) => j !== from))
  const [mu, lambda] = rng.pick(QUEUES)
  return { q, from, to, asked: rng.int(0, 2), lambda, mu, k: rng.int(2, 4) }
}

export function build({ q, from, to, asked, lambda, mu, k }: Params): LQInstance {
  const exit = (i: number) => q[i].reduce((s, x) => s + x, 0)
  const Q = q.map((row, i) => row.map((x, j) => (i === j ? -exit(i) : x)))
  const jump = q[from][to] / exit(from)
  const pi = stationary(q)
  const rho = lambda / mu
  const L = rho / (1 - rho)
  const W = 1 / (mu - lambda)
  const tail = rho ** k
  const s = (i: number) => i + 1

  return {
    intro:
      'A continuous-time Markov chain on states ' + tex('1,2,3') + ' has generator' +
      '$$Q=' + pm(Q.map((r) => r.map(String))) + '$$' +
      'Give decimal answers to 3 decimal places.',
    parts: [
      {
        prompt: 'When the chain leaves state ' + tex(s(from)) + ', what is the probability that it jumps to state ' + tex(s(to)) + '?',
        answer: jump, tolerance: tol3, lecture: 7,
        explanation: 'Jump chain: ' + tex('q_{' + s(from) + s(to) + '}/q_{' + s(from) + '}=' + q[from][to] + '/' + exit(from)) + ' = ' + dec(jump) + '.',
      },
      {
        prompt: 'What fraction of the time does the chain spend in state ' + tex(s(asked)) + ' in the long run?',
        answer: pi[asked], tolerance: tol3, lecture: 7,
        explanation: 'Solve ' + tex('\\pi Q=0') + ' with ' + tex('\\sum\\pi_i=1') + ': ' + tex('\\pi=(' + pi.map(dec).join(',') + ')') + ', so ' + tex('\\pi_{' + s(asked) + '}=' + dec(pi[asked])) + '.',
      },
      {
        prompt: 'Now a single-server queue: customers arrive as a Poisson process at rate ' + tex(lambda) + ' per minute and service times are exponential with rate ' + tex(mu) + ' per minute (M/M/1). In equilibrium, what is the mean number of customers in the system?',
        answer: L, tolerance: tol3, lecture: 8,
        explanation: tex('\\rho=\\lambda/\\mu=' + dec(rho)) + ', and ' + tex('\\pi_n=(1-\\rho)\\rho^n') + ' gives ' + tex('L=\\rho/(1-\\rho)') + ' = ' + dec(L) + '.',
      },
      {
        prompt: 'In the same queue, what is the mean time (in minutes) a customer spends in the system, waiting plus being served?',
        answer: W, tolerance: tol3, lecture: 8,
        explanation: 'Little\'s law ' + tex('L=\\lambda W') + ': ' + tex('W=L/\\lambda=' + dec(L) + '/' + lambda) + ' = ' + dec(W) + ' (also ' + tex('1/(\\mu-\\lambda)') + ').',
      },
      {
        prompt: 'In the same queue in equilibrium, what is the probability that at least ' + tex(k) + ' customers are in the system?',
        answer: tail, tolerance: tol3, lecture: 8,
        explanation: tex('P(N\\ge k)=\\sum_{n\\ge k}(1-\\rho)\\rho^n=\\rho^{k}=' + dec(rho) + '^{' + k + '}') + ' = ' + dec(tail) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'sp-lq-d-ctmc-queue', generate: (rng) => build(sample(rng)) }
