// LQ-D: Massart's bound, the sample size from a Rademacher bound, a max-margin separator, a 1-D hard-margin SVM and the AdaBoost training-error bound.
// Lectures 4 (Rademacher complexity), 5 (margin theory), 6 (boosting).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params {
  H: number; m1: number
  B: number; R: number; delta: number; eps: number
  pos: [number, number]; neg: [number, number]
  negs: number[]; poss: number[]
  errs: number[]
}

export function sample(rng: Rng): Params {
  for (;;) {
    const B = rng.pick([1, 2, 3]), R = rng.pick([1, 2, 3]), delta = rng.pick([0.01, 0.05, 0.1]), eps = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5])
    const need = ((2 * B * R + Math.sqrt(Math.log(1 / delta) / 2)) / eps) ** 2
    if (Math.abs(need - Math.round(need)) < 0.02) continue
    const pos: [number, number] = [rng.int(1, 6), rng.int(1, 6)]
    const neg: [number, number] = [rng.int(-6, -1), rng.int(-6, -1)]
    const negs = [-rng.int(3, 6), -rng.int(1, 2)].sort((a, b) => a - b)
    const poss = [rng.int(2, 3), rng.int(4, 7)]
    const errs = [rng.int(20, 45) / 100, rng.int(20, 45) / 100, rng.int(20, 45) / 100]
    return { H: rng.pick([16, 64, 256, 1000, 4096, 10000]), m1: rng.pick([100, 200, 500, 1000, 2000]), B, R, delta, eps, pos, neg, negs, poss, errs }
  }
}

export function build(p: Params): LQInstance {
  const massart = Math.sqrt((2 * Math.log(p.H)) / p.m1)
  const m = Math.ceil(((2 * p.B * p.R + Math.sqrt(Math.log(1 / p.delta) / 2)) / p.eps) ** 2)
  const dist = Math.hypot(p.pos[0] - p.neg[0], p.pos[1] - p.neg[1])
  const gap = Math.min(...p.poss) - Math.max(...p.negs)
  const wnorm = 2 / gap
  const prod = p.errs.reduce((t, e) => t * 2 * Math.sqrt(e * (1 - e)), 1)

  return {
    intro: 'Give answers to 4 decimal places, except the sample size (an integer, rounded up). Use natural logarithms.',
    parts: [
      {
        prompt: 'A finite class of ' + tex(p.H) + ' functions with values in ' + tex('\\{-1,+1\\}') + ' is evaluated on ' + tex('m=' + p.m1) + ' points. Massart\'s lemma bounds its Rademacher complexity by ' + tex('\\sqrt{2\\ln|\\mathcal H|/m}') + '. Evaluate it.',
        answer: massart, tolerance: tol4, lecture: 4,
        explanation: tex('\\sqrt{2\\ln' + p.H + '/' + p.m1 + '}=\\sqrt{2(' + dec(Math.log(p.H)) + ')/' + p.m1 + '}=' + dec(massart)) + '.',
      },
      {
        prompt: 'For linear predictors with ' + tex('\\|w\\|\\le' + p.B) + ' and ' + tex('\\|x\\|\\le' + p.R) + ', the Rademacher generalisation bound is ' + tex('\\text{gap}\\le 2BR/\\sqrt m+\\sqrt{\\ln(1/\\delta)/(2m)}') + ' with ' + tex('\\delta=' + dec(p.delta)) + '. What is the smallest sample size ' + tex('m') + ' making the right-hand side at most ' + tex(dec(p.eps)) + '?',
        answer: m, tolerance: tolInt, lecture: 4,
        explanation: 'Both terms scale as ' + tex('1/\\sqrt m') + ', so ' + tex('\\sqrt m\\ge(2BR+\\sqrt{\\ln(1/\\delta)/2})/\\varepsilon=(' + 2 * p.B * p.R + '+' + dec(Math.sqrt(Math.log(1 / p.delta) / 2)) + ')/' + dec(p.eps)) + ', i.e. ' + tex('m\\ge' + dec(((2 * p.B * p.R + Math.sqrt(Math.log(1 / p.delta) / 2)) / p.eps) ** 2)) + ', rounded up to ' + tex(m) + '.',
      },
      {
        prompt: 'The training set has one positive point ' + tex('(' + p.pos[0] + ',' + p.pos[1] + ')') + ' and one negative point ' + tex('(' + p.neg[0] + ',' + p.neg[1] + ')') + '. What is the geometric margin of the maximum-margin separating hyperplane?',
        answer: dist / 2, tolerance: tol4, lecture: 5,
        explanation: 'The optimal hyperplane is the perpendicular bisector of the segment joining the points, so the margin is half the distance: ' + tex('\\tfrac12\\sqrt{' + (p.pos[0] - p.neg[0]) ** 2 + '+' + (p.pos[1] - p.neg[1]) ** 2 + '}=' + dec(dist / 2)) + '.',
      },
      {
        prompt: 'In one dimension the negative examples are at ' + tex(p.negs.join(',\\ ')) + ' and the positive examples at ' + tex(p.poss.join(',\\ ')) + '. For the hard-margin SVM (constraints ' + tex('y_i(wx_i+b)\\ge1') + ', minimise ' + tex('|w|') + '), find ' + tex('|w|') + '.',
        answer: wnorm, tolerance: tol4, lecture: 5,
        explanation: 'Only the closest opposite pair matters: ' + tex(Math.max(...p.negs)) + ' and ' + tex(Math.min(...p.poss)) + ', at distance ' + tex(gap) + '. The margin is ' + tex(gap + '/2') + ' and ' + tex('|w|=1/\\text{margin}=' + dec(wnorm)) + '.',
      },
      {
        prompt: 'AdaBoost runs three rounds with weighted errors ' + tex('\\epsilon_1=' + dec(p.errs[0]) + ',\\ \\epsilon_2=' + dec(p.errs[1]) + ',\\ \\epsilon_3=' + dec(p.errs[2])) + '. Evaluate the upper bound ' + tex('\\prod_{t=1}^3 2\\sqrt{\\epsilon_t(1-\\epsilon_t)}') + ' on the training error of the final classifier.',
        answer: prod, tolerance: tol4, lecture: 6,
        explanation: p.errs.map((e) => tex('2\\sqrt{' + dec(e) + '\\times' + dec(1 - e) + '}=' + dec(2 * Math.sqrt(e * (1 - e))))).join(', ') + '; the product is ' + tex(dec(prod)) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'lt-lq-d-bounds', generate: (rng) => build(sample(rng)) }
