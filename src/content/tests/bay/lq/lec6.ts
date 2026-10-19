// bay lecture 6 (Markov chains and Metropolis-Hastings): one story. Metropolis-Hastings on three states with a symmetric proposal that
// picks each other state with probability 1/2: the target probability, an acceptance probability, transition probabilities, and a detailed-balance flow.
// Lecture 6.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { w: [number, number, number] }

export function sample(rng: Rng): Params {
  const w = rng.sample([1, 2, 3, 4, 5, 6, 7, 8], 3)
  return { w: [w[0], w[1], w[2]] }
}

export function build({ w }: Params): LQInstance {
  const tot = w[0] + w[1] + w[2]
  const pi = w.map((v) => v / tot)
  const acc = (i: number, j: number) => Math.min(1, w[j] / w[i])
  const P12 = 0.5 * acc(0, 1)
  const P13 = 0.5 * acc(0, 2)
  const P11 = 1 - P12 - P13
  const flow = pi[0] * P12

  return {
    intro: 'We want to sample from a distribution on the states ' + tex('1,2,3') + ' whose probabilities are proportional to ' + tex('\\tilde\\pi=(' + w.join(',') + ')') + ', without computing the normalising constant. Use Metropolis-Hastings: from the current state ' + tex('i') + ', propose one of the two other states with probability ' + tex('\\tfrac12') + ' each, and move to the proposed state ' + tex('j') + ' with probability ' + tex('\\alpha(i,j)=\\min\\{1,\\tilde\\pi_j/\\tilde\\pi_i\\}') + ' (otherwise stay). Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the target probability ' + tex('\\pi(3)=\\tilde\\pi_3/\\sum\\tilde\\pi') + '.',
        answer: pi[2], tolerance: tol4, lecture: 6,
        explanation: tex(w[2] + '/' + tot) + ' = ' + dec(pi[2]) + '. The chain never needs this normalising constant: only ratios appear in ' + tex('\\alpha') + '.',
      },
      {
        prompt: 'Find the acceptance probability ' + tex('\\alpha(1,2)') + ' of a proposed move from state ' + tex(1) + ' to state ' + tex(2) + '.',
        answer: acc(0, 1), tolerance: tol4, lecture: 6,
        explanation: tex('\\min\\{1,' + w[1] + '/' + w[0] + '\\}') + ' = ' + dec(acc(0, 1)) + '. Moves to a more probable state are always accepted.',
      },
      {
        prompt: 'Find the transition probability ' + tex('P(1\\to2)') + ' of the chain: propose state ' + tex(2) + ' (probability ' + tex('\\tfrac12') + ') and accept.',
        answer: P12, tolerance: tol4, lecture: 6,
        explanation: tex('\\tfrac12\\times' + dec(acc(0, 1))) + ' = ' + dec(P12) + '.',
      },
      {
        prompt: 'Find the probability ' + tex('P(1\\to1)') + ' that the chain stays at state ' + tex(1) + ' (one minus the probabilities of moving to ' + tex(2) + ' or ' + tex(3) + ').',
        answer: P11, tolerance: tol4, lecture: 6,
        explanation: tex('P(1\\to2)=' + dec(P12) + ',\\ P(1\\to3)=' + dec(P13)) + ', so ' + tex('P(1\\to1)=1-' + dec(P12) + '-' + dec(P13)) + ' = ' + dec(P11) + '.',
      },
      {
        prompt: 'Detailed balance says the probability flow ' + tex('\\pi(i)P(i\\to j)') + ' equals ' + tex('\\pi(j)P(j\\to i)') + ', which makes ' + tex('\\pi') + ' stationary. Find the flow ' + tex('\\pi(1)P(1\\to2)') + ' (it also equals ' + tex('\\pi(2)P(2\\to1)') + ').',
        answer: flow, tolerance: tol4, lecture: 6,
        explanation: tex(dec(pi[0]) + '\\times' + dec(P12)) + ' = ' + dec(flow) + '; check: ' + tex('\\pi(2)P(2\\to1)=' + dec(pi[1]) + '\\times' + dec(0.5 * acc(1, 0))) + ' = ' + dec(pi[1] * 0.5 * acc(1, 0)) + '.',
      },
    ],
  }
}

export const genLec6: LQGenerator = { id: 'bay-lq-lec6', generate: (rng) => build(sample(rng)) }
