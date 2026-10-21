import { describe, expect, it } from 'vitest'
import { checkGenerator, keysOf } from './checks'
import * as g from './lec8'
import type { Params } from './lec8'

// Hand-written alternatives: spaces after commands, a comment, the label on its own line, the .tex extension.
const alternatives = (P: Params) => [
  '\\begin {abstract} % summary',
  '\\section {' + P.name + '}\n\\label {sec:' + P.slug + '}',
  '\\input{' + P.folder + '/' + P.slug + '.tex}',
  'Section~\\ref {sec:' + P.slug + '}',
  '\\appendix % letters from here',
]

describe('latex-lq-8 (paper structure)', () => {
  it('keys, accepts and alternatives pass; traps fail; parameters vary', () =>
    checkGenerator(g, 8, alternatives, { parts: 5, varying: [1, 2, 3], seed: 'lec8' }))

  it('builds the expected keys for three fixed parameter sets', () => {
    expect(keysOf(g, { name: 'Related Work', slug: 'related', folder: 'sections', num: 2, topic: 'x' }))
      .toEqual(['\\begin{abstract}', '\\section{Related Work}\\label{sec:related}', '\\input{sections/related}', 'Section~\\ref{sec:related}', '\\appendix'])
    expect(keysOf(g, { name: 'Empirical Results', slug: 'results', folder: 'chapters', num: 5, topic: 'x' }))
      .toEqual(['\\begin{abstract}', '\\section{Empirical Results}\\label{sec:results}', '\\input{chapters/results}', 'Section~\\ref{sec:results}', '\\appendix'])
    expect(keysOf(g, { name: 'Robustness Checks', slug: 'robustness', folder: 'parts', num: 6, topic: 'x' }))
      .toEqual(['\\begin{abstract}', '\\section{Robustness Checks}\\label{sec:robustness}', '\\input{parts/robustness}', 'Section~\\ref{sec:robustness}', '\\appendix'])
  })

  it('every section has a distinct short name', () => {
    expect(new Set(g.SECTIONS.map((s) => s[1])).size).toBe(g.SECTIONS.length)
  })
})
