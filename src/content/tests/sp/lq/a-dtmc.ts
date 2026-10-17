// LQ-A: a 5-state discrete-time chain with two transient states, one absorbing state and a closed
// two-state class (sometimes periodic). Lectures 1-4: n-step probability, classification,
// absorption probability and time, stationary distribution. State labels are shuffled per attempt.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, pm, tex, tol3 } from './format'
import { solve } from './linalg'

export interface Role { T1: number; T2: number; R1: number; R2: number; AB: number } // state labels 1..5

export interface Params {
  W: number[][] // transition weights in tenths: P = W / 10, indexed by label - 1
  role: Role
  periodic: boolean
  target: number // label asked about in part (a)
}

function canLeave(W: number[][], role: Role): boolean {
  const outside = [role.R1, role.R2, role.AB].map((x) => x - 1)
  const direct = (t: number) => outside.some((o) => W[t][o] > 0)
  const leaves = (t: number, u: number) => direct(t) || (W[t][u] > 0 && direct(u))
  const a = role.T1 - 1, b = role.T2 - 1
  return leaves(a, b) && leaves(b, a)
}

/** From T1: absorption probability into AB, expected time to leave {T1,T2}, expected visits to T1 (time 0 counted). */
export function transientQuantities(W: number[][], role: Role) {
  const a = role.T1 - 1, b = role.T2 - 1, ab = role.AB - 1
  const P = (i: number, j: number) => W[i][j] / 10
  const IminusQ = [[1 - P(a, a), -P(a, b)], [-P(b, a), 1 - P(b, b)]]
  const h = solve(IminusQ, [P(a, ab), P(b, ab)])
  const k = solve(IminusQ, [1, 1])
  const visits = solve(IminusQ, [1, 0]) // first column of the fundamental matrix (I - Q)^-1
  return { h: h[0], k: k[0], visits: visits[0] }
}

export function sample(rng: Rng): Params {
  for (;;) {
    const labels = rng.shuffle([1, 2, 3, 4, 5])
    const role: Role = { T1: labels[0], T2: labels[1], R1: labels[2], R2: labels[3], AB: labels[4] }
    const periodic = rng.next() < 0.4
    const W = Array.from({ length: 5 }, () => Array<number>(5).fill(0))
    const set = (i: number, j: number, w: number) => { W[i - 1][j - 1] = w }
    set(role.AB, role.AB, 10)
    if (periodic) {
      set(role.R1, role.R2, 10)
      set(role.R2, role.R1, 10)
    } else {
      const a = rng.int(1, 4), b = rng.int(2, 8)
      set(role.R1, role.R1, a); set(role.R1, role.R2, 10 - a)
      set(role.R2, role.R1, b); set(role.R2, role.R2, 10 - b)
    }
    for (const t of [role.T1, role.T2]) for (let u = 0; u < 10; u++) W[t - 1][rng.int(0, 4)]++
    if (!canLeave(W, role)) continue
    const { h } = transientQuantities(W, role)
    if (h < 0.02 || h > 0.98) continue // keep the absorption answer interesting
    const two = (to: number) => W[role.T1 - 1].reduce((s, w, k) => s + (w * W[k][to - 1]) / 100, 0)
    const cands = [1, 2, 3, 4, 5].filter((s) => two(s) > 0)
    return { W, role, periodic, target: rng.pick(cands) }
  }
}

function classCount(W: number[][]): number {
  const n = W.length
  const reach = W.map((row, i) => row.map((w, j) => w > 0 || i === j))
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (reach[i][k] && reach[k][j]) reach[i][j] = true
  let count = 0
  for (let i = 0; i < n; i++) {
    let first = true
    for (let j = 0; j < i; j++) if (reach[i][j] && reach[j][i]) first = false
    if (first) count++
  }
  return count
}

