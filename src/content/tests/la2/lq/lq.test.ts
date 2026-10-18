// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: the operator is applied to polynomials by polynomial arithmetic; coordinates, the matrix in the new basis, the solve T(p)=q and the eigenvector come from exact linear systems.
//  B: only the displayed matrix is used: determinant by cofactors, integer roots of det(A - mu I) found by scanning mu, principal minors, an exact null-space solve, and tr(A^2) by multiplication.
//  C: powers by repeated exact multiplication, eigenvalues by the quadratic formula, the limit ratio by power iteration, non-diagonalisability by an exact discriminant and rank test.
//  D: integrals by Simpson quadrature; the projection from a numerically built Gram system and checked to minimise the squared distance by perturbation.
//  E: Gram-Schmidt QR on the columns, exact normal equations in fractions, and the Pythagoras identity.
//  F: the adjoint from the defining identity <Tu,w> = <u,T*w> on basis vectors (exact linear solves); normality by complex multiplication of N and N*, with the answer perturbed to break it.
//  G: Jacobi eigen-decomposition, the matrix power by multiplication, the minimum of the form by scanning the circle, completing the square by exact elimination.
//  H: Jacobi on A^T A, ||Ax|| scanned over the unit circle, and the best direction of the centred data found by scanning the angle.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, Fr, solveFr } from '../../../shared/fraction'
import * as A from './a-spaces'
import * as B from './b-eigen'
import * as C from './c-diag'
import * as D from './d-inner'
import * as E from './e-lsq'
import * as Fx from './f-adjoint'
import * as G from './g-spectral'
import * as H from './h-svd'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'la2')!.lectures.length

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fx.build(Fx.sample(r)) }, 5],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5],
  ['H', { id: 'H', generate: (r) => H.build(H.sample(r)) }, 5],
]

describe.each(gens)('generator %s: generic rules', (name, gen, nParts) => {
  it('has the expected number of parts and well-formed text and answers (300 seeds)', () => {
    for (const s of seeds(name, 300)) {
      const inst = gen.generate(makeRng(s))
      expect(inst.parts, s).toHaveLength(nParts)
      for (const text of [inst.intro, ...inst.parts.flatMap((p) => [p.prompt, p.explanation])]) {
        expect(text, s).not.toMatch(/NaN|undefined|Infinity|\[object|\+-|--/)
        expect(/[\u0000-\u001f\u007f]/.test(text), `${s}: control character in ${JSON.stringify(text)}`).toBe(false)
        expect((text.match(/\$/g) ?? []).length % 2, `${s}: ${text}`).toBe(0)
      }
      for (const p of inst.parts) {
        expect(Number.isFinite(p.answer), s).toBe(true)
        expect(Object.is(p.answer, -0), `${s}: negative zero`).toBe(false)
        expect(Math.abs(p.answer), s).toBeLessThan(1e5)
        expect(p.lecture).toBeGreaterThanOrEqual(1)
        expect(p.lecture).toBeLessThanOrEqual(lectures)
        expect(p.tolerance?.abs).toBeGreaterThan(0)
      }
    }
  })
  it('is deterministic per seed and varies across seeds', () => {
    expect(JSON.stringify(gen.generate(makeRng('x')))).toBe(JSON.stringify(gen.generate(makeRng('x'))))
    const text = (s: string) => { const i = gen.generate(makeRng(s)); return i.intro + i.parts.map((p) => p.prompt).join('|') }
    expect(new Set(seeds(name, 100).map(text)).size).toBeGreaterThan(15)
  })
})

it('the LQ bank touches all lectures', () => {
  const seen = new Set<number>()
  for (const [name, gen] of gens) for (const s of seeds(name, 20)) gen.generate(makeRng(s)).parts.forEach((p) => seen.add(p.lecture))
  expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, i) => i + 1))
})

// ---------- shared numeric helpers ----------
type Mat = number[][]
const matmul = (X: Mat, Y: Mat): Mat => X.map((r) => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)))
const transpose = (X: Mat): Mat => X[0].map((_, j) => X.map((r) => r[j]))

