// Independent check of the single question of STAT4610 lecture 1 (generator S). The closed forms of the generator are NOT used:
// the posterior is built numerically on a fine grid as likelihood x prior, normalised, and its mean and variance are integrated;
// the posterior predictive variance is the variance of the mixture of N(mu, sigma^2) over that grid posterior; the credible limit
// is the 97.5% point of the grid posterior; the prior weight and the prior's worth in observations come from the precision identity
// 1/s_n^2 = 1/s0^2 + n/sigma^2 and from the mean as a weighted average, solved from the numerical results.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import * as S from './s-normalpost'

const seeds = (n: number) => Array.from({ length: n }, (_, i) => `S${i}`)
const close = (got: number, want: number, tol: number, what: string) => expect(Math.abs(got - want), `${what}: got ${got}, want ${want}`).toBeLessThan(tol)

describe('generator S (the single question of lecture 1) against independent computation', () => {
  it('posterior moments, prior weight, prior worth, predictive variance and credible limit by numerical integration (200 seeds)', () => {
    for (const s of seeds(200)) {
      const P = S.sample(makeRng(s))
      const ans = S.build(P).parts.map((p) => p.answer)
      const { mu0, s0sq, sigsq, n, ybar } = P
      // grid posterior for mu: likelihood of the n readings depends on mu only through ybar: N(ybar; mu, sigsq / n)
      const lo = Math.min(mu0, ybar) - 12 * Math.sqrt(Math.max(s0sq, sigsq / n))
      const hi = Math.max(mu0, ybar) + 12 * Math.sqrt(Math.max(s0sq, sigsq / n))
      const N = 40000
      const h = (hi - lo) / N
      const grid = Array.from({ length: N + 1 }, (_, i) => lo + i * h)
      const dens = grid.map((m) => Math.exp(-((ybar - m) ** 2) / (2 * (sigsq / n))) * Math.exp(-((m - mu0) ** 2) / (2 * s0sq)))
      const Z = dens.reduce((a, b) => a + b, 0) * h
      const w = dens.map((d) => (d * h) / Z)
      const mean = grid.reduce((a, m, i) => a + m * w[i], 0)
      const variance = grid.reduce((a, m, i) => a + (m - mean) ** 2 * w[i], 0)
      close(ans[0], mean, 1e-6, `${s} posterior mean`)
      close(ans[1], variance, 1e-6, `${s} posterior variance`)
      // weight on the prior mean from mean = w mu0 + (1-w) ybar
      close(ans[2], (ybar - mean) / (ybar - mu0), 1e-6, `${s} prior weight`)
      // prior worth: 1/s_n^2 = 1/s0^2 + n/sigma^2 = (n + n0)/sigma^2  =>  n0 = sigma^2 / s_n^2 - n
      close(ans[3], sigsq / variance - n, 1e-4, `${s} prior worth in observations`)
      // predictive variance: variance of N(mu, sigsq) mixed over the grid posterior = sigsq + variance of mu (law of total variance, from the grid)
      const predMean = mean
      const pred = grid.reduce((a, m, i) => a + (sigsq + (m - predMean) ** 2) * w[i], 0)
      close(ans[4], pred, 1e-6, `${s} predictive variance`)
      // 97.5% point of the grid posterior (the upper end of the central 95% credible interval)
      let cum = 0
      let q975 = hi
      for (let i = 0; i <= N; i++) { cum += w[i]; if (cum >= 0.975) { q975 = grid[i]; break } }
      close(ans[5], q975, 2e-2, `${s} credible limit`)
      // properties
      expect(Math.abs(ybar - mu0), `${s} the data disagree with the prior`).toBeGreaterThan(1.9)
      expect(ans[2]).toBeGreaterThan(0)
      expect(ans[2]).toBeLessThan(1)
    }
  })
})