export function build({ W, role, periodic, target }: Params): LQInstance {
  const P = W.map((r) => r.map((w) => w / 10))
  const { T1, T2, R1, R2, AB } = role
  const { h, k, visits } = transientQuantities(W, role)
  const twoStep = P[T1 - 1].reduce((s, p, j) => s + p * P[j][target - 1], 0)
  const pi = W[R2 - 1][R1 - 1] / (W[R1 - 1][R2 - 1] + W[R2 - 1][R1 - 1])
  const classes = classCount(W)
  const longRun = (1 - h) * pi // reaches the closed class with probability 1 - h, then spends fraction pi in R1

  const intro =
    'A Markov chain on states ' + tex('1,2,3,4,5') + ' has transition matrix (rows = current state, columns = next state)' +
    '$$P=' + pm(P.map((r) => r.map(dec))) + '$$' +
    'Give decimal answers to 3 decimal places. Counts are whole numbers.'

  return {
    intro,
    parts: [
      {
        prompt: 'Starting in state ' + tex(T1) + ', find ' + tex('P(X_2=' + target + ')') + '.',
        answer: twoStep, tolerance: tol3, lecture: 1,
        explanation: 'Two-step probability = entry (' + T1 + ',' + target + ') of ' + tex('P^2') + ', i.e. ' + tex('\\sum_k p_{' + T1 + 'k}p_{k' + target + '}') + ' = ' + dec(twoStep) + '.',
      },
      {
        prompt: 'How many communicating classes does the chain have?',
        answer: classes, tolerance: tol3, lecture: 2,
        explanation: 'Classes are the sets of states that can reach each other. Here ' + tex(AB) + ' is absorbing (its own class) and ' + tex('\\{' + R1 + ',' + R2 + '\\}') + ' is a closed class; states ' + tex(T1) + ' and ' + tex(T2) + ' form ' + (classes === 3 ? 'one class (they reach each other)' : 'two separate classes') + '. Total: ' + classes + '.',
      },
      {
        prompt: 'Starting in state ' + tex(T1) + ', what is the expected total number of visits to state ' + tex(T1) + ' (counting time 0)?',
        answer: visits, tolerance: tol3, lecture: 2,
        explanation: 'State ' + T1 + ' is transient, so the number of visits is finite. With ' + tex('Q') + ' the transition matrix restricted to the transient states ' + tex(T1) + ', ' + tex(T2) + ', the expected visits are the entries of ' + tex('(I-Q)^{-1}') + '; the ' + tex('(' + T1 + ',' + T1 + ')') + ' entry is ' + dec(visits) + '.',
      },
      {
        prompt: 'Starting from state ' + tex(T1) + ', what is the probability that the chain ever reaches state ' + tex(AB) + '?',
        answer: h, tolerance: tol3, lecture: 3,
        explanation: 'First-step analysis on the transient states ' + tex(T1) + ', ' + tex(T2) + ': ' + tex('h_i=\\sum_j p_{ij}h_j') + ' with ' + tex('h_{' + AB + '}=1') + ' and ' + tex('h=0') + ' on the closed class ' + tex('\\{' + R1 + ',' + R2 + '\\}') + '. Solving the 2x2 system gives ' + dec(h) + '.',
      },
      {
        prompt: 'Starting from state ' + tex(T1) + ', what is the expected number of steps until the chain first visits a state outside ' + tex('\\{' + T1 + ',' + T2 + '\\}') + '?',
        answer: k, tolerance: tol3, lecture: 3,
        explanation: tex('k_i=1+\\sum_{j\\in\\{' + T1 + ',' + T2 + '\\}}p_{ij}k_j') + ' for ' + tex('i\\in\\{' + T1 + ',' + T2 + '\\}') + '. Solving gives ' + dec(k) + '.',
      },
      {
        prompt: 'Starting in state ' + tex(T1) + ', what is the long-run fraction of time the chain spends in state ' + tex(R1) + '?',
        answer: longRun, tolerance: tol3, lecture: 4,
        explanation: 'Two stages. The chain ends in the closed class ' + tex('\\{' + R1 + ',' + R2 + '\\}') + ' with probability ' + tex('1-h=1-' + dec(h) + '=' + dec(1 - h)) + ' (otherwise it is absorbed in ' + tex(AB) + ', where it never visits ' + tex(R1) + '). Inside the class, ' + tex('\\pi_{' + R1 + '}=p_{' + R2 + R1 + '}/(p_{' + R1 + R2 + '}+p_{' + R2 + R1 + '})=' + dec(pi)) + (periodic ? ' (the class is periodic, but the time average still equals the stationary probability)' : '') + '. So the answer is ' + dec(1 - h) + ' x ' + dec(pi) + ' = ' + dec(longRun) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'sp-lq-a-dtmc', generate: (rng) => build(sample(rng)) }
