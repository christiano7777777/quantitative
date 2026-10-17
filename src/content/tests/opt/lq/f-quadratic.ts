// LQ-F: a convex quadratic: Hessian eigenvalues, the minimum, and an exact line-search steepest-descent step.
// Lecture 9 (convex functions, optimality conditions).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

// f(x,y) = p x^2 + q x y + r y^2 - b1 x - b2 y, Hessian [[2p, q], [q, 2r]]
export interface Params { p: number; q: number; r: number; b1: number; b2: number; u: number; v: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const p = rng.int(1, 5), r = rng.int(1, 5), q = rng.int(-4, 4)
    if (4 * p * r - q * q < 3) continue
    const b1 = rng.int(-8, 8), b2 = rng.int(-8, 8), u = rng.int(-3, 3), v = rng.int(-3, 3)
    const det = 4 * p * r - q * q
    const sx = (2 * r * b1 - q * b2) / det, sy = (2 * p * b2 - q * b1) / det
    const gx = 2 * p * u + q * v - b1, gy = q * u + 2 * r * v - b2
    if (Math.abs(sx - u) < 0.3 && Math.abs(sy - v) < 0.3) continue
    if (gx === 0 && gy === 0) continue
    return { p, q, r, b1, b2, u, v }
  }
}

export function build({ p, q, r, b1, b2, u, v }: Params): LQInstance {
  const mid = p + r, rad = Math.sqrt((p - r) ** 2 + q * q)
  const lmin = mid - rad, lmax = mid + rad
  const det = 4 * p * r - q * q
  const sx = (2 * r * b1 - q * b2) / det, sy = (2 * p * b2 - q * b1) / det
  const f = (x: number, y: number) => p * x * x + q * x * y + r * y * y - b1 * x - b2 * y
  const fmin = f(sx, sy)
  const gx = 2 * p * u + q * v - b1, gy = q * u + 2 * r * v - b2
  const gg = gx * gx + gy * gy
  const gHg = 2 * p * gx * gx + 2 * q * gx * gy + 2 * r * gy * gy
  const t = gg / gHg
  const nx = u - t * gx, ny = v - t * gy
  const sgn = (k: number, s: string) => (k === 0 ? '' : (k < 0 ? '-' : '+') + Math.abs(k) + s)

  return {
    intro:
      'Let ' + tex('f(x,y)=' + p + 'x^2' + sgn(q, 'xy') + sgn(r, 'y^2') + sgn(-b1, 'x') + sgn(-b2, 'y')) + '. Its Hessian is the constant matrix ' + tex('H=\\begin{pmatrix}' + 2 * p + '&' + q + '\\\\' + q + '&' + 2 * r + '\\end{pmatrix}') + ', which is positive definite, so ' + tex('f') + ' is strictly convex. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the smallest eigenvalue of ' + tex('H') + '.',
        answer: lmin, tolerance: tol3, lecture: 9,
        explanation: 'Eigenvalues of ' + tex('H') + ' are ' + tex(mid + '\\pm\\sqrt{(' + p + '-' + r + ')^2+' + q + '^2}') + ' = ' + dec(lmin) + ' and ' + dec(lmax) + '. Both are positive, which confirms convexity.',
      },
      {
        prompt: 'Find the largest eigenvalue of ' + tex('H') + '.',
        answer: lmax, tolerance: tol3, lecture: 9,
        explanation: 'The larger root of ' + tex('\\lambda^2-' + 2 * mid + '\\lambda+' + det + '=0') + ' is ' + dec(lmax) + '.',
      },
      {
        prompt: 'Find the minimum value of ' + tex('f') + ' (the KKT condition for an unconstrained problem is ' + tex('\\nabla f=0') + ').',
        answer: fmin, tolerance: tol3, lecture: 9,
        explanation: tex('\\nabla f=0') + ' gives ' + tex('(x^*,y^*)=(' + dec(sx) + ',' + dec(sy) + ')') + ', and ' + tex('f^*=' + dec(fmin)) + '.',
      },
      {
        prompt: 'Steepest descent starts at ' + tex('(' + u + ',' + v + ')') + ', moving along ' + tex('-\\nabla f') + ' with the exact line-search step ' + tex('t=\\dfrac{g^\\top g}{g^\\top Hg}') + ', where ' + tex('g=\\nabla f(' + u + ',' + v + ')') + '. Find ' + tex('t') + '.',
        answer: t, tolerance: tol3, lecture: 9,
        explanation: tex('g=(' + gx + ',' + gy + ')') + ', ' + tex('g^\\top g=' + gg) + ', ' + tex('g^\\top Hg=' + gHg) + ', so ' + tex('t=' + dec(t)) + '.',
      },
      {
        prompt: 'Find the value of ' + tex('f') + ' at the point reached after this one step.',
        answer: f(nx, ny), tolerance: tol3, lecture: 9,
        explanation: 'The new point is ' + tex('(' + dec(nx) + ',' + dec(ny) + ')') + ' and ' + tex('f=' + dec(f(nx, ny))) + ' (the start had ' + tex('f=' + dec(f(u, v))) + ').',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'opt-lq-f-quadratic', generate: (rng) => build(sample(rng)) }
