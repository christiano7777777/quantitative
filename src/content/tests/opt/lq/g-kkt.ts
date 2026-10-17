// LQ-G: nearest point of a half-plane: KKT multiplier, solution, optimal value and the Lagrangian dual function.
// Lecture 9 (Lagrangian duality, KKT conditions).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

// minimise (x-p)^2 + (y-q)^2 subject to m x + n y <= r, with the centre (p,q) outside the half-plane
export interface Params { p: number; q: number; m: number; n: number; r: number; lam0: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const m = rng.int(1, 4), n = rng.pick([-3, -2, -1, 1, 2, 3, 4])
    const p = rng.int(-5, 5), q = rng.int(-5, 5), r = rng.int(-5, 8)
    if (m * p + n * q - r < 1) continue
    return { p, q, m, n, r, lam0: rng.int(1, 3) }
  }
}

export function build({ p, q, m, n, r, lam0 }: Params): LQInstance {
  const N = m * m + n * n
  const D = m * p + n * q - r
  const lam = (2 * D) / N
  const x = p - (lam * m) / 2, y = q - (lam * n) / 2
  const fstar = (D * D) / N
  const g0 = lam0 * D - (lam0 * lam0 * N) / 4
  const sg = (k: number, s: string) => (k < 0 ? '-' : '+') + Math.abs(k) + s

  return {
    intro:
      'Find the point of the half-plane ' + tex(m + 'x' + sg(n, 'y') + '\\le ' + r) + ' closest to the point ' + tex('(' + p + ',' + q + ')') + ', i.e. minimise ' + tex('f(x,y)=(x-' + (p < 0 ? '(' + p + ')' : p) + ')^2+(y-' + (q < 0 ? '(' + q + ')' : q) + ')^2') + ' subject to ' + tex(m + 'x' + sg(n, 'y') + '-' + (r < 0 ? '(' + r + ')' : r) + '\\le0') + '. The Lagrangian is ' + tex('L=f+\\lambda(' + m + 'x' + sg(n, 'y') + '-' + (r < 0 ? '(' + r + ')' : r) + ')') + ' with ' + tex('\\lambda\\ge0') + '. The centre violates the constraint, so the constraint is active. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the KKT multiplier ' + tex('\\lambda^*') + '.',
        answer: lam, tolerance: tol3, lecture: 9,
        explanation: 'Stationarity gives ' + tex('x=' + p + '-' + m + '\\lambda/2,\\ y=' + q + (n < 0 ? '+' : '-') + Math.abs(n) + '\\lambda/2') + '. Substituting into the active constraint: ' + tex('\\lambda=2(' + D + ')/' + N + '=' + dec(lam)) + '.',
      },
      {
        prompt: 'Find the optimal ' + tex('x^*') + '.',
        answer: x, tolerance: tol3, lecture: 9,
        explanation: tex('x^*=' + p + '-' + m + '(' + dec(lam) + ')/2=' + dec(x)) + '.',
      },
      {
        prompt: 'Find the optimal ' + tex('y^*') + '.',
        answer: y, tolerance: tol3, lecture: 9,
        explanation: tex('y^*=' + q + '-(' + n + ')(' + dec(lam) + ')/2=' + dec(y)) + '. Check: ' + tex(m + '(' + dec(x) + ')+(' + n + ')(' + dec(y) + ')=' + dec(m * x + n * y)) + '.',
      },
      {
        prompt: 'Find the optimal value ' + tex('f^*') + '.',
        answer: fstar, tolerance: tol3, lecture: 9,
        explanation: tex('f^*=(x^*-' + p + ')^2+(y^*-' + q + ')^2=' + dec(fstar)) + ', which is the squared distance ' + tex('(' + D + ')^2/' + N) + ' from the centre to the line.',
      },
      {
        prompt: 'The dual function is ' + tex('g(\\lambda)=\\min_{x,y}L(x,y,\\lambda)') + '. Find ' + tex('g(' + lam0 + ')') + '. (By weak duality it cannot exceed ' + tex('f^*') + '.)',
        answer: g0, tolerance: tol3, lecture: 9,
        explanation: 'Minimising ' + tex('L') + ' over ' + tex('x,y') + ' gives ' + tex('g(\\lambda)=' + D + '\\lambda-' + N + '\\lambda^2/4') + ', so ' + tex('g(' + lam0 + ')=' + dec(g0)) + ', below ' + tex('f^*=' + dec(fstar)) + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'opt-lq-g-kkt', generate: (rng) => build(sample(rng)) }
