// LQ-M: a finite decision problem (two parameter values, one binary observation): number of rules and risk functions.
// Lecture 1 (the decision problem).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { k: number; loss: number[][]; p: [number, number]; d: [number, number]; e: [number, number] }

export function sample(rng: Rng): Params {
  for (;;) {
    const k = rng.pick([2, 3, 3, 4])
    const loss = [0, 1].map(() => Array.from({ length: k }, () => rng.int(0, 9)))
    const p: [number, number] = [rng.pick([0.2, 0.3, 0.4]), rng.pick([0.6, 0.7, 0.8])]
    const d: [number, number] = [rng.int(0, k - 1), rng.int(0, k - 1)]
    const e: [number, number] = [rng.int(0, k - 1), rng.int(0, k - 1)]
    if ((d[0] !== e[0] || d[1] !== e[1]) && loss[0].some((v, i) => v !== loss[0][(i + 1) % k])) return { k, loss, p, d, e }
  }
}

export const risk = (loss: number[][], p: [number, number], theta: 0 | 1, d: [number, number]) =>
  loss[theta][d[0]] * (1 - p[theta]) + loss[theta][d[1]] * p[theta]

export function build({ k, loss, p, d, e }: Params): LQInstance {
  const r1 = risk(loss, p, 0, d), r2 = risk(loss, p, 1, d)
  const s1 = risk(loss, p, 0, e), s2 = risk(loss, p, 1, e)
  const nm = (i: number) => 'a_' + (i + 1)
  const table = '$$\\begin{array}{c|' + 'c'.repeat(k) + '}' + ' & ' + Array.from({ length: k }, (_, i) => nm(i)).join(' & ') + ' \\\\ \\hline \\theta_1 & ' + loss[0].join(' & ') + ' \\\\ \\theta_2 & ' + loss[1].join(' & ') + '\\end{array}$$'
  const dom = s1 <= r1 && s2 <= r2 && (s1 < r1 || s2 < r2) ? ' so ' + tex('d\'') + ' strictly dominates ' + tex('d') : r1 <= s1 && r2 <= s2 && (r1 < s1 || r2 < s2) ? ' so ' + tex('d') + ' strictly dominates ' + tex('d\'') : ', and neither rule dominates the other'

  return {
    intro: 'A machine is in state ' + tex('\\theta_1') + ' (good) or ' + tex('\\theta_2') + ' (bad). One test gives ' + tex('X\\in\\{0,1\\}') + ' with ' + tex('P(X=1\\mid\\theta_1)=' + dec(p[0])) + ' and ' + tex('P(X=1\\mid\\theta_2)=' + dec(p[1])) + '. There are ' + tex(k) + ' actions with loss ' + tex('L(\\theta,a)') + ': ' + table + ' A decision rule maps each outcome to an action and is written ' + tex('d=(d(0),d(1))') + '. Take ' + tex('d=(' + nm(d[0]) + ',' + nm(d[1]) + ')') + ' and ' + tex('d\'=(' + nm(e[0]) + ',' + nm(e[1]) + ')') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'How many different non-randomised decision rules are there? Give a whole number.',
        answer: k * k, tolerance: tolInt, lecture: 1,
        explanation: 'Each of the ' + tex(2) + ' outcomes can be sent to any of ' + tex(k) + ' actions: ' + tex(k + '^2=' + k * k) + '.',
      },
      {
        prompt: 'Find the risk ' + tex('R(\\theta_1,d)=L(\\theta_1,d(0))P(X=0\\mid\\theta_1)+L(\\theta_1,d(1))P(X=1\\mid\\theta_1)') + '.',
        answer: r1, tolerance: tol4, lecture: 1,
        explanation: tex(loss[0][d[0]] + '\\times' + dec(1 - p[0]) + '+' + loss[0][d[1]] + '\\times' + dec(p[0])) + ' = ' + dec(r1) + '.',
      },
      {
        prompt: 'Find the risk ' + tex('R(\\theta_2,d)') + '.',
        answer: r2, tolerance: tol4, lecture: 1,
        explanation: tex(loss[1][d[0]] + '\\times' + dec(1 - p[1]) + '+' + loss[1][d[1]] + '\\times' + dec(p[1])) + ' = ' + dec(r2) + '.',
      },
      {
        prompt: 'Find the risk ' + tex('R(\\theta_1,d\'\\,)') + ' of the second rule.',
        answer: s1, tolerance: tol4, lecture: 1,
        explanation: tex(loss[0][e[0]] + '\\times' + dec(1 - p[0]) + '+' + loss[0][e[1]] + '\\times' + dec(p[0])) + ' = ' + dec(s1) + '.',
      },
      {
        prompt: 'Find the risk ' + tex('R(\\theta_2,d\'\\,)') + ' of the second rule.',
        answer: s2, tolerance: tol4, lecture: 1,
        explanation: tex(loss[1][e[0]] + '\\times' + dec(1 - p[1]) + '+' + loss[1][e[1]] + '\\times' + dec(p[1])) + ' = ' + dec(s2) + '. Comparing the risk pairs ' + tex('(' + dec(r1) + ',' + dec(r2) + ')') + ' and ' + tex('(' + dec(s1) + ',' + dec(s2) + ')') + dom + '.',
      },
    ],
  }
}

export const genM: LQGenerator = { id: 'inf-lq-m-decision', generate: (rng) => build(sample(rng)) }