/** Cyclic Jacobi for a symmetric matrix: eigenvalues (descending) and matching unit eigenvectors as columns. */
function jacobi(M: Mat): { vals: number[]; vecs: Mat } {
  const n = M.length
  const a = M.map((r) => [...r])
  let V: Mat = a.map((_, i) => a.map((__, j) => (i === j ? 1 : 0)))
  for (let sweep = 0; sweep < 80; sweep++) {
    let off = 0
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2
    if (off < 1e-26) break
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q])
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1))
      const c = 1 / Math.sqrt(t * t + 1), s = t * c
      for (let k = 0; k < n; k++) { const kp = a[k][p], kq = a[k][q]; a[k][p] = c * kp - s * kq; a[k][q] = s * kp + c * kq }
      for (let k = 0; k < n; k++) { const pk = a[p][k], qk = a[q][k]; a[p][k] = c * pk - s * qk; a[q][k] = s * pk + c * qk }
      for (let k = 0; k < n; k++) { const kp = V[k][p], kq = V[k][q]; V[k][p] = c * kp - s * kq; V[k][q] = s * kp + c * kq }
    }
  }
  const order = a.map((_, i) => i).sort((i, j) => a[j][j] - a[i][i])
  V = V.map((r) => order.map((i) => r[i]))
  return { vals: order.map((i) => a[i][i]), vecs: V }
}

