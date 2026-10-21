import { describe, expect, it } from 'vitest'
import { gradeBlank } from '../../../../lib/blank-grader'
import { checkGenerator, keysOf } from './checks'
import * as g from './lec7'
import { OPS, SETS, type Params } from './lec7'

// Hand-written alternatives: \newcommand without braces around the name, spaces, the formula written with the macro
// bodies spelled out (it draws the same picture), (\ref{...}) for \eqref.
const alternatives = (P: Params) => {
  const S = SETS[P.set], O = OPS[P.op]
  return [
    '\\newcommand {\\' + S.name + '} {' + S.body + '}',
    '\\newcommand{\\' + O.name + '} [1] {' + O.body + '} % one argument',
    O.body.replace('#1', P.v) + '\\le' + P.c + ',\\quad ' + P.v + '\\in' + S.body + '^' + P.d,
    '\\label {eq:' + P.eq + '}',
    '( \\ref{eq:' + P.eq + '} )',
    (P.start ? '\\Cref' : '\\cref') + ' {sec:' + P.sec + '}',
  ]
}

describe('latex-lq-7 (cross-references and macros)', () => {
  it('keys, accepts and alternatives pass; traps fail; parameters vary', () =>
    checkGenerator(g, 7, alternatives, { parts: 6, varying: [0, 1, 2, 3, 4, 5], minDistinct: 2, seed: 'lec7' }))

  it('the formula part is graded with the paper\'s macros: the key draws the same as its expansion, and not as a wrong bound', () => {
    const P: Params = { set: 0, op: 0, v: 'x', d: 'n', c: 2, eq: 'loss', sec: 'data', start: false }
    const b = g.build(P).parts[2].blank!
    expect(gradeBlank('\\lVert x \\rVert \\le 2, \\quad x \\in \\mathbb{R}^{n}', b).correct).toBe(true)
    expect(gradeBlank('\\norm{x} \\le 3, \\quad x \\in \\R^{n}', b).correct).toBe(false)
  })

  it('builds the expected keys for three fixed parameter sets', () => {
    expect(keysOf(g, { set: 0, op: 0, v: 'x', d: 'n', c: 2, eq: 'loss', sec: 'data', start: false })).toEqual([
      '\\newcommand{\\R}{\\mathbb{R}}', '\\newcommand{\\norm}[1]{\\lVert #1 \\rVert}', '\\norm{x} \\le 2, \\quad x \\in \\R^{n}',
      '\\label{eq:loss}', '\\eqref{eq:loss}', '\\cref{sec:data}',
    ])
    expect(keysOf(g, { set: 2, op: 1, v: 'w', d: 'k', c: 10, eq: 'update', sec: 'model', start: true })).toEqual([
      '\\newcommand{\\Z}{\\mathbb{Z}}', '\\newcommand{\\abs}[1]{\\lvert #1 \\rvert}', '\\abs{w} \\le 10, \\quad w \\in \\Z^{k}',
      '\\label{eq:update}', '\\eqref{eq:update}', '\\Cref{sec:model}',
    ])
    expect(keysOf(g, { set: 1, op: 2, v: 'u', d: 'm', c: 5, eq: 'pricing', sec: 'results', start: false })).toEqual([
      '\\newcommand{\\N}{\\mathbb{N}}', '\\newcommand{\\vect}[1]{\\mathbf{#1}}', '\\vect{u} \\le 5, \\quad u \\in \\N^{m}',
      '\\label{eq:pricing}', '\\eqref{eq:pricing}', '\\cref{sec:results}',
    ])
  })
})
