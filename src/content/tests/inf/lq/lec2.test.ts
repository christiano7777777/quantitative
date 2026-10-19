// Independent check of the single question of STAT3602 lecture 2 (generator V). Every answer is recomputed by a method that differs
// from the generator's own:
//  - the posterior and the Bayes risks from the full joint distribution of (theta, X) as exact fractions,
//  - the Bayes action and its expected loss by trying both actions on the posterior,
//  - the smallest Bayes risk by enumerating all four rules,
//  - the equalising probability by bisection on the difference of the two risks of the mixture (not by the closed form).
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { F, Fr } from '../../../shared/fraction'
import * as V from './v-bayesrisk'

const seeds = (n: number) => Array.from({ length: n }, (_, i) => `V${i}`)
const close = (got: number, want: number, tol = 1e-9, what = '') => expect(Math.abs(got - want), `${what}: got ${got}, want ${want}`).toBeLessThan(tol)
const fr = (x: number) => F(Math.round(x * 100), 100)

describe('generator V (the single question of lecture 2) against independent computation', () => {
  it('posterior, Bayes action, Bayes risks, smallest Bayes risk and the equalising mixture (300 seeds)', () => {
    for (const s of seeds(300)) {
      const P = V.sample(makeRng(s))
      const ans = V.build(P).parts.map((p) => p.answer)
      const a = F(P.a), b = F(P.b)
      const prior = [fr(P.w), F(1).sub(fr(P.w))]
      // f[theta][x]
      const f = [[F(1).sub(fr(P.p[0])), fr(P.p[0])], [F(1).sub(fr(P.p[1])), fr(P.p[1])]]
      // loss[theta][action]: action 0 = keep, 1 = replace
      const loss = [[F(0), a], [b, F(0)]]
      const joint = (th: number, x: number) => prior[th].mul(f[th][x])
      // posterior of theta_1 given X = 1, from the joint
      const px1 = joint(0, 1).add(joint(1, 1))
      const post = joint(0, 1).div(px1)
      close(ans[0], post.num, 1e-12, `${s} posterior`)
      // expected posterior loss of each action; the Bayes action is the smaller
      const el = [0, 1].map((act) => loss[0][act].mul(post).add(loss[1][act].mul(F(1).sub(post))))
      close(ans[1], (el[0].cmp(el[1]) <= 0 ? el[0] : el[1]).num, 1e-12, `${s} Bayes action loss`)
      // Bayes risk of every rule d = (d(0), d(1)) from the joint
      const bayes = (d: number[]) => {
        let r = F(0)
        for (let th = 0; th < 2; th++) for (let x = 0; x < 2; x++) r = r.add(joint(th, x).mul(loss[th][d[x]]))
        return r
      }
      close(ans[2], bayes([0, 1]).num, 1e-12, `${s} Bayes risk of A`)
      const all = [[0, 0], [0, 1], [1, 0], [1, 1]].map(bayes)
      let best = all[0]
      for (const r of all) if (r.cmp(best) < 0) best = r
      close(ans[3], best.num, 1e-12, `${s} smallest Bayes risk`)
      // equalising mixture of A = (keep, replace) and C = (replace, replace): risk of a rule at theta from the model alone
      const risk = (th: number, d: number[]) => f[th][0].mul(loss[th][d[0]]).add(f[th][1].mul(loss[th][d[1]]))
      const gap = (q: number) => {
        const qa = q, qc = 1 - q
        const r = (th: number) => qa * risk(th, [0, 1]).num + qc * risk(th, [1, 1]).num
        return r(0) - r(1)
      }
      let lo = 0, hi = 1
      expect(gap(lo) * gap(hi), `${s} risks cross inside (0,1)`).toBeLessThan(0)
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (gap(lo) * gap(mid) <= 0) hi = mid; else lo = mid }
      close(ans[4], lo, 1e-9, `${s} equalising q`)
      const common = lo * risk(1, [0, 1]).num
      close(ans[5], common, 1e-8, `${s} common risk`)
      close(lo * risk(0, [0, 1]).num + (1 - lo) * risk(0, [1, 1]).num, common, 1e-8, `${s} both risks equal`)
      // properties
      expect(ans[4]).toBeGreaterThan(0)
      expect(ans[4]).toBeLessThan(1)
    }
  })
})
