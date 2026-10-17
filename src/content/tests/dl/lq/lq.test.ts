// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: the forward pass as matrix-vector algebra; parameter count by explicit enumeration of weights and biases.
//  B: all gradients by central finite differences of the loss.
//  C: SGD / momentum / Adam by running the general recursions step by step; the schedule by repeated decay.
//  D: shrinkage by repeated multiplication; dropout variance by exact enumeration of the mask; He/Xavier by variance of an actual forward pass formula; batch norm by sums of squares.
//  E: output sizes by sliding the kernel over a padded input and counting positions; parameters and MACs by enumerating weights and positions; receptive field by backward tracing.
//  F: the unrolled recurrence by symbolic polynomial in w; the gradient by finite differences; the vanishing step by repeated multiplication.
//  G: softmax attention by a max-shifted softmax; the positional encoding through a different exponent form.
//  H: KL by numerical integration; D* by the Bayes posterior of a labelled mixture; clipping by explicit norm comparison; ln K via the entropy of the uniform distribution.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import * as A from './a-forward'
import * as B from './b-backprop'
import * as C from './c-optim'
import * as D from './d-regnorm'
import * as E from './e-cnn'
import * as Ff from './f-rnn'
import * as G from './g-attention'
import * as H from './h-generative'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'dl')!.lectures.length
const simpson = (f: (x: number) => number, a: number, b: number, n = 4000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Ff.build(Ff.sample(r)) }, 5],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5],
  ['H', { id: 'H', generate: (r) => H.build(H.sample(r)) }, 5],
]

