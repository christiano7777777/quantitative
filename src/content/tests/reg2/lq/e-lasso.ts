// LQ-E: soft-thresholding for the lasso and the elastic net on an orthonormal design, a coordinate descent update, and a cross-validation table.
// Lectures 7 (lasso, soft-thresholding, coordinate descent) and 8 (elastic net, choosing lambda by cross-validation, one-standard-error rule).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4, tolInt } from '../../../shared/format'

export interface Params {
  b: number; lam: number // one OLS coefficient and the lasso penalty
  coefs: number[]; thr: number // five OLS coefficients and a threshold
  enLam: number; alpha: number
  xj: number[]; res: number[]; cdLam: number // coordinate descent data
  grid: number[]; cv: number[]; se: number[] // CV table
}

export const soft = (z: number, t: number) => Math.sign(z) * Math.max(Math.abs(z) - t, 0)

export function sample(rng: Rng): Params {
  const grid = [0.01, 0.03, 0.1, 0.3, 1, 3]
  const centre = rng.int(1, 4)
  const cv = grid.map((_, i) => Math.round((1 + 0.06 * (i - centre) ** 2 + rng.int(0, 15) / 1000) * 1000) / 1000)
  const se = grid.map(() => rng.int(25, 70) / 1000)
  let xj: number[]
  do xj = Array.from({ length: 4 }, () => rng.int(-3, 3))
  while (xj.every((v) => v === 0))
  return {
    b: rng.int(-32, 32) / 10, lam: rng.pick([0.5, 1, 1.5]),
    coefs: Array.from({ length: 5 }, () => rng.int(-30, 30) / 10), thr: rng.pick([0.5, 1, 1.5]),
    enLam: rng.pick([1, 2]), alpha: rng.pick([0.25, 0.5, 0.75]),
    xj, res: Array.from({ length: 4 }, () => rng.int(-4, 4)), cdLam: rng.pick([0.5, 1, 2]),
    grid, cv, se,
  }
}

/** The lambda picked by the one-standard-error rule: the largest lambda with CV error within one SE of the minimum. */
export function oneSe(grid: number[], cv: number[], se: number[]) {
  const m = cv.indexOf(Math.min(...cv))
  const th = (v: number) => Math.round(v * 1000) // thousandths, so that a tie at the limit is not lost to float noise
  const limit = th(cv[m]) + th(se[m])
  let pick = m
  for (let i = 0; i < grid.length; i++) if (th(cv[i]) <= limit && grid[i] > grid[pick]) pick = i
  return grid[pick]
}

export function build(p: Params): LQInstance {
  const lasso = soft(p.b, p.lam)
  const nz = p.coefs.filter((c) => Math.abs(c) > p.thr).length
  const en = soft(p.b, p.enLam * p.alpha) / (1 + p.enLam * (1 - p.alpha))
  const n = p.xj.length
  const z = p.xj.reduce((s, v, i) => s + v * p.res[i], 0) / n
  const den = p.xj.reduce((s, v) => s + v * v, 0) / n
  const cd = den === 0 ? 0 : soft(z, p.cdLam) / den
  const lamSe = oneSe(p.grid, p.cv, p.se)
  const col = (v: number[]) => '(' + v.join(',') + ')'
  const rows = p.grid.map((g, i) => tex(dec(g)) + ': ' + tex(dec(p.cv[i])) + ' (se ' + tex(dec(p.se[i])) + ')').join('; ')

  return {
    intro: 'The predictors are orthonormal, so each penalised coefficient depends only on the least squares coefficient ' + tex('b') + '. Give decimal answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The lasso minimises ' + tex('\\tfrac12\\|y-X\\beta\\|^2+\\lambda\\|\\beta\\|_1') + '. With ' + tex('\\lambda=' + dec(p.lam)) + ' and least squares coefficient ' + tex('b=' + dec(p.b)) + ', find the lasso coefficient.',
        answer: lasso, tolerance: tol3, lecture: 7,
        explanation: 'Soft-thresholding: ' + tex('\\operatorname{sign}(b)(|b|-\\lambda)_+') + ' = ' + dec(lasso) + '.',
      },
      {
        prompt: 'The least squares coefficients of five predictors are ' + p.coefs.map((c) => tex(dec(c))).join(', ') + '. How many lasso coefficients are nonzero when ' + tex('\\lambda=' + dec(p.thr)) + '?',
        answer: nz, tolerance: tolInt, lecture: 7,
        explanation: 'A coefficient survives exactly when ' + tex('|b_j|>\\lambda=' + dec(p.thr)) + '; that happens for ' + nz + ' of the five.',
      },
      {
        prompt: 'The elastic net minimises ' + tex('\\tfrac12\\|y-X\\beta\\|^2+\\lambda\\{\\alpha\\|\\beta\\|_1+\\tfrac{1-\\alpha}{2}\\|\\beta\\|_2^2\\}') + '. With ' + tex('\\lambda=' + p.enLam + ',\\ \\alpha=' + dec(p.alpha)) + ' and ' + tex('b=' + dec(p.b)) + ', find the elastic net coefficient (4 decimal places).',
        answer: en, tolerance: tol4, lecture: 8,
        explanation: 'For an orthonormal design the solution is ' + tex('\\dfrac{S(b,\\lambda\\alpha)}{1+\\lambda(1-\\alpha)}=\\dfrac{S(' + dec(p.b) + ',' + dec(p.enLam * p.alpha) + ')}{' + dec(1 + p.enLam * (1 - p.alpha)) + '}') + ' = ' + dec(en) + '.',
      },
      {
        prompt: 'In coordinate descent for a lasso with objective ' + tex('\\frac1{2n}\\|r-x_j\\beta_j\\|^2+\\lambda|\\beta_j|') + ', the partial residual is ' + tex('r=' + col(p.res)) + ' and ' + tex('x_j=' + col(p.xj)) + ' (' + tex('n=4') + '). With ' + tex('\\lambda=' + dec(p.cdLam)) +
          ', the update is ' + tex('\\beta_j\\leftarrow S\\big(x_j^\\top r/n,\\lambda\\big)\\big/\\big(x_j^\\top x_j/n\\big)') + '. Find the new ' + tex('\\beta_j') + '.',
        answer: cd, tolerance: tol3, lecture: 7,
        explanation: tex('x_j^\\top r/n=' + dec(z) + ',\\ x_j^\\top x_j/n=' + dec(den)) + ', so ' + tex('\\beta_j=S(' + dec(z) + ',' + dec(p.cdLam) + ')/' + dec(den)) + ' = ' + dec(cd) + '.',
      },
      {
        prompt: 'Cross-validation gave these mean errors for ' + tex('\\lambda') + ': ' + rows + '. Using the one-standard-error rule (the largest ' + tex('\\lambda') + ' whose error is within one standard error of the minimum error, using the standard error at the minimum), which ' + tex('\\lambda') + ' is chosen?',
        answer: lamSe, tolerance: { abs: 0.0001 }, lecture: 8,
        explanation: 'The minimum error ' + dec(Math.min(...p.cv)) + ' has standard error ' + dec(p.se[p.cv.indexOf(Math.min(...p.cv))]) + ', so errors up to ' + dec(Math.min(...p.cv) + p.se[p.cv.indexOf(Math.min(...p.cv))]) + ' are acceptable; the largest such ' + tex('\\lambda') + ' is ' + dec(lamSe) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'reg2-lq-e-lasso', generate: (rng) => build(sample(rng)) }
