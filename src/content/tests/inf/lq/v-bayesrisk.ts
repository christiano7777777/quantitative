// LQ-V: the single question of STAT3602 lecture 2 (Bayes rules and randomised rules). The machine story of lecture 1 again: a machine
// is good (theta_1) or bad (theta_2) with a prior, one binary test X, and two actions, keep or replace. Six parts follow the lecture:
// the posterior, the posterior expected loss and the Bayes action, the Bayes risk of a rule, the smallest Bayes risk over all rules,
// and a randomised rule that equalises the two risks.
// Lecture 2.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

/** a: loss of replacing a good machine; b: loss of keeping a bad one; p[i] = P(X=1 | theta_i); w = P(theta_1). */
export interface Params { a: number; b: number; p: [number, number]; w: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const a = rng.int(2, 9)
    const b = rng.int(2, 9)
    const p: [number, number] = [rng.pick([0.2, 0.3, 0.4]), rng.pick([0.6, 0.7, 0.8])]
    // b(1-p2) > a p1 makes the equalising probability of part (e) lie strictly between 0 and 1
    if (b * (1 - p[1]) > a * p[0] + 0.05) return { a, b, p, w: rng.pick([0.4, 0.5, 0.6, 0.7]) }
  }
}

export function build({ a, b, p, w }: Params): LQInstance {
  const [p1, p2] = p
  const joint1 = w * p1
  const joint2 = (1 - w) * p2
  const post1 = joint1 / (joint1 + joint2) // P(theta_1 | X = 1)
  const lossKeep = b * (1 - post1)
  const lossReplace = a * post1
  const bestAt1 = Math.min(lossKeep, lossReplace)
  // rule A = (keep after X=0, replace after X=1)
  const riskA1 = a * p1
  const riskA2 = b * (1 - p2)
  const bayesA = w * riskA1 + (1 - w) * riskA2
  // the four rules d = (d(0), d(1)), 0 = keep, 1 = replace
  const bayesRisk = (d0: number, d1: number) => {
    const R1 = d0 * a * (1 - p1) + d1 * a * p1
    const R2 = (1 - d0) * b * (1 - p2) + (1 - d1) * b * p2
    return w * R1 + (1 - w) * R2
  }
  const smallest = Math.min(bayesRisk(0, 0), bayesRisk(0, 1), bayesRisk(1, 0), bayesRisk(1, 1))
  // rule C = always replace: risks (a, 0). Mixture of A (prob q) and C: equal risks at q*
  const qStar = a / (a * (1 - p1) + b * (1 - p2))
  const common = qStar * riskA2

  return {
    intro: 'A machine is in state ' + tex('\\theta_1') + ' (good) or ' + tex('\\theta_2') + ' (bad), with prior probabilities ' + tex('P(\\theta_1)=' + dec(w)) + ' and ' + tex('P(\\theta_2)=' + dec(1 - w)) + '. A test gives ' + tex('X\\in\\{0,1\\}') + ' with ' + tex('P(X=1\\mid\\theta_1)=' + dec(p1)) + ' and ' + tex('P(X=1\\mid\\theta_2)=' + dec(p2)) + '. After seeing ' + tex('X') + ' you either keep the machine or replace it. Replacing a good machine costs ' + tex(a) + ', keeping a bad machine costs ' + tex(b) + ', and the other two combinations cost ' + tex(0) + '. A rule ' + tex('d=(d(0),d(1))') + ' says what to do after each test result. Let ' + tex('A=(\\text{keep},\\text{replace})') + ' (keep after ' + tex('X=0') + ', replace after ' + tex('X=1') + ') and ' + tex('C') + ' the rule that always replaces. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The test shows ' + tex('X=1') + '. Find the posterior probability ' + tex('P(\\theta_1\\mid X=1)') + ' that the machine is good.',
        answer: post1, tolerance: tol4, lecture: 2,
        explanation: 'By Bayes\' theorem ' + tex('\\dfrac{' + dec(w) + '\\times' + dec(p1) + '}{' + dec(w) + '\\times' + dec(p1) + '+' + dec(1 - w) + '\\times' + dec(p2) + '}') + ' = ' + dec(post1) + '.',
      },
      {
        prompt: 'After ' + tex('X=1') + ' compare the posterior expected loss of keeping with that of replacing. Give the smaller of the two (the posterior expected loss of the Bayes action).',
        answer: bestAt1, tolerance: tol4, lecture: 2,
        explanation: 'Keeping costs ' + tex(b) + ' if the machine is bad: ' + tex(b + '\\times' + dec(1 - post1)) + ' = ' + dec(lossKeep) + '. Replacing costs ' + tex(a) + ' if it is good: ' + tex(a + '\\times' + dec(post1)) + ' = ' + dec(lossReplace) + '. The Bayes action after ' + tex('X=1') + ' is to ' + (lossKeep < lossReplace ? 'keep' : 'replace') + ', with expected loss ' + dec(bestAt1) + '.',
      },
      {
        prompt: 'Find the risks of rule ' + tex('A') + ' and then its Bayes risk ' + tex('r(\\pi,A)=P(\\theta_1)R(\\theta_1,A)+P(\\theta_2)R(\\theta_2,A)') + '.',
        answer: bayesA, tolerance: tol4, lecture: 2,
        explanation: tex('R(\\theta_1,A)=' + a + '\\times' + dec(p1) + '=' + dec(riskA1)) + ' (replace only after ' + tex('X=1') + '), ' + tex('R(\\theta_2,A)=' + b + '\\times' + dec(1 - p2) + '=' + dec(riskA2)) + ' (keep only after ' + tex('X=0') + '). So ' + tex(dec(w) + '\\times' + dec(riskA1) + '+' + dec(1 - w) + '\\times' + dec(riskA2)) + ' = ' + dec(bayesA) + '.',
      },
      {
        prompt: 'There are four rules: keep always, replace always, ' + tex('A') + ', and the rule that replaces after ' + tex('X=0') + ' and keeps after ' + tex('X=1') + '. Find the smallest Bayes risk among the four (the Bayes risk of the Bayes rule).',
        answer: smallest, tolerance: tol4, lecture: 2,
        explanation: 'Compute the Bayes risk of each of the four rules as in the previous part and take the smallest: ' + dec(smallest) + '. It equals the sum over ' + tex('x') + ' of the probability of ' + tex('x') + ' times the smallest posterior expected loss at ' + tex('x') + '.',
      },
      {
        prompt: 'A randomised rule uses ' + tex('A') + ' with probability ' + tex('q') + ' and ' + tex('C') + ' with probability ' + tex('1-q') + '. Its risk at each state is the same mixture of the risks of ' + tex('A') + ' and ' + tex('C') + '. Find the ' + tex('q') + ' that makes its two risks ' + tex('R(\\theta_1,\\cdot)') + ' and ' + tex('R(\\theta_2,\\cdot)') + ' equal. (The risks of ' + tex('C') + ' are ' + tex('(' + a + ',0)') + '.)',
        answer: qStar, tolerance: tol4, lecture: 2,
        explanation: 'The mixture has risks ' + tex('q\\times' + dec(riskA1) + '+(1-q)\\times' + a) + ' at ' + tex('\\theta_1') + ' and ' + tex('q\\times' + dec(riskA2)) + ' at ' + tex('\\theta_2') + '. Setting them equal: ' + tex('q^*=\\dfrac{' + a + '}{' + dec(a - riskA1 + riskA2) + '}') + ' = ' + dec(qStar) + '.',
      },
      {
        prompt: 'Find the common value of the two risks of the mixture at ' + tex('q^*') + '. This is the largest risk of this randomised rule.',
        answer: common, tolerance: tol4, lecture: 2,
        explanation: tex(dec(qStar) + '\\times' + dec(riskA2)) + ' = ' + dec(common) + '. It is smaller than the largest risk of ' + tex('A') + ' alone (' + dec(Math.max(riskA1, riskA2)) + ') and of ' + tex('C') + ' alone (' + tex(a) + '): mixing two rules whose risks cross can lower the worst case.',
      },
    ],
  }
}

export const genV: LQGenerator = { id: 'inf-lq-v-bayesrisk', generate: (rng) => build(sample(rng)) }