// ---------- A ----------
describe('generator A against independent computation', () => {
  /** polynomial arithmetic on coefficient arrays (index = power) */
  const pmul = (x: Fr[], y: Fr[]) => {
    const r = Array.from({ length: x.length + y.length - 1 }, () => F(0))
    x.forEach((xi, i) => y.forEach((yj, j) => { r[i + j] = r[i + j].add(xi.mul(yj)) }))
    return r
  }
  const pder = (x: Fr[]) => x.slice(1).map((v, i) => v.mul(F(i + 1)))
  const padd = (x: Fr[], y: Fr[]) => Array.from({ length: Math.max(x.length, y.length) }, (_, i) => (x[i] ?? F(0)).add(y[i] ?? F(0)))
  const pad3 = (x: Fr[]) => [...x, F(0), F(0), F(0)].slice(0, 3)
  it('coordinates, the matrix in the new basis, the solve T(p)=q and the eigenvector (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const prm = A.sample(makeRng(s))
      const { a, c } = prm
      const ans = answers(A.build(prm))
      const apply = (p: Fr[]) => pad3(padd(pmul([F(-a), F(1)], pder(p)), p.map((v) => v.mul(F(c)))))
      const mono = [[F(1), F(0), F(0)], [F(0), F(1), F(0)], [F(0), F(0), F(1)]]
      const Mcols = mono.map(apply)
      const M = [0, 1, 2].map((i) => [0, 1, 2].map((j) => Mcols[j][i]))
      const bPrime = [[F(1)], [F(-a), F(1)], pmul([F(-a), F(1)], [F(-a), F(1)])].map(pad3) // columns of the change of basis matrix
      const Pm = [0, 1, 2].map((i) => [0, 1, 2].map((j) => bPrime[j][i]))
      const p = prm.p.map((v) => F(v))
      const coords = solveFr(Pm, p)
      close(ans[0], coords[1].num)
      close(ans[1], apply(p)[1].num)
      // [T]_{B'} = P^-1 M P, column by column
      const MP = [0, 1, 2].map((i) => [0, 1, 2].map((j) => [0, 1, 2].reduce((acc, k) => acc.add(M[i][k].mul(Pm[k][j])), F(0))))
      let tr = F(0)
      for (let j = 0; j < 3; j++) tr = tr.add(solveFr(Pm, [0, 1, 2].map((i) => MP[i][j]))[j])
      close(ans[2], tr.num)
      const sol = solveFr(M, prm.q.map((v) => F(v)))
      close(ans[3], sol[0].add(sol[1].mul(F(a))).add(sol[2].mul(F(a * a))).num, 1e-12)
      // eigenvector with leading coefficient 1 for the eigenvalue c+2
      const lam = c + 2
      const sub = solveFr([[M[0][0].sub(F(lam)), M[0][1]], [F(0), M[1][1].sub(F(lam))]], [M[0][2].mul(F(-1)), M[1][2].mul(F(-1))])
      const v = [sub[0], sub[1], F(1)]
      for (let i = 0; i < 3; i++) expect(M[i].reduce((acc, m, j) => acc.add(m.mul(v[j])), F(0)).sub(v[i].mul(F(lam))).zero, `${s} row ${i}`).toBe(true)
      close(ans[4], v[0].num)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('uses only the displayed matrix: cofactor determinant, scanned integer roots, principal minors, null space, tr(A^2) (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const prm = B.sample(makeRng(s))
      const ans = answers(B.build(prm))
      const M = B.matrixOf(prm)
      expect(M.every((r) => r.every(Number.isInteger))).toBe(true)
      const detOf = (X: Mat): number => {
        // Laplace expansion along the first row, any size
        if (X.length === 1) return X[0][0]
        return X[0].reduce((acc, v, j) => acc + (j % 2 ? -1 : 1) * v * detOf(X.slice(1).map((r) => r.filter((_, k) => k !== j))), 0)
      }
      const shift = (mu: number) => M.map((r, i) => r.map((v, j) => v - (i === j ? mu : 0)))
      const roots: number[] = []
      for (let mu = -30; mu <= 30; mu++) if (detOf(shift(mu)) === 0) roots.push(mu)
      expect(roots).toHaveLength(3)
      close(ans[0], detOf(M))
      const pm2 = (i: number, j: number) => M[i][i] * M[j][j] - M[i][j] * M[j][i]
      close(ans[1], pm2(0, 1) + pm2(0, 2) + pm2(1, 2))
      close(ans[2], Math.max(...roots))
      const mid = roots[1]
      // null space of M - mid I with first coordinate 1: rows 1 and 2 determine (y, z)
      const S = shift(mid)
      // two rows that make the system for (y, z) nonsingular; the remaining row must then vanish as well
      let yz: Fr[] | null = null
      for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
        try { yz = solveFr([[F(S[i][1]), F(S[i][2])], [F(S[j][1]), F(S[j][2])]], [F(-S[i][0]), F(-S[j][0])]); break } catch { /* singular pair, try the next */ }
      }
      if (!yz) throw new Error(`${s}: no usable row pair`)
      expect([0, 1, 2].every((i) => F(S[i][0]).add(F(S[i][1]).mul(yz![0])).add(F(S[i][2]).mul(yz![1])).zero), `${s}: null-space vector`).toBe(true)
      close(ans[3], yz[1].num, 1e-12)
      const sq = matmul(M, M)
      close(ans[4], sq[0][0] + sq[1][1] + sq[2][2])
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  const fmat = (X: Mat) => X.map((r) => r.map((v) => F(v)))
  const fmul = (X: Fr[][], Y: Fr[][]) => X.map((r) => Y[0].map((_, j) => r.reduce((acc, v, k) => acc.add(v.mul(Y[k][j])), F(0))))
  const fpowM = (X: Fr[][], n: number) => { let R = fmat([[1, 0], [0, 1]]); for (let i = 0; i < n; i++) R = fmul(R, X); return R }
  it('powers by repeated multiplication, eigenvalues by the quadratic formula, power iteration, discriminant and rank (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const prm = C.sample(makeRng(s))
      const ans = answers(C.build(prm))
      const Am = C.matA(prm), Bm = C.matB(prm)
      const tr = Am[0][0] + Am[1][1], dt = Am[0][0] * Am[1][1] - Am[0][1] * Am[1][0]
      const disc = Math.sqrt(tr * tr - 4 * dt)
      const ev = [(tr + disc) / 2, (tr - disc) / 2]
      close(ans[0], Math.min(...ev), 1e-9)
      expect(fpowM(fmat(Am), prm.n)[0][1].num).toBe(ans[1])
      // power iteration for the dominant direction
      let x = [0.37, 1.13]
      for (let i = 0; i < 400; i++) { x = [Am[0][0] * x[0] + Am[0][1] * x[1], Am[1][0] * x[0] + Am[1][1] * x[1]]; const nrm = Math.hypot(x[0], x[1]); x = [x[0] / nrm, x[1] / nrm] }
      close(ans[2], x[0] / x[1], 1e-6)
      expect(fpowM(fmat(Bm), prm.nB)[0][0].num).toBe(ans[3])
      // B has the single eigenvalue lamB and is not diagonalisable
      expect(Bm[0][0] + Bm[1][1]).toBe(2 * prm.lamB)
      expect(Bm[0][0] * Bm[1][1] - Bm[0][1] * Bm[1][0]).toBe(prm.lamB ** 2)
      expect(Bm.some((r, i) => r.some((v, j) => v !== (i === j ? prm.lamB : 0)))).toBe(true)
      // M = [[a,k],[-c,d]]: exact discriminant vanishes at k = answer, and M - (tr/2) I is nonzero
      const { a, d, c } = prm
      const kFr = new Fr(BigInt((a - d) ** 2), BigInt(4 * c))
      close(ans[4], kFr.num, 1e-12)
      const discM = (k: Fr) => F((a + d) ** 2).sub(F(4).mul(F(a * d).add(F(c).mul(k))))
      expect(discM(kFr).zero).toBe(true)
      expect(discM(kFr.add(F(1, 100))).cmp(F(0))).toBe(-1) // strictly decreasing: the root is unique and positive
      expect(kFr.cmp(F(0))).toBe(1)
      expect(a - d === 0).toBe(false) // M - lambda I is not the zero matrix, since its (2,1) entry is -c
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  const simpson = (f: (x: number) => number, lo: number, hi: number, n = 2000) => {
    const h = (hi - lo) / n
    let s = f(lo) + f(hi)
    for (let i = 1; i < n; i++) s += f(lo + i * h) * (i % 2 ? 4 : 2)
    return (s * h) / 3
  }
  it('quadrature for the inner products, a numerically built projection checked to be the minimiser (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const prm = D.sample(makeRng(s))
      const ans = answers(D.build(prm))
      const { lo, f, g, h } = prm
      const ev = (c: number[], x: number) => c.reduceRight((acc, v) => acc * x + v, 0)
      const fq = (x: number) => ev(f, x), gq = (x: number) => g[0] + g[1] * x * x, hq = (x: number) => ev(h, x)
      const ip = (u: (x: number) => number, w: (x: number) => number) => simpson((x) => u(x) * w(x), lo, 1)
      close(ans[0], ip(fq, gq), 1e-8)
      close(ans[1], Math.sqrt(ip(fq, fq)), 1e-8)
      close(ans[2], ip(fq, gq) / Math.sqrt(ip(fq, fq) * ip(gq, gq)), 1e-8)
      // projection: numerical Gram system
      const g00 = ip(() => 1, () => 1), g01 = ip(() => 1, (x) => x), g11 = ip((x) => x, (x) => x)
      const r0 = ip(hq, () => 1), r1 = ip(hq, (x) => x)
      const dt = g00 * g11 - g01 * g01
      const al = (r0 * g11 - r1 * g01) / dt, be = (g00 * r1 - g01 * r0) / dt
      close(ans[3], al + be, 1e-8)
      const J = (x0: number, x1: number) => ip((x) => hq(x) - x0 - x1 * x, (x) => hq(x) - x0 - x1 * x)
      const jmin = J(al + be * 0, be)
      close(ans[4], Math.sqrt(jmin), 1e-8)
      for (const [da, db] of [[0.01, 0], [-0.01, 0], [0, 0.01], [0, -0.01], [0.01, 0.01]]) expect(J(al + da, be + db)).toBeGreaterThan(jmin)
      // the residual is orthogonal to 1 and x
      close(ip((x) => hq(x) - al - be * x, () => 1), 0, 1e-8)
      close(ip((x) => hq(x) - al - be * x, (x) => x), 0, 1e-8)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('QR (Gram-Schmidt) least squares, exact normal equations and the Pythagoras identity (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const prm = E.sample(makeRng(s))
      const ans = answers(E.build(prm))
      const { t, y } = prm
      const n = t.length
      // modified Gram-Schmidt on the columns [1, t]
      const c1v = Array(n).fill(1), c2v = [...t]
      const dot = (u: number[], v: number[]) => u.reduce((acc, x, i) => acc + x * v[i], 0)
      const r11 = Math.sqrt(dot(c1v, c1v)); const q1 = c1v.map((v) => v / r11)
      const r12 = dot(q1, c2v); const w = c2v.map((v, i) => v - r12 * q1[i])
      const r22 = Math.sqrt(dot(w, w)); const q2 = w.map((v) => v / r22)
      const z1 = dot(q1, y), z2 = dot(q2, y)
      const slope = z2 / r22, icpt = (z1 - r12 * slope) / r11
      close(ans[0], slope, 1e-9)
      close(ans[1], icpt, 1e-9)
      close(ans[2], icpt + slope * (t[n - 1] + 1), 1e-9)
      const proj = q1.map((v, i) => z1 * v + z2 * q2[i]) // projection of y onto the column space
      close(ans[3], y.reduce((acc, v, i) => acc + (v - proj[i]) ** 2, 0), 1e-9)
      close(ans[4], dot(proj, proj), 1e-9)
      // exact normal equations
      const sol = solveFr([[F(n), F(t.reduce((a, v) => a + v, 0))], [F(t.reduce((a, v) => a + v, 0)), F(t.reduce((a, v) => a + v * v, 0))]], [F(y.reduce((a, v) => a + v, 0)), F(t.reduce((a, v, i) => a + v * y[i], 0))])
      close(ans[0], sol[1].num, 1e-12)
      close(ans[1], sol[0].num, 1e-12)
      // y - fit is orthogonal to both columns (exactly)
      const resid = y.map((v, i) => F(v).sub(sol[0]).sub(sol[1].mul(F(t[i]))))
      expect(resid.reduce((a, v) => a.add(v), F(0)).zero).toBe(true)
      expect(resid.reduce((a, v, i) => a.add(v.mul(F(t[i]))), F(0)).zero).toBe(true)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  type Cx = [number, number]
  const cmul = (p: Cx, q: Cx): Cx => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]]
  const cadd = (p: Cx, q: Cx): Cx => [p[0] + q[0], p[1] + q[1]]
  const cconj = (p: Cx): Cx => [p[0], -p[1]]
  const cmat = (X: Cx[][], Y: Cx[][]) => X.map((r) => Y[0].map((_, j) => r.reduce((acc, v, k) => cadd(acc, cmul(v, Y[k][j])), [0, 0] as Cx)))
  const star = (X: Cx[][]) => X[0].map((_, j) => X.map((r) => cconj(r[j])))
  const Nof = (p: Fx.Params, t: number): Cx[][] => [[[p.a, 0], [p.b1, p.b2]], [[p.c1, t], [p.a, 0]]]
  it('adjoint from the defining identity on basis vectors, self-adjoint c, normality of N by complex multiplication (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const prm = Fx.sample(makeRng(s))
      const ans = answers(Fx.build(prm))
      const { G: Gm, x, y, A: Am, S } = prm
      const ipG = (u: number[], w: number[]) => u.reduce((acc, ui, i) => acc + w.reduce((a2, wj, j) => a2 + ui * Gm[i][j] * wj, 0), 0)
      close(ans[0], ipG(x, y))
      // <A e_i, e_j> = <e_i, X e_j> for all i, j: G X = (<A e_i, e_j>)_{ij}
      const e = [[1, 0], [0, 1]]
      const rhs = [0, 1].map((i) => [0, 1].map((j) => ipG(Am.map((r) => r[0] * e[i][0] + r[1] * e[i][1]), e[j])))
      const Xcols = [0, 1].map((j) => solveFr(Gm.map((r) => r.map((v) => F(v))), [F(rhs[0][j]), F(rhs[1][j])]))
      close(ans[1], Xcols[1][0].num, 1e-12) // entry (1,2): row 1 of column 2
      // verify the adjoint property on the given vectors with the exact adjoint
      const Xm = [[Xcols[0][0].num, Xcols[1][0].num], [Xcols[0][1].num, Xcols[1][1].num]]
      const apply = (Mx: Mat, v: number[]) => [Mx[0][0] * v[0] + Mx[0][1] * v[1], Mx[1][0] * v[0] + Mx[1][1] * v[1]]
      close(ipG(apply(Am, x), y), ipG(x, apply(Xm, y)), 1e-9)
      // self-adjoint c: S with c = answer satisfies <Su,w> = <u,Sw> for all u,w
      const Sm = [[S[0], S[1]], [ans[2], S[2]]]
      for (const [u, w] of [[[1, 0], [0, 1]], [[2, -1], [1, 3]], [[0, 1], [1, 0]]]) close(ipG(apply(Sm, u), w), ipG(u, apply(Sm, w)), 1e-9)
      // normality: N N* = N* N at t, and not at t +- 0.5
      const diff = (t: number) => {
        const N = Nof(prm, t)
        const l = cmat(N, star(N)), r = cmat(star(N), N)
        return Math.max(...l.flatMap((row, i) => row.map((v, j) => Math.hypot(v[0] - r[i][j][0], v[1] - r[i][j][1]))))
      }
      close(diff(ans[3]), 0, 1e-9)
      expect(diff(ans[3] + 0.5)).toBeGreaterThan(0.1)
      expect(diff(ans[3] - 0.5)).toBeGreaterThan(0.1)
      // the squared Frobenius norm tr(N* N)
      const NN = cmat(star(Nof(prm, ans[3])), Nof(prm, ans[3]))
      close(ans[4], NN[0][0][0] + NN[1][1][0], 1e-9)
      // for a normal matrix this is the sum of |lambda|^2: eigenvalues a +- sqrt(b c) via the complex square root
      const bc = cmul([prm.b1, prm.b2], [prm.c1, ans[3]])
      const mod = Math.hypot(bc[0], bc[1]), sr: Cx = [Math.sqrt((mod + bc[0]) / 2), Math.sign(bc[1] || 1) * Math.sqrt((mod - bc[0]) / 2)]
      const l1: Cx = [prm.a + sr[0], sr[1]], l2: Cx = [prm.a - sr[0], -sr[1]]
      close(ans[4], l1[0] ** 2 + l1[1] ** 2 + l2[0] ** 2 + l2[1] ** 2, 1e-9)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('Jacobi eigenpairs, the power by multiplication, the scanned minimum on the circle, exact elimination (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const prm = G.sample(makeRng(s))
      const ans = answers(G.build(prm))
      const Am = G.matrix(prm)
      expect(Am[0][1]).toBe(Am[1][0])
      const { vals, vecs } = jacobi(Am)
      close(ans[0], vals[0], 1e-9)
      expect(Math.abs(vals[0] - Math.round(vals[0]))).toBeLessThan(1e-9)
      expect(vals[0] - vals[1]).toBeGreaterThan(0.5)
      const v = [vecs[0][0], vecs[1][0]]
      const sgn = v[0] < 0 ? -1 : 1
      expect(sgn * v[1]).toBeGreaterThan(0) // both coordinates positive after the sign choice
      close(ans[1], sgn * v[0], 1e-9)
      let P = [[1, 0], [0, 1]]
      for (let i = 0; i < prm.n; i++) P = matmul(P, Am)
      close(ans[2], P[0][1], 1e-6)
      // minimum of x^T A x on ||x||^2 = r by scanning the angle
      let mn = Infinity
      const rad = Math.sqrt(prm.r)
      for (let i = 0; i < 20000; i++) {
        const th = (2 * Math.PI * i) / 20000
        const xv = [rad * Math.cos(th), rad * Math.sin(th)]
        mn = Math.min(mn, xv[0] * (Am[0][0] * xv[0] + Am[0][1] * xv[1]) + xv[1] * (Am[1][0] * xv[0] + Am[1][1] * xv[1]))
      }
      close(ans[3], mn, 1e-5)
      // completing the square by exact elimination: delta = a22 - a12 * (a12 / a11)
      const gamma = F(Am[0][1]).div(F(Am[0][0]))
      close(ans[4], F(Am[1][1]).sub(F(Am[0][1]).mul(gamma)).num, 1e-12)
      // Q(x) = a11 (x1 + gamma x2)^2 + delta x2^2 at a test point
      const x = [3, -2], Qx = x[0] * (Am[0][0] * x[0] + Am[0][1] * x[1]) + x[1] * (Am[1][0] * x[0] + Am[1][1] * x[1])
      close(Am[0][0] * (x[0] + gamma.num * x[1]) ** 2 + ans[4] * x[1] ** 2, Qx, 1e-9)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('Jacobi on A^T A, ||Ax|| over the unit circle, the best direction of centred data found by scanning (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const prm = H.sample(makeRng(s))
      const ans = answers(H.build(prm))
      const { A: Am, pts } = prm
      const { vals } = jacobi(matmul(transpose(Am), Am))
      close(ans[0], Math.sqrt(vals[0]), 1e-9)
      close(ans[1], Math.sqrt(vals[1]), 1e-9)
      close(ans[2], vals[0] / (vals[0] + vals[1]), 1e-9)
      expect(vals[0] + vals[1]).toBeCloseTo(Am.reduce((a, r) => a + r[0] * r[0] + r[1] * r[1], 0), 9) // ||A||_F^2
      let mx = 0, mn = Infinity
      for (let i = 0; i < 40000; i++) {
        const th = (2 * Math.PI * i) / 40000, v = [Math.cos(th), Math.sin(th)]
        const nrm = Math.hypot(...Am.map((r) => r[0] * v[0] + r[1] * v[1]))
        mx = Math.max(mx, nrm); mn = Math.min(mn, nrm)
      }
      close(ans[0], mx, 1e-6)
      close(ans[1], mn, 1e-6)
      // PCA by brute force over directions
      const n = pts.length
      const mxp = pts.reduce((a, p) => a + p[0], 0) / n, myp = pts.reduce((a, p) => a + p[1], 0) / n
      const total = pts.reduce((a, p) => a + (p[0] - mxp) ** 2 + (p[1] - myp) ** 2, 0) / (n - 1)
      let best = -1, bestCos = 0
      const variance = (th: number) => pts.reduce((a, p) => a + ((p[0] - mxp) * Math.cos(th) + (p[1] - myp) * Math.sin(th)) ** 2, 0) / (n - 1)
      let bt = 0
      for (let i = 0; i < 20000; i++) { const th = (Math.PI * i) / 20000; const vv = variance(th); if (vv > best) { best = vv; bt = th } }
      // refine by golden-section search around the best grid angle
      let lo = bt - Math.PI / 20000, hi = bt + Math.PI / 20000
      for (let i = 0; i < 80; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (variance(m1) < variance(m2)) lo = m1; else hi = m2 }
      bt = (lo + hi) / 2; best = variance(bt); bestCos = Math.abs(Math.cos(bt))
      close(ans[3], best / total, 1e-7)
      close(ans[4], bestCos, 1e-6)
    }
  }, 120000)
})
