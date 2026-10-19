// LQ-N: Bayes risk, the posterior and the Bayes action in a finite problem, and the unbiasedness gap.
// Lecture 3 (unbiased rules and Bayes rules).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { loss: number[][]; p: [number, number]; w: [number, number]; d: [number, number] }

export function sample(rng: Rng): Params {
  for (;;) {
    const loss = [0, 1].map(() => [rng.int(0, 9), rng.int(0, 9)])
    const p: [number, number] = [rng.pick([0.2, 0.3, 0.4]), rng.pick([0.6, 0.7, 0.8])]
    const wa = rng.pick([1, 2, 3]), wb = rng.pick([1, 2, 3, 4])
    const d: [number, number] = [rng.int(0, 1), rng.int(0, 1)]
    if (loss[0][0] !== loss[0][1] && loss[1][0] !== loss[1][1] && wa !== wb) return { loss, p, w: [wa / (wa + wb), wb / (wa + wb)], d }
  }
}

export function build({ loss, p, w, d }: Params): LQInstance {
  const R = (t: 0 | 1, rule: [number, number]) => loss[t][rule[0]] * (1 - p[t]) + loss[t][rule[1]] * p[t]
  const bayesRisk = w[0] * R(0, d) + w[1] * R(1, d)
  // posterior of theta given X = 1
  const m1 = w[0] * p[0], m2 = w[1] * p[1]
  const post1 = m1 / (m1 + m2)
  const eloss = (a: 0 | 1) => post1 * loss[0][a] + (1 - post1) * loss[1][a]
  const best = eloss(0) <= eloss(1) ? 0 : 1
  // unbiasedness gap at theta = theta_1 measured under theta_2: E_{theta_2} L(theta_1, d(X)) - R(theta_1, d)
  const gap = loss[0][d[0]] * (1 - p[1]) + loss[0][d[1]] * p[1] - R(0, d)
  const nm = (i: number) => 'a_' + (i + 1)

  return {
    intro: 'A parameter takes the values ' + tex('\\theta_1') + ' and ' + tex('\\theta_2') + ' with prior probabilities ' + tex(dec(w[0]) + '\\text{ and }' + dec(w[1])) + '. One observation ' + tex('X\\in\\{0,1\\}') + ' has ' + tex('P(X=1\\mid\\theta_1)=' + dec(p[0])) + ' and ' + tex('P(X=1\\mid\\theta_2)=' + dec(p[1])) + '. Two actions have losses ' + tex('L(\\theta_1,a_1),L(\\theta_1,a_2)=' + loss[0].join(',')) + ' and ' + tex('L(\\theta_2,a_1),L(\\theta_2,a_2)=' + loss[1].join(',')) + '. Consider the rule ' + tex('d=(d(0),d(1))=(' + nm(d[0]) + ',' + nm(d[1]) + ')') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the Bayes risk ' + tex('r(\\pi,d)=\\pi(\\theta_1)R(\\theta_1,d)+\\pi(\\theta_2)R(\\theta_2,d)') + ' of ' + tex('d') + '.',
        answer: bayesRisk, tolerance: tol4, lecture: 2,
        explanation: tex('R(\\theta_1,d)=' + dec(R(0, d)) + ',\\ R(\\theta_2,d)=' + dec(R(1, d))) + ', so ' + tex('r=' + dec(w[0]) + '\\times' + dec(R(0, d)) + '+' + dec(w[1]) + '\\times' + dec(R(1, d))) + ' = ' + dec(bayesRisk) + '.',
      },
      {
        prompt: 'Given the observation ' + tex('X=1') + ', find the posterior probability ' + tex('\\pi(\\theta_1\\mid X=1)') + '.',
        answer: post1, tolerance: tol4, lecture: 2,
        explanation: 'The joint weights are ' + tex(dec(w[0]) + '\\times' + dec(p[0]) + '=' + dec(m1)) + ' and ' + tex(dec(w[1]) + '\\times' + dec(p[1]) + '=' + dec(m2)) + ', so the posterior is ' + tex(dec(m1) + '/' + dec(m1 + m2)) + ' = ' + dec(post1) + '.',
      },
      {
        prompt: 'Find the expected posterior loss of action ' + tex('a_1') + ' given ' + tex('X=1') + '.',
        answer: eloss(0), tolerance: tol4, lecture: 2,
        explanation: tex(dec(post1) + '\\times' + loss[0][0] + '+' + dec(1 - post1) + '\\times' + loss[1][0]) + ' = ' + dec(eloss(0)) + '.',
      },
      {
        prompt: 'Find the expected posterior loss of action ' + tex('a_2') + ' given ' + tex('X=1') + '. (The Bayes rule takes the action with the smaller expected posterior loss.)',
        answer: eloss(1), tolerance: tol4, lecture: 2,
        explanation: tex(dec(post1) + '\\times' + loss[0][1] + '+' + dec(1 - post1) + '\\times' + loss[1][1]) + ' = ' + dec(eloss(1)) + ', so the Bayes action at ' + tex('x=1') + ' is ' + tex('a_' + (best + 1)) + '.',
      },
      {
        prompt: 'A rule is unbiased if ' + tex('E_{\\theta\'}L(\\theta,d(X))\\ge R(\\theta,d)') + ' for all ' + tex('\\theta,\\theta\'') + '. Find ' + tex('E_{\\theta_2}L(\\theta_1,d(X))-R(\\theta_1,d)') + ' for this rule. (A negative value shows that ' + tex('d') + ' is not unbiased.)',
        answer: gap, tolerance: tol4, lecture: 2,
        explanation: tex('E_{\\theta_2}L(\\theta_1,d(X))=' + loss[0][d[0]] + '\\times' + dec(1 - p[1]) + '+' + loss[0][d[1]] + '\\times' + dec(p[1]) + '=' + dec(gap + R(0, d))) + ' and ' + tex('R(\\theta_1,d)=' + dec(R(0, d))) + ', so the difference is ' + dec(gap) + (gap < 0 ? ', which is negative: the rule is not unbiased.' : '.'),
      },
    ],
  }
}

export const genN: LQGenerator = { id: 'inf-lq-n-bayes', generate: (rng) => build(sample(rng)) }
