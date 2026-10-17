// LQ-B: confounding by a binary covariate (naive vs backdoor-adjusted effect, ATT weighting) and a nearest-neighbour matching estimate.
// Lectures 3 (confounding, backdoor adjustment) and 4 (adjustment and matching).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  n: number[][] // n[x][t]
  mu: number[][] // mu[x][t], mean outcome, tenths
  xt: number[]; yt: number[]; xc: number[]; yc: number[] // matching data
}

export function sample(rng: Rng): Params {
  const n = [[rng.int(20, 80), rng.int(10, 40)], [rng.int(10, 40), rng.int(20, 80)]]
  const base = rng.int(20, 50)
  const mu = [[base, base + rng.int(5, 20)], [base + rng.int(10, 30), base + rng.int(15, 40)]]
  for (;;) {
    const xt = Array.from({ length: 3 }, () => rng.int(0, 20)), xc = Array.from({ length: 4 }, () => rng.int(0, 20))
    // unique nearest controls (no ties) are needed
    const ok = xt.every((v) => { const d = xc.map((c) => Math.abs(c - v)).sort((a, b) => a - b); return d[0] !== d[1] })
    if (ok) return { n, mu, xt, yt: xt.map(() => rng.int(5, 30)), xc, yc: xc.map(() => rng.int(0, 25)) }
  }
}

export function build({ n, mu, xt, yt, xc, yc }: Params): LQInstance {
  const N = n.flat().reduce((a, b) => a + b, 0)
  const nT = n[0][1] + n[1][1], nC = n[0][0] + n[1][0]
  const m = (x: number, t: number) => mu[x][t] / 10
  const meanT = (n[0][1] * m(0, 1) + n[1][1] * m(1, 1)) / nT
  const meanC = (n[0][0] * m(0, 0) + n[1][0] * m(1, 0)) / nC
  const naive = meanT - meanC
  const px = [(n[0][0] + n[0][1]) / N, (n[1][0] + n[1][1]) / N]
  const adj = px[0] * (m(0, 1) - m(0, 0)) + px[1] * (m(1, 1) - m(1, 0))
  const pxT = [n[0][1] / nT, n[1][1] / nT]
  const att = pxT[0] * (m(0, 1) - m(0, 0)) + pxT[1] * (m(1, 1) - m(1, 0))
  const matched = xt.map((v, i) => { let best = 0; xc.forEach((c, j) => { if (Math.abs(c - v) < Math.abs(xc[best] - v)) best = j }); return yt[i] - yc[best] })
  const matchAtt = matched.reduce((a, v) => a + v, 0) / matched.length
  const tbl = String.raw`\begin{array}{c|cc} & T=0 & T=1 \\ \hline X=0:\ n,\ \bar Y & ${n[0][0]},\ ${dec(m(0, 0))} & ${n[0][1]},\ ${dec(m(0, 1))} \\ X=1:\ n,\ \bar Y & ${n[1][0]},\ ${dec(m(1, 0))} & ${n[1][1]},\ ${dec(m(1, 1))} \end{array}`

  return {
    intro: 'A binary covariate ' + tex('X') + ' affects both treatment ' + tex('T') + ' and outcome ' + tex('Y') + '. Group sizes and mean outcomes are $$' + tbl + '$$ Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the naive difference in mean outcome between treated and untreated units, ignoring ' + tex('X') + '.',
        answer: naive, tolerance: tol3, lecture: 3,
        explanation: 'Treated mean ' + tex('(' + n[0][1] + '\\cdot' + dec(m(0, 1)) + '+' + n[1][1] + '\\cdot' + dec(m(1, 1)) + ')/' + nT + '=' + dec(meanT)) + ', control mean ' + dec(meanC) + ', so ' + dec(naive) + '.',
      },
      {
        prompt: 'Adjusting for ' + tex('X') + ' by the backdoor formula, find the ATE ' + tex('\\sum_xP(x)\\{\\bar Y_{x,1}-\\bar Y_{x,0}\\}') + ' with ' + tex('P(x)') + ' the share of all units with ' + tex('X=x') + '.',
        answer: adj, tolerance: tol3, lecture: 3,
        explanation: tex('P(X=0)=' + dec(px[0]) + ',\\ P(X=1)=' + dec(px[1])) + '; the stratum effects are ' + dec(m(0, 1) - m(0, 0)) + ' and ' + dec(m(1, 1) - m(1, 0)) + ', giving ' + dec(adj) + '.',
      },
      {
        prompt: 'Find the confounding bias of the naive difference, ' + tex('\\text{naive}-\\text{adjusted ATE}') + '.',
        answer: naive - adj, tolerance: tol3, lecture: 3,
        explanation: tex(dec(naive) + '-' + dec(adj)) + ' = ' + dec(naive - adj) + '.',
      },
      {
        prompt: 'Find the ATT, weighting the stratum effects by the distribution of ' + tex('X') + ' among the treated units.',
        answer: att, tolerance: tol3, lecture: 4,
        explanation: tex('P(X=0\\mid T=1)=' + dec(pxT[0])) + ', so ' + tex(dec(pxT[0]) + '\\cdot' + dec(m(0, 1) - m(0, 0)) + '+' + dec(pxT[1]) + '\\cdot' + dec(m(1, 1) - m(1, 0))) + ' = ' + dec(att) + '.',
      },
      {
        prompt: 'Three treated units have covariate values ' + tex(xt.join(',')) + ' and outcomes ' + tex(yt.join(',')) + '; four controls have covariate values ' + tex(xc.join(',')) + ' and outcomes ' + tex(yc.join(',')) + '. Match each treated unit to the control with the nearest covariate value, and find the matching estimate of the ATT: the mean of (treated outcome minus matched control outcome).',
        answer: matchAtt, tolerance: tol4, lecture: 4,
        explanation: 'Differences ' + tex(matched.join(',')) + ' have mean ' + dec(matchAtt) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'ci-lq-b-adjust', generate: (rng) => build(sample(rng)) }
