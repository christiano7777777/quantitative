// LQ-P: a three-state birth-death Markov chain: two-step transition probabilities, the stationary distribution via detailed
// balance, and the long-run average of the state.
// Lecture 9 (Markov chains and stationary distributions).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: number; b: number; c: number; d: number } // P12 = a, P21 = b, P23 = c, P32 = d

export function sample(rng: Rng): Params {
  const vals = [0.1, 0.2, 0.3, 0.4, 0.5]
  for (;;) {
    const a = rng.pick(vals), b = rng.pick(vals), c = rng.pick(vals), d = rng.pick(vals)
    if (b + c <= 0.9 && !(a === b && c === d)) return { a, b, c, d }
  }
}

export function build({ a, b, c, d }: Params): LQInstance {
  const P = [[1 - a, a, 0], [b, 1 - b - c, c], [0, d, 1 - d]]
  const sq = (i: number, j: number) => P[i].reduce((s, v, k) => s + v * P[k][j], 0)
  // detailed balance: pi1 a = pi2 b, pi2 c = pi3 d
  const raw = [1, a / b, (a / b) * (c / d)]
  const tot = raw.reduce((s, v) => s + v, 0)
  const pi = raw.map((v) => v / tot)
  const mean = pi.reduce((s, v, i) => s + (i + 1) * v, 0)
  const mat = '$$P=\\begin{pmatrix}' + P.map((r) => r.map(dec).join(' & ')).join(' \\\\ ') + '\\end{pmatrix}$$'

  return {
    intro: 'A Markov chain on the states ' + tex('\\{1,2,3\\}') + ' has transition matrix ' + mat + ' where ' + tex('P_{ij}=P(X_n=j\\mid X_{n-1}=i)') + '. The chain is regular, so it has a unique stationary distribution ' + tex('\\pi=\\pi P') + ', and the chain is reversible: ' + tex('\\pi_iP_{ij}=\\pi_jP_{ji}') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the two-step transition probability ' + tex('P(X_2=3\\mid X_0=1)=(P^2)_{13}') + '.',
        answer: sq(0, 2), tolerance: tol4, lecture: 9,
        explanation: 'Marginalise over the middle state: ' + tex('\\sum_kP_{1k}P_{k3}=' + dec(P[0][0]) + '\\times0+' + dec(P[0][1]) + '\\times' + dec(P[1][2]) + '+0\\times' + dec(P[2][2])) + ' = ' + dec(sq(0, 2)) + '.',
      },
      {
        prompt: 'Find ' + tex('P(X_2=2\\mid X_0=2)=(P^2)_{22}') + '.',
        answer: sq(1, 1), tolerance: tol4, lecture: 9,
        explanation: tex(dec(P[1][0]) + '\\times' + dec(P[0][1]) + '+' + dec(P[1][1]) + '^2+' + dec(P[1][2]) + '\\times' + dec(P[2][1])) + ' = ' + dec(sq(1, 1)) + '.',
      },
      {
        prompt: 'Using detailed balance ' + tex('\\pi_1P_{12}=\\pi_2P_{21}') + ' and ' + tex('\\pi_2P_{23}=\\pi_3P_{32}') + ', find the stationary probability ' + tex('\\pi_1') + '.',
        answer: pi[0], tolerance: tol4, lecture: 9,
        explanation: 'Up to a constant ' + tex('\\pi\\propto(1,\\ P_{12}/P_{21},\\ P_{12}P_{23}/(P_{21}P_{32}))=(1,' + dec(raw[1]) + ',' + dec(raw[2]) + ')') + ', whose sum is ' + dec(tot) + ', so ' + tex('\\pi_1=1/' + dec(tot)) + ' = ' + dec(pi[0]) + '.',
      },
      {
        prompt: 'Find the stationary probability ' + tex('\\pi_3') + '.',
        answer: pi[2], tolerance: tol4, lecture: 9,
        explanation: tex(dec(raw[2]) + '/' + dec(tot)) + ' = ' + dec(pi[2]) + '. (Check ' + tex('\\pi_1+\\pi_2+\\pi_3=' + dec(pi[0] + pi[1] + pi[2])) + '.)',
      },
      {
        prompt: 'The long-run average of the state, ' + tex('\\frac1T\\sum_{n\\le T}X_n\\to E_\\pi[X]=\\sum_jj\\pi_j') + ', is what MCMC-style averaging estimates. Find it.',
        answer: mean, tolerance: tol4, lecture: 9,
        explanation: tex('1\\times' + dec(pi[0]) + '+2\\times' + dec(pi[1]) + '+3\\times' + dec(pi[2])) + ' = ' + dec(mean) + '. The samples are correlated, so the ordinary law of large numbers does not apply; an ergodic theorem does.',
      },
    ],
  }
}

export const genP: LQGenerator = { id: 'bay-lq-p-markov', generate: (rng) => build(sample(rng)) }
