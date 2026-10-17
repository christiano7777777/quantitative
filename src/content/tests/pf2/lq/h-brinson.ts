// LQ-H: single-period Brinson attribution for three sectors: allocation, selection and interaction effects.
// Lecture 10 (performance attribution).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { wp: number[]; wb: number[]; rp: number[]; rb: number[] } // weights in %, returns in tenths of a percent

export function sample(rng: Rng): Params {
  const weights = () => { const a = rng.int(20, 50), b = rng.int(20, 50); return [a, b, 100 - a - b] }
  let wp: number[], wb: number[]
  do { wp = weights(); wb = weights() } while (wp[2] < 10 || wb[2] < 10)
  const rb = [0, 1, 2].map(() => rng.int(-20, 80))
  return { wp, wb, rp: rb.map((v) => v + rng.int(-25, 25)), rb }
}

export function build({ wp, wb, rp, rb }: Params): LQInstance {
  const WP = wp.map((v) => v / 100), WB = wb.map((v) => v / 100), RP = rp.map((v) => v / 10), RB = rb.map((v) => v / 10)
  const Rb = WB.reduce((s, w, i) => s + w * RB[i], 0)
  const Rp = WP.reduce((s, w, i) => s + w * RP[i], 0)
  const alloc = WP.map((w, i) => (w - WB[i]) * (RB[i] - Rb))
  const sel = WP.map((_, i) => WB[i] * (RP[i] - RB[i]))
  const inter = WP.map((w, i) => (w - WB[i]) * (RP[i] - RB[i]))
  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)
  const sectors = ['A', 'B', 'C']
  const row = (name: string, w: number[], r: number[]) => name + ' weights ' + tex(w.join(',') + '\\%') + ', returns ' + tex(r.map((v) => dec(v / 10)).join(',') + '\\%')

  return {
    intro:
      'Sectors ' + sectors.join(', ') + '. Portfolio: ' + row('', wp, rp) + '. Benchmark: ' + row('', wb, rb) + '. Use Brinson attribution with allocation ' + tex('(w^p_i-w^b_i)(R^b_i-R^b)') + ', selection ' + tex('w^b_i(R^p_i-R^b_i)') + ' and interaction ' + tex('(w^p_i-w^b_i)(R^p_i-R^b_i)') +
      ', where ' + tex('R^b') + ' is the total benchmark return. Give answers in per cent to 3 decimal places.',
    parts: [
      { prompt: 'Find the allocation effect of sector A.', answer: alloc[0], tolerance: tol3, lecture: 10, explanation: tex('R^b=' + dec(Rb) + ',\\ (' + dec(WP[0] - WB[0]) + ')(' + dec(RB[0]) + '-' + dec(Rb) + ')') + ' = ' + dec(alloc[0]) + '.' },
      { prompt: 'Find the selection effect of sector B.', answer: sel[1], tolerance: tol3, lecture: 10, explanation: tex(dec(WB[1]) + '(' + dec(RP[1]) + '-' + dec(RB[1]) + ')') + ' = ' + dec(sel[1]) + '.' },
      { prompt: 'Find the total interaction effect (sum over the three sectors).', answer: sum(inter), tolerance: tol3, lecture: 10, explanation: 'Sum of ' + tex('(w^p_i-w^b_i)(R^p_i-R^b_i)') + ' over sectors = ' + dec(sum(inter)) + '.' },
      { prompt: 'Find the total active return ' + tex('R^p-R^b') + ' of the portfolio.', answer: Rp - Rb, tolerance: tol3, lecture: 10, explanation: tex('R^p=' + dec(Rp) + ',\\ R^b=' + dec(Rb)) + ', so the active return is ' + dec(Rp - Rb) + '.' },
      { prompt: 'Find the total allocation effect (sum over sectors). The three total effects add up to the active return.', answer: sum(alloc), tolerance: tol3, lecture: 10, explanation: 'Allocation ' + dec(sum(alloc)) + ' + selection ' + dec(sum(sel)) + ' + interaction ' + dec(sum(inter)) + ' = ' + dec(Rp - Rb) + '.' },
    ],
  }
}

export const genH: LQGenerator = { id: 'pf2-lq-h-brinson', generate: (rng) => build(sample(rng)) }
