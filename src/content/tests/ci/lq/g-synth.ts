// LQ-G: a two-donor synthetic control: weight, synthetic post-treatment outcome, effect, pre-period RMSPE, permutation p-value.
// Lecture 9 (synthetic control).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { yt: number; y1: number; y2: number; z1: number; z2: number; zt: number; gaps: number[]; ratios: number[]; ratioT: number } // outcomes in tenths

export function sample(rng: Rng): Params {
  const y2 = rng.int(20, 50), yt = y2 + rng.int(5, 30), y1 = yt + rng.int(5, 30)
  const z1 = y1 + rng.int(0, 20), z2 = y2 + rng.int(0, 20)
  const w = (yt - y2) / (y1 - y2)
  const synth = w * z1 + (1 - w) * z2
  const ratios = Array.from({ length: 9 }, () => rng.int(5, 40) / 10)
  return { yt, y1, y2, z1, z2, zt: Math.round(synth + rng.int(15, 60)), gaps: [rng.int(-8, 8), rng.int(-8, 8), rng.int(-8, 8)], ratios, ratioT: rng.int(5, 45) }
}

export function build(p: Params): LQInstance {
  const [yt, y1, y2, z1, z2, zt] = [p.yt, p.y1, p.y2, p.z1, p.z2, p.zt].map((v) => v / 10)
  const w = (yt - y2) / (y1 - y2)
  const synth = w * z1 + (1 - w) * z2
  const eff = zt - synth
  const g = p.gaps.map((v) => v / 10)
  const rmspe = Math.sqrt(g.reduce((a, v) => a + v * v, 0) / g.length)
  const pval = (1 + p.ratios.filter((v) => v >= p.ratioT).length) / (p.ratios.length + 1)

  return {
    intro:
      'One treated unit and two donor units are observed. In the pre-treatment period their outcomes are ' + tex(dec(yt)) + ' (treated), ' + tex(dec(y1)) + ' (donor 1) and ' + tex(dec(y2)) + ' (donor 2). After treatment they are ' + tex(dec(zt)) + ', ' + tex(dec(z1)) + ' and ' + tex(dec(z2)) + ' respectively. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The synthetic control is ' + tex('w\\cdot\\text{donor 1}+(1-w)\\cdot\\text{donor 2}') + ' with ' + tex('0\\le w\\le1') + ', chosen to reproduce the treated unit\'s pre-treatment outcome exactly. Find ' + tex('w') + '.',
        answer: w, tolerance: tol4, lecture: 9,
        explanation: tex('w' + dec(y1) + '+(1-w)' + dec(y2) + '=' + dec(yt)) + ' gives ' + tex('w=(' + dec(yt) + '-' + dec(y2) + ')/(' + dec(y1) + '-' + dec(y2) + ')') + ' = ' + dec(w) + '.',
      },
      {
        prompt: 'Find the synthetic control\'s post-treatment outcome.',
        answer: synth, tolerance: tol4, lecture: 9,
        explanation: tex(dec(w) + '\\cdot' + dec(z1) + '+' + dec(1 - w) + '\\cdot' + dec(z2)) + ' = ' + dec(synth) + '.',
      },
      {
        prompt: 'Find the estimated treatment effect: the treated unit\'s post-treatment outcome minus the synthetic control\'s.',
        answer: eff, tolerance: tol4, lecture: 9,
        explanation: tex(dec(zt) + '-' + dec(synth)) + ' = ' + dec(eff) + '.',
      },
      {
        prompt: 'In three earlier pre-treatment periods, the gaps between the treated unit and its synthetic control were ' + tex(g.map(dec).join(',')) + '. Find the pre-treatment root mean squared prediction error (RMSPE).',
        answer: rmspe, tolerance: tol4, lecture: 9,
        explanation: tex('\\sqrt{(' + g.map((v) => dec(v * v)).join('+') + ')/3}') + ' = ' + dec(rmspe) + '.',
      },
      {
        prompt: 'The ratio of post- to pre-treatment RMSPE is ' + tex(dec(p.ratioT / 10)) + ' for the treated unit, and ' + tex(p.ratios.map((v) => dec(v / 10)).join(',')) + ' for nine placebo donors treated as if they had received the policy. Find the permutation p-value: the share of the ten units (treated included) whose ratio is at least as large as the treated unit\'s.',
        answer: pval, tolerance: tol3, lecture: 9,
        explanation: 'Placebo ratios at least ' + dec(p.ratioT / 10) + ': ' + p.ratios.filter((v) => v >= p.ratioT).length + ', so ' + tex('(1+' + p.ratios.filter((v) => v >= p.ratioT).length + ')/10') + ' = ' + dec(pval) + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'ci-lq-g-synth', generate: (rng) => build(sample(rng)) }
