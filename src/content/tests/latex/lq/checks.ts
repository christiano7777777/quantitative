// Shared checks for the latex long-question tests (each lec<N>.test.ts calls these with its own generator).
// Independent check: for every seed, answers written by hand in another legal style (`alternatives`) must pass too, so a
// key that only matches itself, or a normaliser that is too strict, fails the test.
import { expect } from 'vitest'
import { gradeBlank } from '../../../../lib/blank-grader'
import { makeRng } from '../../../../lib/rng'
import type { LQInstance } from '../../../../lib/types'

export interface GeneratorUnderTest<P> {
  sample(rng: ReturnType<typeof makeRng>): P
  build(p: P): LQInstance
}

/**
 * Over `n` seeds: every part is tagged `lecture`, is typed, its key, accepts and alternative pass, every trap fails as
 * itself; and parts listed in `varying` take at least `minDistinct` different keys.
 */
export function checkGenerator<P>(
  g: GeneratorUnderTest<P>, lecture: number, alternatives: (p: P) => (string | null)[],
  opts: { parts: number; varying: number[]; minDistinct?: number; n?: number; seed: string },
) {
  const n = opts.n ?? 200
  const distinct = opts.varying.map(() => new Set<string>())
  for (let s = 0; s < n; s++) {
    const seed = `${opts.seed}-${s}`
    const P = g.sample(makeRng(seed))
    const inst = g.build(P)
    expect(inst.parts, seed).toHaveLength(opts.parts)
    const alt = alternatives(P)
    inst.parts.forEach((p, i) => {
      expect(p.lecture, `${seed} part ${i}`).toBe(lecture)
      expect(Number.isNaN(p.answer)).toBe(true)
      const b = p.blank!
      expect(b, `${seed} part ${i} is typed`).toBeDefined()
      for (const a of [b.key, ...(b.accept ?? []), ...(alt[i] === null ? [] : [alt[i]!])])
        expect(gradeBlank(a, b).correct, `${seed} part ${i}: ${JSON.stringify(a)} vs key ${JSON.stringify(b.key)}`).toBe(true)
      for (const t of b.traps ?? []) {
        const v = gradeBlank(t.text, b)
        expect(v.correct, `${seed} part ${i} trap ${JSON.stringify(t.text)}`).toBe(false)
        expect(v.trap?.text, `${seed} part ${i} trap ${JSON.stringify(t.text)} reported as itself`).toBe(t.text)
      }
      const k = opts.varying.indexOf(i)
      if (k >= 0) distinct[k].add(b.key)
    })
  }
  opts.varying.forEach((i, k) => expect(distinct[k].size, `part ${i} varies`).toBeGreaterThanOrEqual(opts.minDistinct ?? 3))
}

/** The keys of every part for a fixed parameter set (compared with hand-written strings). */
export const keysOf = <P>(g: GeneratorUnderTest<P>, p: P) => g.build(p).parts.map((x) => x.blank!.key)
