// LQ-D: simple functions built from overlapping interval indicators: integrals, level-set measures, a.e. modification, sublevel sets.
// Lectures 5 (measurable functions) and 6 (the Lebesgue integral).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Interval { l: number; r: number; a: number }
export interface Params { iv: Interval[]; t: number; u: number; v: number; m: number; c: number }

export function sample(rng: Rng): Params {
  const iv: Interval[] = []
  for (let i = 0; i < 3; i++) {
    const l = rng.int(0, 7)
    iv.push({ l, r: l + rng.int(2, 10 - l > 2 ? 10 - l : 2), a: rng.int(1, 5) })
  }
  for (const x of iv) x.r = Math.min(x.r, 10)
  const u = rng.int(0, 6)
  return { iv, t: rng.int(1, 6), u, v: u + rng.int(2, 4), m: rng.int(0, 10), c: rng.int(2, 30) }
}

/** Lengths of the pieces on which phi is constant: breakpoints are the interval endpoints. */
function pieces(iv: Interval[]): { l: number; r: number; val: number }[] {
  const pts = [...new Set([0, 10, ...iv.flatMap((x) => [x.l, x.r])])].sort((a, b) => a - b)
  const out: { l: number; r: number; val: number }[] = []
  for (let i = 0; i + 1 < pts.length; i++) {
    const mid = (pts[i] + pts[i + 1]) / 2
    out.push({ l: pts[i], r: pts[i + 1], val: iv.reduce((s, x) => s + (x.l < mid && mid < x.r ? x.a : 0), 0) })
  }
  return out
}

export function build({ iv, t, u, v, m, c }: Params): LQInstance {
  const ps = pieces(iv)
  const integral = iv.reduce((s, x) => s + x.a * (x.r - x.l), 0)
  const above = ps.filter((p) => p.val > t).reduce((s, p) => s + (p.r - p.l), 0)
  const square = ps.reduce((s, p) => s + p.val * p.val * (p.r - p.l), 0)
  const part = ps.reduce((s, p) => s + p.val * Math.max(0, Math.min(p.r, v) - Math.max(p.l, u)), 0)
  const root = Math.sqrt(c)
  const sub = Math.max(0, Math.min(10, m + root) - Math.max(0, m - root))
  const phi = iv.map((x) => x.a + '\\cdot1_{[' + x.l + ',' + x.r + ']}').join('+')

  return {
    intro: 'Let ' + tex('\\lambda') + ' be Lebesgue measure and ' + tex('\\varphi=' + phi) + ' on ' + tex('[0,10]') + ' (and ' + tex('0') + ' elsewhere), a sum of indicator functions of overlapping intervals. Integer answers are exact; give the other answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Let ' + tex('\\psi=\\varphi+7\\cdot1_{\\mathbb Q}') + ' (so ' + tex('\\psi') + ' differs from ' + tex('\\varphi') + ' only on the rationals). Find ' + tex('\\int\\psi\\,d\\lambda') + '.',
        answer: integral, tolerance: tolInt, lecture: 6,
        explanation: tex('\\mathbb Q') + ' is a null set, so ' + tex('\\int\\psi=\\int\\varphi') + '. By linearity ' + tex('\\int\\varphi=\\sum_ia_i\\lambda(I_i)=' + iv.map((x) => x.a + '\\cdot' + (x.r - x.l)).join('+') + '=' + integral) + '.',
      },
      {
        prompt: 'Find ' + tex('\\lambda(\\{x:\\varphi(x)>' + t + '\\})') + ', the measure of a superlevel set of ' + tex('\\varphi') + '. (Where intervals overlap the values add.)',
        answer: above, tolerance: tolInt, lecture: 5,
        explanation: 'Split ' + tex('[0,10]') + ' at the endpoints. The pieces and values of ' + tex('\\varphi') + ' are ' + ps.map((p) => tex('[' + p.l + ',' + p.r + ']:' + p.val)).join(', ') + '. The pieces with value above ' + tex(String(t)) + ' have total length ' + tex(String(above)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\int\\varphi^2\\,d\\lambda') + '.',
        answer: square, tolerance: tolInt, lecture: 6,
        explanation: tex('\\varphi^2') + ' is simple, with value ' + tex('\\text{val}^2') + ' on each piece, so ' + tex('\\int\\varphi^2=\\sum_{\\text{pieces}}\\text{val}^2\\cdot\\text{length}=' + square) + '. (Note that ' + tex('\\int\\varphi^2\\ne\\sum a_i^2\\lambda(I_i)') + ' when intervals overlap.)',
      },
      {
        prompt: 'Find ' + tex('\\int_{[' + u + ',' + v + ']}\\varphi\\,d\\lambda') + '.',
        answer: part, tolerance: tolInt, lecture: 6,
        explanation: 'Integrate the simple function over the piece-by-piece intersection with ' + tex('[' + u + ',' + v + ']') + ': ' + tex(String(part)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\lambda(\\{x\\in[0,10]:(x-' + m + ')^2<' + c + '\\})') + ', the measure of a sublevel set of the continuous function ' + tex('(x-' + m + ')^2') + '. Give 4 decimal places.',
        answer: sub, tolerance: tol4, lecture: 5,
        explanation: tex('(x-' + m + ')^2<' + c) + ' means ' + tex('|x-' + m + '|<\\sqrt{' + c + '}=' + dec(root)) + ', the interval ' + tex('(' + dec(m - root) + ',' + dec(m + root) + ')') + '. Intersecting with ' + tex('[0,10]') + ' leaves length ' + tex(dec(sub)) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'ra-lq-d-simple', generate: (rng) => build(sample(rng)) }
