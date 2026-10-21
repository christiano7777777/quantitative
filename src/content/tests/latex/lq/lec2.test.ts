import { describe, expect, it } from 'vitest'
import { gradeBlank } from '../../../../lib/blank-grader'
import { makeRng } from '../../../../lib/rng'
import { build, genLec2, sample, type Params } from './lec2'

// Independent check: for every seed, a second correct answer written differently by hand (other brace style, other order
// of sub- and superscript, \limits, no spaces) must also pass, and every trap must fail as itself.
const alternatives = (P: Params) => [
  `${P.v}^{${P.e}}_${P.i}`,
  `\\frac{\\${P.g1}}{\\${P.g2}+${P.c}}`,
  `\\sum\\limits_{${P.k}=1}^${P.top}${P.w[0]}_${P.k}${P.w[1]}_${P.k}`,
  `\\sqrt{${P.a}^2+${P.b}^2}`,
  `\\${P.fn} (1+${P.r}_${P.i})`,
  `\\left( \\frac ${P.p}${P.q} \\right)^${P.pow}`,
]

describe('latex-lq-2 (mathematical typesetting I)', () => {
  const seeds = Array.from({ length: 200 }, (_, s) => `lec2-${s}`)

  it('every key and every hand-written alternative passes, every trap fails as itself, over 200 seeds', () => {
    for (const seed of seeds) {
      const P = sample(makeRng(seed))
      const inst = build(P)
      expect(inst.parts).toHaveLength(6)
      const alt = alternatives(P)
      inst.parts.forEach((p, n) => {
        expect(p.lecture).toBe(2)
        expect(Number.isNaN(p.answer)).toBe(true)
        const b = p.blank!
        expect(b.mode).toBe('render')
        expect(gradeBlank(b.key, b).correct, `${seed} part ${n}: ${b.key}`).toBe(true)
        expect(gradeBlank('$' + b.key + '$', b).correct).toBe(true)
        expect(gradeBlank(alt[n], b).correct, `${seed} part ${n}: ${alt[n]} vs ${b.key}`).toBe(true)
        for (const t of b.traps ?? []) {
          const v = gradeBlank(t.text, b)
          expect(v.correct, `${seed} part ${n} trap ${t.text}`).toBe(false)
          expect(v.trap?.text).toBe(t.text)
        }
        expect(p.view?.picture).toBe(b.key)
      })
    }
  })

  it('the parameters vary between seeds', () => {
    for (let n = 0; n < 6; n++) {
      const distinct = new Set(seeds.map((s) => genLec2.generate(makeRng(s)).parts[n].blank!.key))
      expect(distinct.size, `part ${n}`).toBeGreaterThanOrEqual(20)
    }
  })

  it('builds the expected keys for three fixed parameter sets', () => {
    const fixed: [Params, string[]][] = [
      [{ topic: 'x', v: 'x', i: 't', e: 12, g1: 'lambda', g2: 'sigma', c: 3, k: 'i', top: 'n', w: ['w', 'x'], a: 'a', b: 'b', fn: 'ln', r: 'r', p: 'u', q: 'z', pow: 2 },
        ['x_{t}^{12}', '\\frac{\\lambda}{\\sigma + 3}', '\\sum_{i=1}^{n} w_{i} x_{i}', '\\sqrt{a^{2} + b^{2}}', '\\ln(1 + r_{t})', '\\left(\\frac{u}{z}\\right)^{2}']],
      [{ topic: 'x', v: 'y', i: 'k', e: 20, g1: 'mu', g2: 'theta', c: 9, k: 'j', top: 'T', w: ['p', 'r'], a: 'c', b: 's', fn: 'exp', r: 'h', p: 'a', q: 'b', pow: 4 },
        ['y_{k}^{20}', '\\frac{\\mu}{\\theta + 9}', '\\sum_{j=1}^{T} p_{j} r_{j}', '\\sqrt{c^{2} + s^{2}}', '\\exp(1 + h_{k})', '\\left(\\frac{a}{b}\\right)^{4}']],
      [{ topic: 'x', v: 'z', i: 'n', e: 32, g1: 'kappa', g2: 'rho', c: 2, k: 'k', top: 'm', w: ['q', 'w'], a: 'u', b: 'x', fn: 'cos', r: 't', p: 's', q: 'y', pow: 3 },
        ['z_{n}^{32}', '\\frac{\\kappa}{\\rho + 2}', '\\sum_{k=1}^{m} q_{k} w_{k}', '\\sqrt{u^{2} + x^{2}}', '\\cos(1 + t_{n})', '\\left(\\frac{s}{y}\\right)^{3}']],
    ]
    for (const [P, want] of fixed) expect(build(P).parts.map((p) => p.blank!.key)).toEqual(want)
  })
})
