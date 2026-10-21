import { describe, expect, it } from 'vitest'
import { checkGenerator, keysOf } from './checks'
import * as g from './lec6'
import { citeKey, type Params } from './lec6'

// Hand-written alternatives: an upper-case entry type and field names, fields in another order, "quoted" values and a
// bare year, all on one line; commands with spaces.
const alternatives = (P: Params) => {
  const k = citeKey(P.authors[0], P.year)
  const k2 = citeKey(P.other[0], P.otherYear)
  return [
    ' ' + k2 + ' ',
    '@ARTICLE{' + k + ', Year = ' + P.year + ', Journal = "' + P.journal + '", Title = {' + P.title + '}, Author = {' + P.authors[0].family + ', ' +
      P.authors[0].given + ' and ' + P.authors[1].family + ', ' + P.authors[1].given + '},}',
    (P.textual ? '\\citet' : '\\citep') + ' {' + k + '}',
    '\\citep{' + k + ', ' + k2 + '}',
    P.system === 'biblatex' ? '\\addbibresource {' + P.file + '.bib}' : '\\bibliography {' + P.file + '}',
    P.system === 'biblatex' ? '\\printbibliography % references' : '\\bibliographystyle {plainnat}',
  ]
}

describe('latex-lq-6 (citations)', () => {
  it('keys, accepts and alternatives pass; traps fail; parameters vary', () =>
    checkGenerator(g, 6, alternatives, { parts: 6, varying: [0, 1, 2, 3, 4], seed: 'lec6' }))

  it('builds the expected keys for three fixed parameter sets', () => {
    const ann = { given: 'Ann', family: 'Lee' }, bo = { given: 'Bo', family: 'Kim' }, carla = { given: 'Carla', family: 'Diaz' }, dev = { given: 'Dev', family: 'Patel' }
    const base: Params = { other: [carla, dev], otherYear: 2019, authors: [ann, bo], year: 2021, title: 'Momentum in Small Markets', journal: 'Journal of Finance', textual: true, system: 'bibtex', file: 'refs' }
    const entry = '@article{lee2021,\n  author = {Lee, Ann and Kim, Bo},\n  title = {Momentum in Small Markets},\n  journal = {Journal of Finance},\n  year = {2021}\n}'
    expect(keysOf(g, base)).toEqual(['diaz2019', entry, '\\citet{lee2021}', '\\citep{lee2021,diaz2019}', '\\bibliography{refs}', '\\bibliographystyle{plainnat}'])
    expect(keysOf(g, { ...base, textual: false, system: 'biblatex', file: 'library' }).slice(2))
      .toEqual(['\\citep{lee2021}', '\\citep{lee2021,diaz2019}', '\\addbibresource{library.bib}', '\\printbibliography'])
    const third = keysOf(g, { ...base, other: [dev, ann], otherYear: 2015, authors: [bo, carla], year: 2024 })
    expect([third[0], third[2], third[3]]).toEqual(['patel2015', '\\citet{kim2024}', '\\citep{kim2024,patel2015}'])
  })

  it('the convention gives the first author\'s lower-case surname and the four-digit year', () => {
    expect(citeKey({ given: 'Hana', family: 'Sato' }, 2023)).toBe('sato2023')
  })
})
