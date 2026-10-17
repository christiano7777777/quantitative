// LQ-E: Galton-Watson branching process with offspring in {0,1,2}.
// Lecture 10 (mean, generation sizes, extinction) and lecture 11 (martingale Z_n / m^n).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from './format'

export interface Params {
  p: [number, number, number] // P(0), P(1), P(2 children), in tenths
  k: number // observed Z_1 in the martingale part
}

export function sample(rng: Rng): Params {
  // 3 attempts in 4 are supercritical (m > 1), so the extinction answer is usually a real calculation;
  // the rest are subcritical or critical, where the answer is 1.
  const supercritical = rng.next() < 0.75
  for (;;) {
    const p0 = rng.int(1, 8)
    const p2 = rng.int(1, 10 - p0)
    const p1 = 10 - p0 - p2
    if ((p1 + 2 * p2 > 10) === supercritical) return { p: [p0, p1, p2], k: rng.int(1, 3) }
  }
}

export function build({ p: tenths, k }: Params): LQInstance {
  const [p0, p1, p2] = tenths.map((x) => x / 10)
  const m = p1 + 2 * p2
  const gOf0 = p0
  const extinctBy2 = p0 + p1 * gOf0 + p2 * gOf0 * gOf0
  const eta = Math.min(1, p0 / p2)
  const cond = k / m

  return {
    intro:
      'In a branching process, every individual independently has 0, 1 or 2 children with probabilities ' +
      tex(dec(p0)) + ', ' + tex(dec(p1)) + ', ' + tex(dec(p2)) + ' respectively. Start with one individual and let ' +
      tex('Z_n') + ' be the size of generation ' + tex('n') + ' (so ' + tex('Z_0=1') + '). Give decimal answers to 3 decimal places.',
    parts: [
      {
        prompt: 'What is the mean number of children of an individual?',
        answer: m, tolerance: tol3, lecture: 10,
        explanation: tex('m=0\\cdot' + dec(p0) + '+1\\cdot' + dec(p1) + '+2\\cdot' + dec(p2)) + ' = ' + dec(m) + '.',
      },
      {
        prompt: 'What is ' + tex('E[Z_3]') + '?',
        answer: m ** 3, tolerance: tol3, lecture: 10,
        explanation: tex('E[Z_n]=m^n') + ', so ' + tex(dec(m) + '^3') + ' = ' + dec(m ** 3) + '.',
      },
      {
        prompt: 'What is the probability that the population is extinct by generation 2, i.e. ' + tex('P(Z_2=0)') + '?',
        answer: extinctBy2, tolerance: tol3, lecture: 10,
        explanation: tex('P(Z_2=0)=G(G(0))') + ' with ' + tex('G(s)=' + dec(p0) + '+' + dec(p1) + 's+' + dec(p2) + 's^2') + ' and ' + tex('G(0)=' + dec(p0)) + ': ' + dec(extinctBy2) + '.',
      },
      {
        prompt: 'What is the probability that the population eventually dies out?',
        answer: eta, tolerance: tol3, lecture: 10,
        explanation: 'Solve ' + tex('s=G(s)') + ', i.e. ' + tex(dec(p2) + 's^2-' + dec(1 - p1) + 's+' + dec(p0) + '=0') + '. The roots are ' + tex('1') + ' and ' + tex(dec(p0 / p2)) + ' (that is ' + tex('p_0/p_2') + '); the extinction probability is the smaller one, capped at 1: ' + dec(eta) + (m <= 1 ? ' (here ' + tex('m\\le1') + ', so extinction is certain).' : '.'),
      },
      {
        prompt: 'Let ' + tex('W_n=Z_n/m^n') + ', where ' + tex('m') + ' is the mean number of children (a martingale). Given that ' + tex('Z_1=' + k) + ', what is ' + tex('E[W_3\\mid Z_1=' + k + ']') + '?',
        answer: cond, tolerance: tol3, lecture: 11,
        explanation: 'Martingale: ' + tex('E[W_3\\mid Z_1]=W_1=Z_1/m=' + k + '/' + dec(m)) + ' = ' + dec(cond) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'sp-lq-e-branching', generate: (rng) => build(sample(rng)) }
