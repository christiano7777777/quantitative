// LQ-E: Metropolis-Hastings acceptance probabilities for several targets and proposals, and the transition matrix of a discrete sampler.
// Lecture 8 (MCMC I).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number; xp: number; gx: number; gxp: number; pi: number[] } // x values in tenths; gamma points in tenths; pi weights

export function sample(rng: Rng): Params {
  return { x: rng.int(-20, 20) / 10, xp: rng.int(-20, 20) / 10, gx: rng.int(5, 60) / 10, gxp: rng.int(5, 60) / 10, pi: [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)] }
}

export function build({ x, xp, gx, gxp, pi }: Params): LQInstance {
  const acc1 = Math.min(1, Math.exp(-(xp * xp - x * x) / 2))
  const kern = (t: number) => t * t * Math.exp(-t)
  const acc2 = Math.min(1, kern(gxp) / kern(gx))
  const qd = (t: number) => Math.exp(-(t * t) / 8) // N(0, 2^2) proposal up to a constant
  const target = (t: number) => Math.exp(-(t * t) / 2)
  const acc3 = Math.min(1, (target(xp) * qd(x)) / (target(x) * qd(xp)))
  const tot = pi.reduce((a, b) => a + b, 0)
  const pr = pi.map((v) => v / tot)
  const move = (i: number, j: number) => 0.5 * Math.min(1, pr[j] / pr[i])
  const rej0 = 1 - move(0, 1) - move(0, 2)

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'A random-walk Metropolis sampler targets ' + tex('\\pi(x)\\propto e^{-x^2/2}') + ' with a symmetric proposal. The chain is at ' + tex('x=' + dec(x)) + ' and proposes ' + tex('x\'=' + dec(xp)) + '. Find the acceptance probability ' + tex('\\min\\{1,\\pi(x\')/\\pi(x)\\}') + '.',
        answer: acc1, tolerance: tol4, lecture: 8,
        explanation: tex('\\exp\\{-(' + dec(xp * xp) + '-' + dec(x * x) + ')/2\\}=' + dec(Math.exp(-(xp * xp - x * x) / 2))) + ', capped at 1: ' + dec(acc1) + '.',
      },
      {
        prompt: 'The target is now known only up to a constant, ' + tex('\\pi(t)\\propto t^2e^{-t}') + ' for ' + tex('t>0') + ' (a Gamma(3,1) kernel). The chain is at ' + tex(dec(gx)) + ' and proposes ' + tex(dec(gxp)) + ' with a symmetric proposal. Find the acceptance probability. (The normalising constant cancels.)',
        answer: acc2, tolerance: tol4, lecture: 8,
        explanation: tex('\\dfrac{' + dec(gxp) + '^2e^{-' + dec(gxp) + '}}{' + dec(gx) + '^2e^{-' + dec(gx) + '}}') + ' = ' + dec(kern(gxp) / kern(gx)) + ', capped at 1: ' + dec(acc2) + '.',
      },
      {
        prompt: 'An independence sampler proposes ' + tex('x\'') + ' from a ' + tex('N(0,4)') + ' density ' + tex('q') + ' regardless of the current state, for the target ' + tex('\\pi(x)\\propto e^{-x^2/2}') + '. With current ' + tex('x=' + dec(x)) + ' and proposal ' + tex('x\'=' + dec(xp)) + ', find the acceptance probability ' + tex('\\min\\{1,\\frac{\\pi(x\')q(x)}{\\pi(x)q(x\')}\\}') + '.',
        answer: acc3, tolerance: tol4, lecture: 8,
        explanation: 'The ratio ' + tex('\\dfrac{e^{-x\'^2/2}e^{-x^2/8}}{e^{-x^2/2}e^{-x\'^2/8}}') + ' = ' + dec((target(xp) * qd(x)) / (target(x) * qd(xp))) + ', capped at 1: ' + dec(acc3) + '.',
      },
      {
        prompt: 'A sampler on three states has target probabilities proportional to ' + tex(pi.join(':')) + '. From any state it proposes each of the other two states with probability ' + tex('1/2') + ' and accepts with probability ' + tex('\\min\\{1,\\pi_j/\\pi_i\\}') + '. Find the transition probability from state 1 to state 2.',
        answer: move(0, 1), tolerance: tol4, lecture: 8,
        explanation: 'Normalised target ' + tex(pr.map(dec).join(',')) + '; ' + tex('P(1\\to2)=\\tfrac12\\min\\{1,' + dec(pr[1]) + '/' + dec(pr[0]) + '\\}') + ' = ' + dec(move(0, 1)) + '.',
      },
      {
        prompt: 'Find the probability that the chain stays in state 1 on the next step (the sum of the rejection probabilities), ' + tex('1-P(1\\to2)-P(1\\to3)') + '.',
        answer: rej0, tolerance: tol4, lecture: 8,
        explanation: tex('1-' + dec(move(0, 1)) + '-' + dec(move(0, 2))) + ' = ' + dec(rej0) + '. Detailed balance ' + tex('\\pi_iP_{ij}=\\pi_jP_{ji}') + ' holds by construction.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'bay-lq-e-mh', generate: (rng) => build(sample(rng)) }
