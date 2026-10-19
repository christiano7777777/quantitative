// np lecture 5 (paired samples and blocks): one story. Six subjects each measured under three conditions: the signed-rank test for
// the first two conditions, then the Friedman test, Kendall's W and the chi-square p-value for all three.
// Lecture 5.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { data: number[][] }

export function sample(rng: Rng): Params {
  for (;;) {
    const data = Array.from({ length: 6 }, () => rng.sample(Array.from({ length: 30 }, (_, i) => i + 1), 3))
    const d = data.map((r) => r[1] - r[0])
    const ad = d.map(Math.abs)
    if (d.every((v) => v !== 0) && new Set(ad).size === ad.length && d.some((v) => v > 0) && d.some((v) => v < 0)) return { data }
  }
}

export function build({ data }: Params): LQInstance {
  const n = data.length, k = 3
  const d = data.map((r) => r[1] - r[0])
  const ad = d.map(Math.abs)
  const rk = ad.map((a) => ad.filter((b) => b < a).length + 1)
  const Tplus = d.reduce((s, v, i) => s + (v > 0 ? rk[i] : 0), 0)
  const meanT = (n * (n + 1)) / 4
  const sdT = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24)
  const z = (Tplus - meanT) / sdT
  const ranks = data.map((r) => r.map((v) => r.filter((w) => w < v).length + 1))
  const Rp = [0, 1, 2].map((j) => ranks.reduce((s, r) => s + r[j], 0))
  const FM = (12 / (n * k * (k + 1))) * Rp.reduce((s, r) => s + r * r, 0) - 3 * n * (k + 1)
  const W = FM / (n * (k - 1))
  const p = Math.exp(-FM / 2)

  return {
    intro: 'A clinic measures the recovery score of ' + tex(n) + ' patients under three treatments ' + tex('1,2,3') + '. The scores (treatment 1, 2, 3) are ' + data.map((r) => tex('(' + r.join(',') + ')')).join(', ') + '. First compare treatments 1 and 2 as paired samples with differences ' + tex('d_i=\\text{score}_2-\\text{score}_1') + '; then compare all three treatments with the patients as blocks. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Rank the absolute differences ' + tex('|d_i|') + ' from 1 (smallest) and let ' + tex('T^+') + ' be the sum of the ranks of the positive differences. Find ' + tex('T^+') + '. Give a whole number.',
        answer: Tplus, tolerance: tolInt, lecture: 5,
        explanation: 'Differences ' + d.join(', ') + ' have absolute ranks ' + rk.join(', ') + '. The positive ones have ranks ' + rk.filter((_, i) => d[i] > 0).join(', ') + ', summing to ' + tex(Tplus) + '.',
      },
      {
        prompt: 'Under no treatment difference ' + tex('E[T^+]=n(n+1)/4') + ' and ' + tex('\\mathrm{Var}(T^+)=n(n+1)(2n+1)/24') + '. Find ' + tex('z=(T^+-E[T^+])/\\sqrt{\\mathrm{Var}(T^+)}') + '.',
        answer: z, tolerance: tol4, lecture: 5,
        explanation: tex('E[T^+]=' + dec(meanT)) + ', ' + tex('\\sqrt{\\mathrm{Var}}=' + dec(sdT)) + ', so ' + tex('z=(' + Tplus + '-' + dec(meanT) + ')/' + dec(sdT)) + ' = ' + dec(z) + '.',
      },
      {
        prompt: 'Now rank the three scores of each patient from 1 to 3. Find the rank sum ' + tex('R_{3}') + ' of treatment 3 over the patients. Give a whole number.',
        answer: Rp[2], tolerance: tolInt, lecture: 5,
        explanation: 'Within-patient ranks of treatment 3: ' + ranks.map((r) => r[2]).join(', ') + ', summing to ' + tex(Rp[2]) + '. The rank sums of treatments 1, 2, 3 are ' + Rp.join(', ') + '.',
      },
      {
        prompt: 'Find the Friedman statistic ' + tex('FM=\\dfrac{12}{nk(k+1)}\\sum_jR_j^2-3n(k+1)') + '.',
        answer: FM, tolerance: tol4, lecture: 5,
        explanation: tex('\\dfrac{12}{' + n * k * (k + 1) + '}(' + Rp.map((r) => r + '^2').join('+') + ')-' + 3 * n * (k + 1)) + ' = ' + dec(FM) + '.',
      },
      {
        prompt: 'Find Kendall\'s coefficient of concordance ' + tex('W=FM/\\{n(k-1)\\}') + ', which is 1 when all patients rank the treatments identically and 0 under no agreement.',
        answer: W, tolerance: tol4, lecture: 5,
        explanation: tex(dec(FM) + '/(' + n + '\\times' + (k - 1) + ')') + ' = ' + dec(W) + '.',
      },
      {
        prompt: 'Under no treatment difference ' + tex('FM') + ' is approximately ' + tex('\\chi^2_{k-1}=\\chi^2_2') + ', with ' + tex('P(\\chi^2_2>h)=e^{-h/2}') + '. Find the approximate p-value.',
        answer: p, tolerance: tol4, lecture: 5,
        explanation: tex('e^{-' + dec(FM) + '/2}') + ' = ' + dec(p) + '.',
      },
    ],
  }
}

export const genLec5: LQGenerator = { id: 'np-lq-lec5', generate: (rng) => build(sample(rng)) }
