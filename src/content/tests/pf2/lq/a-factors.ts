// LQ-A: factor-implied expected return, SMB and HML from a 2x3 sort, and a Fama-MacBeth premium with its t statistic.
// Lectures 1 (multi-factor models), 2 (Fama-French factors), 3 (Fama-MacBeth).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  rf: number; beta: number[]; lam: number[] // percent per year, in tenths of a percent for rf and lam
  port: number[] // SL, SM, SH, BL, BM, BH monthly returns in tenths of a percent
  slopes: number[] // six monthly cross-sectional slopes, tenths of a percent
}

export function sample(rng: Rng): Params {
  return {
    rf: rng.int(10, 40), beta: [rng.int(6, 14) / 10, rng.int(-4, 8) / 10, rng.int(-4, 8) / 10], lam: [rng.int(40, 80), rng.int(0, 30), rng.int(0, 50)],
    port: Array.from({ length: 6 }, () => rng.int(-20, 40)), slopes: Array.from({ length: 6 }, () => rng.int(-30, 60)),
  }
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length

export function build({ rf, beta, lam, port, slopes }: Params): LQInstance {
  const exp = rf / 10 + beta.reduce((s, b, k) => s + b * lam[k] / 10, 0)
  const [sl, sm, sh, bl, bm, bh] = port.map((v) => v / 10)
  const smb = (sl + sm + sh) / 3 - (bl + bm + bh) / 3
  const hml = (sh + bh) / 2 - (sl + bl) / 2
  const s = slopes.map((v) => v / 10)
  const m = mean(s)
  const sd = Math.sqrt(s.reduce((a, v) => a + (v - m) ** 2, 0) / (s.length - 1))
  const t = m / (sd / Math.sqrt(s.length))

  return {
    intro: 'Give answers to 3 decimal places. Returns are in per cent.',
    parts: [
      {
        prompt: 'A stock has exposures ' + tex('\\beta=(' + beta.map(dec).join(',') + ')') + ' to three factors whose annual risk premia are ' + tex('(' + lam.map((v) => dec(v / 10)).join(',') + ')') + '\\%. The risk-free rate is ' + tex(dec(rf / 10) + '\\%') + '. Find its factor-implied expected annual return (per cent).',
        answer: exp, tolerance: tol3, lecture: 1,
        explanation: tex(dec(rf / 10) + '+' + beta.map((b, k) => dec(b) + '\\cdot' + dec(lam[k] / 10)).join('+')) + ' = ' + dec(exp) + '.',
      },
      {
        prompt: 'In a ' + tex('2\\times3') + ' sort on size and book-to-market, the monthly returns (per cent) of the small portfolios (low, medium, high book-to-market) are ' + tex([sl, sm, sh].map(dec).join(',')) + ' and of the big portfolios ' + tex([bl, bm, bh].map(dec).join(',')) + '. Find SMB, the average of the small portfolios minus the average of the big ones.',
        answer: smb, tolerance: tol3, lecture: 2,
        explanation: tex('\\tfrac13(' + dec(sl + sm + sh) + ')-\\tfrac13(' + dec(bl + bm + bh) + ')') + ' = ' + dec(smb) + '.',
      },
      {
        prompt: 'For the same portfolios, find HML, the average of the two high book-to-market portfolios minus the average of the two low ones.',
        answer: hml, tolerance: tol3, lecture: 2,
        explanation: tex('\\tfrac12(' + dec(sh) + '+' + dec(bh) + ')-\\tfrac12(' + dec(sl) + '+' + dec(bl) + ')') + ' = ' + dec(hml) + '.',
      },
      {
        prompt: 'The monthly cross-sectional slopes on a characteristic in a Fama-MacBeth analysis are ' + tex(s.map(dec).join(',')) + ' (per cent). Find the risk premium estimate, their average.',
        answer: m, tolerance: tol3, lecture: 3,
        explanation: 'The average of the six slopes is ' + dec(m) + '.',
      },
      {
        prompt: 'Find the Fama-MacBeth ' + tex('t') + ' statistic ' + tex('\\bar\\lambda/(s/\\sqrt6)') + ', with ' + tex('s') + ' the sample standard deviation (divisor 5) of the slopes.',
        answer: t, tolerance: tol3, lecture: 3,
        explanation: tex('s=' + dec(sd)) + ', so ' + tex('t=' + dec(m) + '/(' + dec(sd) + '/\\sqrt6)') + ' = ' + dec(t) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'pf2-lq-a-factors', generate: (rng) => build(sample(rng)) }
