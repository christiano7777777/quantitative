import { describe, expect, it } from 'vitest'
import { checkGenerator, keysOf } from './checks'
import * as g from './lec3'
import type { Params } from './lec3'

// Hand-written alternatives: \left( matrix \right), no spaces, align* instead of aligned, spaces between arguments.
const alternatives = (P: Params) => [
  '\\left(\\begin{matrix}' + P.rows.map((r) => r.join('&')).join('\\\\') + '\\end{matrix}\\right)',
  'f(x)=\\begin{cases}' + P.pieces[0] + '&\\text{if }x<' + P.c + '\\\\' + P.pieces[1] + '&\\text{if }x\\geq ' + P.c + '\\end{cases}',
  '\\begin{align*}f(x)&=(x+' + P.k + ')^2\\\\&=x^2+' + 2 * P.k + 'x+' + P.k * P.k + '\\end{align*}',
  '\\newtheorem {' + P.env + '} {' + P.env[0].toUpperCase() + P.env.slice(1) + '}' + (P.inSection ? ' [section]' : '') + ' % numbered',
  '\\begin{' + P.env + '} [' + P.thmTitle + ']',
  '\\begin {proof}[' + P.proofTitle + ']',
]

describe('latex-lq-3 (mathematical typesetting II)', () => {
  it('keys, accepts and alternatives pass; traps fail; parameters vary', () =>
    checkGenerator(g, 3, alternatives, { parts: 6, varying: [0, 1, 2, 3, 4, 5], seed: 'lec3' }))

  it('builds the expected keys for three fixed parameter sets', () => {
    expect(keysOf(g, { rows: [[1, 2], [3, 4]], c: 0, pieces: ['0', 'x'], k: 3, env: 'lemma', inSection: true, thmTitle: 'Unbiasedness', proofTitle: 'Sketch of proof' })).toEqual([
      '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}',
      'f(x) = \\begin{cases} 0 & \\text{if } x < 0 \\\\ x & \\text{if } x \\ge 0 \\end{cases}',
      '\\begin{aligned} f(x) &= (x + 3)^{2} \\\\ &= x^{2} + 6x + 9 \\end{aligned}',
      '\\newtheorem{lemma}{Lemma}[section]',
      '\\begin{lemma}[Unbiasedness]',
      '\\begin{proof}[Sketch of proof]',
    ])
    expect(keysOf(g, { rows: [[-1, 0, 5], [2, 7, -3]], c: 2, pieces: ['x^{2}', '1 - x'], k: 1, env: 'claim', inSection: false, thmTitle: 'Monotone payoff', proofTitle: 'Proof (outline)' })).toEqual([
      '\\begin{pmatrix} -1 & 0 & 5 \\\\ 2 & 7 & -3 \\end{pmatrix}',
      'f(x) = \\begin{cases} x^{2} & \\text{if } x < 2 \\\\ 1 - x & \\text{if } x \\ge 2 \\end{cases}',
      '\\begin{aligned} f(x) &= (x + 1)^{2} \\\\ &= x^{2} + 2x + 1 \\end{aligned}',
      '\\newtheorem{claim}{Claim}',
      '\\begin{claim}[Monotone payoff]',
      '\\begin{proof}[Proof (outline)]',
    ])
    expect(keysOf(g, { rows: [[4, 4], [0, 1]], c: 5, pieces: ['2x', '\\sqrt{x}'], k: 6, env: 'proposition', inSection: true, thmTitle: 'A bound on the variance', proofTitle: 'Proof of the bound' })).toEqual([
      '\\begin{pmatrix} 4 & 4 \\\\ 0 & 1 \\end{pmatrix}',
      'f(x) = \\begin{cases} 2x & \\text{if } x < 5 \\\\ \\sqrt{x} & \\text{if } x \\ge 5 \\end{cases}',
      '\\begin{aligned} f(x) &= (x + 6)^{2} \\\\ &= x^{2} + 12x + 36 \\end{aligned}',
      '\\newtheorem{proposition}{Proposition}[section]',
      '\\begin{proposition}[A bound on the variance]',
      '\\begin{proof}[Proof of the bound]',
    ])
  })

  it('the derivation is correct algebra: (x + k)^2 expands to the second line', () => {
    for (let k = 1; k <= 6; k++)
      for (const x of [-2, 0, 1.5, 3]) expect((x + k) ** 2).toBeCloseTo(x * x + 2 * k * x + k * k, 9)
  })
})
