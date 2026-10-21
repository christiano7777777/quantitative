import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { checkGenerator, keysOf } from './checks'
import * as g from './lec5'
import type { Params } from './lec5'

// Hand-written alternatives: options in the other order, spaces around = and between points, comments.
const alternatives = (P: Params) => [
  '\\begin{axis}[ ylabel = {' + P.ylabel + '} , xlabel = {' + P.xlabel + '} ]',
  '\\addplot [domain=' + P.a + ':' + P.b + '] {' + P.expr + '}; % the curve',
  '\\addplot coordinates {' + P.points.map(([x, y]) => '(' + x + ',' + y + ')').join('  ') + '} ;',
  '\\legend{' + P.curveName + ',' + P.dataName + '}',
  ' pdf ',
]

describe('latex-lq-5 (plotting)', () => {
  it('keys, accepts and alternatives pass; traps fail; parameters vary', () =>
    checkGenerator(g, 5, alternatives, { parts: 5, varying: [0, 1, 2, 3], seed: 'lec5' }))

  it('builds the expected keys for three fixed parameter sets', () => {
    expect(keysOf(g, { xlabel: 'Strike', ylabel: 'Implied volatility', expr: 'x^2', a: 0, b: 3, points: [[0, 1], [2, 5], [4, 3]], curveName: 'model', dataName: 'observed', fig: 'roc' })).toEqual([
      '\\begin{axis}[xlabel={Strike}, ylabel={Implied volatility}]', '\\addplot[domain=0:3]{x^2};', '\\addplot coordinates {(0,1) (2,5) (4,3)};', '\\legend{model, observed}', 'pdf',
    ])
    expect(keysOf(g, { xlabel: 'Time (years)', ylabel: 'Price', expr: 'ln(x)', a: 1, b: 6, points: [[1, 9], [3, 2], [6, 7]], curveName: 'fit', dataName: 'data', fig: 'returns' })).toEqual([
      '\\begin{axis}[xlabel={Time (years)}, ylabel={Price}]', '\\addplot[domain=1:6]{ln(x)};', '\\addplot coordinates {(1,9) (3,2) (6,7)};', '\\legend{fit, data}', 'pdf',
    ])
    expect(keysOf(g, { xlabel: 'Dose', ylabel: 'Response', expr: 'exp(-x)', a: -1, b: 4, points: [[0, 4], [1, 4], [5, 8]], curveName: 'theory', dataName: 'simulation', fig: 'drawdown' })).toEqual([
      '\\begin{axis}[xlabel={Dose}, ylabel={Response}]', '\\addplot[domain=-1:4]{exp(-x)};', '\\addplot coordinates {(0,4) (1,4) (5,8)};', '\\legend{theory, simulation}', 'pdf',
    ])
  })

  it('a domain with sqrt or ln starts above zero, and the points are in increasing x', () => {
    for (let s = 0; s < 300; s++) {
      const P = g.sample(makeRng(`lec5-domain-${s}`))
      if (P.expr === 'sqrt(x)' || P.expr === 'ln(x)') expect(P.a).toBeGreaterThan(0)
      expect(P.b).toBeGreaterThan(P.a)
      for (let i = 1; i < P.points.length; i++) expect(P.points[i][0]).toBeGreaterThan(P.points[i - 1][0])
    }
  })
})