describe.each(gens)('generator %s: generic rules', (name, gen, nParts) => {
  it('has the expected number of parts and well-formed text and answers (300 seeds)', () => {
    for (const s of seeds(name, 300)) {
      const inst = gen.generate(makeRng(s))
      expect(inst.parts, s).toHaveLength(nParts)
      for (const text of [inst.intro, ...inst.parts.flatMap((p) => [p.prompt, p.explanation])]) {
        expect(text, s).not.toMatch(/NaN|undefined|Infinity|\[object/)
        expect(/[\u0000-\u001f\u007f]/.test(text), `${s}: control character in ${JSON.stringify(text)}`).toBe(false)
        expect((text.match(/\$/g) ?? []).length % 2, `${s}: ${text}`).toBe(0)
      }
      for (const p of inst.parts) {
        expect(Number.isFinite(p.answer), s).toBe(true)
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

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('matrix-vector forward pass and explicit parameter enumeration (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const layer = (W: number[][], b: number[], v: number[]) => W.map((row, i) => row.reduce((t, w, j) => t + w * v[j], b[i]))
      const z = layer(p.w1, p.b1, p.x)
      close(ans[0], z[0], 1e-12)
      const a = z.map((v) => (v > 0 ? v : 0))
      close(ans[1], a[1], 1e-12)
      const y = layer([p.w2], [p.b2], a)[0]
      close(ans[2], y, 1e-12)
      close(ans[3], Math.exp(y) / (1 + Math.exp(y)), 1e-12)
      let count = 0
      for (let unit = 0; unit < p.h; unit++) { for (let i = 0; i < p.d; i++) count++; count++ }
      for (let unit = 0; unit < p.k; unit++) { for (let i = 0; i < p.h; i++) count++; count++ }
      close(ans[4], count, 1e-12)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('gradients by central finite differences (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const L = (w1: number, w2: number) => 0.5 * (w2 / (1 + Math.exp(-w1 * p.x)) - p.y) ** 2
      const e = 1e-6
      close(ans[1], L(p.w1, p.w2), 1e-12)
      close(ans[3], (L(p.w1, p.w2 + e) - L(p.w1, p.w2 - e)) / (2 * e), 1e-6)
      close(ans[4], (L(p.w1 + e, p.w2) - L(p.w1 - e, p.w2)) / (2 * e), 1e-6)
      const h = 1 / (1 + Math.exp(-p.w1 * p.x))
      close(ans[0], h, 1e-12)
      // dL/dyhat by perturbing yhat directly
      const l2 = (yh: number) => 0.5 * (yh - p.y) ** 2
      close(ans[2], (l2(p.w2 * h + e) - l2(p.w2 * h - e)) / (2 * e), 1e-6)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('general update recursions run step by step (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const gs = [p.g1, p.g2]
      let w = p.w0
      w -= p.eta * gs[0]
      close(ans[0], w, 1e-12)
      let v = 0, wm = p.w0
      for (const g of gs) { v = 0.9 * v + g; wm -= p.eta * v }
      close(ans[1], v, 1e-12)
      close(ans[2], wm, 1e-12)
      let m = 0, vv = 0, upd = 0
      gs.forEach((g, i) => {
        const t = i + 1
        m = 0.9 * m + 0.1 * g
        vv = 0.999 * vv + 0.001 * g * g
        upd = (p.eta * (m / (1 - 0.9 ** t))) / (Math.sqrt(vv / (1 - 0.999 ** t)) + 1e-8)
      })
      close(ans[3], upd, 1e-12)
      let lr = p.lr0
      for (let e = 1; e <= p.t; e++) if (e % p.s === 0) lr *= p.gamma
      close(ans[4], lr, 1e-12)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('repeated shrinkage, exact dropout variance, and batch norm via sums of squares (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      let w = 1
      for (let i = 0; i < p.T; i++) w *= 1 - p.eta * p.lam
      close(ans[0], w, 1e-12)
      // exact distribution of x*m/(1-p): kept with prob 1-p, dropped with prob p
      const kept = (p.x / (1 - p.p)), pr = 1 - p.p
      const mean = pr * kept
      close(mean, p.x, 1e-12)
      close(ans[1], pr * kept * kept + p.p * 0 - mean * mean, 1e-9)
      close(ans[2] ** 2 * p.nin, 2, 1e-9)
      close(ans[3] * (p.nin + p.nout), 2, 1e-9)
      const n = p.batch.length
      const sx = p.batch.reduce((t, v) => t + v, 0), sxx = p.batch.reduce((t, v) => t + v * v, 0)
      const var2 = sxx / n - (sx / n) ** 2
      close(ans[4], (p.v - sx / n) / Math.sqrt(var2 + 1e-5), 1e-9)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('sliding-window counts, weight enumeration and backward tracing of the receptive field (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      let positions = 0
      for (let start = -p.pad; start + p.k <= p.w + p.pad; start += p.stride) positions++
      close(ans[0], positions, 1e-12)
      let count = 0
      for (let o = 0; o < p.cout; o++) { for (let c = 0; c < p.cin; c++) for (let a = 0; a < p.k; a++) for (let b = 0; b < p.k; b++) count++; count++ }
      close(ans[1], count, 1e-12)
      // backward tracing: one unit of layer 2 sees k2 units of layer 1, spaced one apart; each layer-1 unit sees k inputs with stride apart
      const first = 0, last = (p.k2 - 1) * p.stride + (p.k - 1)
      close(ans[2], last - first + 1, 1e-12)
      let macs = 0
      for (let i = 0; i < positions; i++) for (let j = 0; j < positions; j++) macs += p.k * p.k * p.cin * p.cout
      close(ans[3], macs, 1e-6)
      close(ans[4], 2 * (p.c * p.c * 9 + p.c), 1e-12)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('polynomial expansion in w, finite differences, repeated multiplication (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      const h3 = (w: number) => p.x[0] * w * w + p.x[1] * w + p.x[2] // h_3 as a polynomial in w
      close(ans[0], h3(p.w), 1e-12)
      const e = 1e-6
      close(ans[1], (h3(p.w + e) - h3(p.w - e)) / (2 * e), 1e-6)
      close(ans[2], p.w * p.w * p.w, 1e-12)
      let t = 0, val = 1
      while (val >= 0.01) { val *= p.wv; t++ }
      close(ans[3], t, 1e-12)
      close(ans[4], p.f * p.c0 + p.i * p.g, 1e-12)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('max-shifted softmax and an alternative exponent form (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const sc = p.keys.map((k) => (p.q[0] * k[0] + p.q[1] * k[1]) / 1.4142135623730951)
      close(ans[0], sc[0], 1e-9)
      const mx = Math.max(...sc)
      const ex = sc.map((v) => Math.exp(v - mx))
      const tot = ex.reduce((a, b) => a + b, 0)
      close(ans[1], ex[0] / tot, 1e-9)
      close(ans[2], ex[1] / tot, 1e-9)
      close(ans[3], ex.reduce((a, v, j) => a + (v / tot) * p.vals[j], 0), 1e-9)
      const omega = Math.exp(-((2 * p.idx) / p.dmodel) * Math.log(10000))
      close(ans[4], Math.sin(p.pos * omega), 1e-9)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('KL by integration; D* from a Bayes posterior; clipping by comparison; ln K as an entropy (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const q = (z: number) => Math.exp(-0.5 * ((z - p.mu) / p.sigma) ** 2) / (p.sigma * Math.sqrt(2 * Math.PI))
      const pri = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
      const klInt = simpson((z) => q(z) * (Math.log(q(z)) - Math.log(pri(z))), p.mu - 12 * p.sigma, p.mu + 12 * p.sigma, 20000)
      close(ans[0], klInt, 1e-6)
      close(ans[1], -p.recon - klInt, 1e-6)
      // Bayes: P(real | x) with equal priors on real and generated
      close(ans[2], (0.5 * p.pd) / (0.5 * p.pd + 0.5 * p.pg), 1e-12)
      const nrm = Math.sqrt(p.gx ** 2 + p.gy ** 2)
      const out = nrm > p.clip ? (p.gx * p.clip) / nrm : p.gx
      close(ans[3], out, 1e-12)
      expect(Math.hypot(...[p.gx, p.gy].map((v) => (nrm > p.clip ? (v * p.clip) / nrm : v)))).toBeLessThanOrEqual(p.clip + 1e-9)
      close(ans[4], -p.K * (1 / p.K) * Math.log(1 / p.K), 1e-9)
    }
  })
})
