import { describe, expect, it } from 'vitest'
import { checkGenerator, keysOf } from './checks'
import * as g from './lec10'
import { ENGINE_FLAG, type Params } from './lec10'

// Hand-written alternatives: extra spaces around single tokens (exact mode trims them), the .tex extension in \input,
// the double-hyphen spelling of the latexmk engine option.
const alternatives = (P: Params) => [
  '-' + ENGINE_FLAG[P.engine],
  '\\input {sections/' + P.section + '.tex}',
  '  *.' + P.ext + ' ',
  null,
  ' sections/' + P.edited + '.tex',
  P.direction + ' ',
]

describe('latex-lq-10 (collaboration)', () => {
  it('keys, accepts and alternatives pass; traps fail; parameters vary', () =>
    checkGenerator(g, 10, alternatives, { parts: 6, varying: [0, 1, 2, 4], minDistinct: 3, seed: 'lec10' }))

  it('builds the expected keys for three fixed parameter sets', () => {
    expect(keysOf(g, { engine: 'pdflatex', section: 'data', ext: 'aux', keepPdf: true, edited: 'results', direction: 'push' }))
      .toEqual(['-pdf', '\\input{sections/data}', '*.aux', '-c', 'sections/results.tex', 'push'])
    expect(keysOf(g, { engine: 'xelatex', section: 'method', ext: 'log', keepPdf: false, edited: 'data', direction: 'pull' }))
      .toEqual(['-xelatex', '\\input{sections/method}', '*.log', '-C', 'sections/data.tex', 'pull'])
    expect(keysOf(g, { engine: 'lualatex', section: 'literature', ext: 'bbl', keepPdf: true, edited: 'method', direction: 'pull' }))
      .toEqual(['-lualatex', '\\input{sections/literature}', '*.bbl', '-c', 'sections/method.tex', 'pull'])
  })

  it('the clean option is case-sensitive in both directions', () => {
    const keep = g.build({ engine: 'pdflatex', section: 'data', ext: 'aux', keepPdf: true, edited: 'results', direction: 'push' }).parts[3].blank!
    const all = g.build({ engine: 'pdflatex', section: 'data', ext: 'aux', keepPdf: false, edited: 'results', direction: 'push' }).parts[3].blank!
    expect(keep.key).not.toBe(all.key)
  })
})
