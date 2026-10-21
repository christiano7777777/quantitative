import { describe, expect, it } from 'vitest'
import { normalizeExact, normalizeSet, normalizeTokens, preNormalize, stripComments, tokenize } from './tex-tokens'

describe('tokenize', () => {
  it('reads control words, control symbols, groups and single characters', () => {
    expect(tokenize('\\frac {a}b')).toEqual([
      { t: 'cw', v: 'frac' }, { t: 'open', v: '{' }, { t: 'ch', v: 'a' }, { t: 'close', v: '}' }, { t: 'ch', v: 'b' },
    ])
    expect(tokenize('\\\\[2pt]').map((k) => k.t)).toEqual(['cs', 'lb', 'ch', 'ch', 'ch', 'rb'])
    expect(tokenize('x^10').map((k) => k.v)).toEqual(['x', '^', '1', '0'])
    expect(tokenize('\\%')).toEqual([{ t: 'cs', v: '%' }])
    expect(tokenize('\\ ')).toEqual([{ t: 'cs', v: ' ' }])
    expect(tokenize('a\\')).toEqual([{ t: 'ch', v: 'a' }, { t: 'ch', v: '\\' }])
    expect(tokenize('\\makeatletter\\@x').map((k) => k.v)).toEqual(['makeatletter', '@x'])
  })
  it('removes comments but keeps \\%', () => {
    expect(stripComments('a % note\n  b')).toBe('a b')
    expect(stripComments('50\\% off % why')).toBe('50\\% off ')
    expect(stripComments('%all')).toBe('')
  })
})

describe('preNormalize', () => {
  it('undoes phone punctuation and unicode variants', () => {
    expect(preNormalize('  \u201cx\u201d \u2018y\u2019 a\u2014b c\u2026 \uff3cd\u00a0 ')).toBe('"x" \'y\' a--b c... \\d')
    expect(preNormalize('a\r\nb')).toBe('a\nb')
    expect(preNormalize('e\u0301')).toBe('\u00e9')
  })
})

describe('space rules', () => {
  it('keeps a space only between words', () => {
    expect(normalizeTokens('Related Work')).not.toBe(normalizeTokens('RelatedWork'))
    expect(normalizeTokens('\\emph{very} good')).not.toBe(normalizeTokens('\\emph{very}good'))
    expect(normalizeTokens('a ,b')).toBe(normalizeTokens('a,b'))
    expect(normalizeTokens('a  \n\t b')).toBe(normalizeTokens('a b'))
    expect(normalizeTokens('& 1 \\\\')).toBe(normalizeTokens('&1\\\\'))
  })
})

describe('brace unwrapping', () => {
  it('unwraps one-token arguments only', () => {
    expect(normalizeTokens('\\hat{x}')).toBe(normalizeTokens('\\hat x'))
    expect(normalizeTokens('x_{i}')).toBe(normalizeTokens('x_i'))
    expect(normalizeTokens('x_{ij}')).not.toBe(normalizeTokens('x_ij'))
    expect(normalizeTokens('\\sqrt[3]{x}')).toBe(normalizeTokens('\\sqrt[3]x'))
    expect(normalizeTokens('{a}b')).not.toBe(normalizeTokens('ab')) // not an argument: kept as written
    expect(normalizeTokens('\\frac{\\alpha}{2}')).toBe(normalizeTokens('\\frac\\alpha2'))
  })
  it('returns null for unbalanced braces', () => {
    expect(normalizeTokens('{')).toBeNull()
    expect(normalizeTokens('}')).toBeNull()
    expect(normalizeSet('\\usepackage{a')).toBeNull()
    expect(normalizeTokens('[0,1)')).not.toBeNull() // brackets need not balance
  })
})

describe('set mode', () => {
  it('sorts nested style lists and keeps other brace lists in order', () => {
    expect(normalizeSet('\\node[a/.style={x,y},b]')).toBe(normalizeSet('\\node[b,a/.style={y,x}]'))
    expect(normalizeSet('\\node[a={x,y}]')).not.toBe(normalizeSet('\\node[a={y,x}]'))
    expect(normalizeSet('\\usetikzlibrary{arrows.meta,calc}')).toBe(normalizeSet('\\usetikzlibrary{calc,arrows.meta}'))
    expect(normalizeSet('\\begin{table*}[tb!]')).toBe(normalizeSet('\\begin{table*}[!bt]'))
  })
  it('leaves a bib entry key first and lower-cases type and field names', () => {
    expect(normalizeSet('@INPROCEEDINGS{Kim2021, Pages={1--9}, BookTitle={Conf}}')).toBe(normalizeSet('@inproceedings{Kim2021,booktitle={Conf},pages={1--9}}'))
    expect(normalizeSet('@article{Kim2021, a={1}}')).not.toBe(normalizeSet('@article{kim2021, a={1}}'))
  })
})

describe('exact', () => {
  it('collapses whitespace and nothing else', () => {
    expect(normalizeExact('  git   add\t-A ')).toBe('git add -A')
    expect(normalizeExact('A')).not.toBe(normalizeExact('a'))
  })
})
