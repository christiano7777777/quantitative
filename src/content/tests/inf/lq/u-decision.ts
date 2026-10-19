// LQ-U: the single question of STAT3602 lecture 1 (the decision problem, risk, admissibility, minimax). One story: a machine in a
// good or a bad state, one test outcome, a loss table and four candidate rules. The five parts follow the lecture: count the rules,
// compute a risk function, find the rule that is strictly dominated (inadmissible), find the minimax value.
// Lecture 1.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

type Rule = [number, number]
export interface Params { k: number; loss: number[][]; p: [number, number]; rules: Rule[] }

export const riskOf = (loss: number[][], p: [number, number], theta: 0 | 1, d: Rule) =>
  loss[theta][d[0]] * (1 - p[theta]) + loss[theta][d[1]] * p[theta]

/** `a` strictly dominates `b`: no larger risk at either state, and a smaller risk at one (compared with a tolerance for floats). */
const dominates = (a: [number, number], b: [number, number]) =>
  a[0] <= b[0] + 1e-9 && a[1] <= b[1] + 1e-9 && (a[0] < b[0] - 1e-9 || a[1] < b[1] - 1e-9)

export function sample(rng: Rng): Params {
  for (;;) {
    const k = rng.pick([3, 4])
    // good-state losses grow with the action (0 for "keep"), bad-state losses fall with it
    const up = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], k - 1).sort((a, b) => a - b)
    const down = rng.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], k).sort((a, b) => b - a)
    const loss = [[0, ...up], down]
    const p: [number, number] = [rng.pick([0.2, 0.3, 0.4]), rng.pick([0.6, 0.7, 0.8])]
    const all: Rule[] = []
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) all.push([i, j])
    const pick = rng.sample(all, 4)
    const risks = pick.map((d) => [riskOf(loss, p, 0, d), riskOf(loss, p, 1, d)] as [number, number])
    const dominated = pick.filter((_, i) => risks.some((r, j) => j !== i && dominates(r, risks[i])))
    const maxes = risks.map((r) => Math.max(...r))
    const best = Math.min(...maxes)
    const minimaxCount = maxes.filter((m) => Math.abs(m - best) < 1e-9).length
    const dominatedIdx = pick.findIndex((_, i) => risks.some((r, j) => j !== i && dominates(r, risks[i])))
    if (dominated.length === 1 && minimaxCount === 1 && Math.abs(maxes[dominatedIdx] - best) > 1e-9)
      return { k, loss, p, rules: pick }
  }
}

export function build({ k, loss, p, rules }: Params): LQInstance {
  const nm = (i: number) => 'a_' + (i + 1)
  const risks = rules.map((d) => [riskOf(loss, p, 0, d), riskOf(loss, p, 1, d)] as [number, number])
  const dIdx = rules.findIndex((_, i) => risks.some((r, j) => j !== i && dominates(r, risks[i])))
  const by = risks.findIndex((r, j) => j !== dIdx && dominates(r, risks[dIdx]))
  const maxes = risks.map((r) => Math.max(...r))
  const best = Math.min(...maxes)
  const mIdx = maxes.indexOf(best)
  const table = '$$\\begin{array}{c|' + 'c'.repeat(k) + '}' + ' & ' + Array.from({ length: k }, (_, i) => nm(i)).join(' & ') + ' \\\\ \\hline \\theta_1 & ' + loss[0].join(' & ') + ' \\\\ \\theta_2 & ' + loss[1].join(' & ') + '\\end{array}$$'
  const rname = (i: number) => 'd_' + (i + 1) + '=(' + nm(rules[i][0]) + ',' + nm(rules[i][1]) + ')'
  const pairs = risks.map((r, i) => tex('d_' + (i + 1) + ':(' + dec(r[0]) + ',' + dec(r[1]) + ')')).join(', ')

  return {
    intro: 'A machine is in state ' + tex('\\theta_1') + ' (good) or ' + tex('\\theta_2') + ' (bad). One test gives ' + tex('X\\in\\{0,1\\}') + ' with ' + tex('P(X=1\\mid\\theta_1)=' + dec(p[0])) + ' and ' + tex('P(X=1\\mid\\theta_2)=' + dec(p[1])) + '. The statistician must choose one of ' + tex(k) + ' actions, with loss ' + tex('L(\\theta,a)') + ' given by ' + table + ' A decision rule ' + tex('d=(d(0),d(1))') + ' says which action to take after each test outcome. Consider the four rules ' + rules.map((_, i) => tex(rname(i))).join(', ') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'How many different non-randomised decision rules are there for this problem (not only the four listed)? Give a whole number.',
        answer: k * k, tolerance: tolInt, lecture: 1,
        explanation: 'Each of the ' + tex(2) + ' outcomes can be sent to any of the ' + tex(k) + ' actions: ' + tex('|A|^{|S|}=' + k + '^2=' + k * k) + '.',
      },
      {
        prompt: 'Find the risk ' + tex('R(\\theta_1,d_1)=L(\\theta_1,d_1(0))P(X=0\\mid\\theta_1)+L(\\theta_1,d_1(1))P(X=1\\mid\\theta_1)') + ' of the first rule.',
        answer: risks[0][0], tolerance: tol4, lecture: 1,
        explanation: tex(loss[0][rules[0][0]] + '\\times' + dec(1 - p[0]) + '+' + loss[0][rules[0][1]] + '\\times' + dec(p[0])) + ' = ' + dec(risks[0][0]) + '.',
      },
      {
        prompt: 'Find the risk ' + tex('R(\\theta_2,d_1)') + ' of the first rule.',
        answer: risks[0][1], tolerance: tol4, lecture: 1,
        explanation: tex(loss[1][rules[0][0]] + '\\times' + dec(1 - p[1]) + '+' + loss[1][rules[0][1]] + '\\times' + dec(p[1])) + ' = ' + dec(risks[0][1]) + '.',
      },
      {
        prompt: 'Exactly one of the four rules is strictly dominated by another of them (and so is inadmissible). Compute the risk pair ' + tex('(R(\\theta_1,d),R(\\theta_2,d))') + ' of every rule and give the number ' + tex('i') + ' of the dominated rule ' + tex('d_i') + '. Give a whole number.',
        answer: dIdx + 1, tolerance: tolInt, lecture: 1,
        explanation: 'The risk pairs are ' + pairs + '. Rule ' + tex('d_' + (by + 1)) + ' has risks ' + dec(risks[by][0]) + ' and ' + dec(risks[by][1]) + ', no larger than ' + dec(risks[dIdx][0]) + ' and ' + dec(risks[dIdx][1]) + ' of ' + tex('d_' + (dIdx + 1)) + ', and smaller at one state, so ' + tex('d_' + (dIdx + 1)) + ' is strictly dominated.',
      },
      {
        prompt: 'Find the smallest value, over the four rules, of the maximum risk ' + tex('\\max_\\theta R(\\theta,d)') + '. (The rule that attains it is the minimax rule among the four.)',
        answer: best, tolerance: tol4, lecture: 1,
        explanation: 'The maximum risks are ' + maxes.map((m, i) => tex('d_' + (i + 1) + ':' + dec(m))).join(', ') + '. The smallest is ' + dec(best) + ', so ' + tex('d_' + (mIdx + 1)) + ' is minimax among the four.',
      },
    ],
  }
}

export const genU: LQGenerator = { id: 'inf-lq-u-decision', generate: (rng) => build(sample(rng)) }
