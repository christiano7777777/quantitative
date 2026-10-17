import { describe, expect, it } from 'vitest'
import { checkAnswer, parseAnswer, withinTolerance } from './parse-answer'

describe('parseAnswer', () => {
  const ok: [string, number][] = [
    ['0.5', 0.5], ['.5', 0.5], ['5.', 5], ['-3', -3], ['+2', 2], ['  0.25  ', 0.25],
    ['1/2', 0.5], ['-3/4', -0.75], [' 3 / 8 ', 0.375], ['1e-3', 0.001], ['2.5E2', 250],
    ['−0.5', -0.5], ['1.5/3', 0.5],
  ]
  it.each(ok)('accepts %s', (s, v) => expect(parseAnswer(s)).toBeCloseTo(v, 12))
  const bad = ['', ' ', 'abc', '50%', '1,000', '1/2+1/3', '1/0', '1/2/3', '--1', '1..2', 'NaN', 'Infinity', '0x10', '1 2']
  it.each(bad)('rejects %j', (s) => expect(parseAnswer(s)).toBeNull())
  it('0.5 and 1/2 are equal', () => expect(parseAnswer('0.5')).toBe(parseAnswer('1/2')))
})

describe('tolerance', () => {
  it('default is absolute 0.005', () => {
    expect(withinTolerance(0.334, 1 / 3)).toBe(true)
    expect(withinTolerance(0.34, 1 / 3)).toBe(false)
  })
  it('explicit abs and rel are each honoured; either passes when both given', () => {
    expect(withinTolerance(100.4, 100, { abs: 0.5 })).toBe(true)
    expect(withinTolerance(100.6, 100, { abs: 0.5 })).toBe(false)
    expect(withinTolerance(105, 100, { rel: 0.05 })).toBe(true)
    expect(withinTolerance(106, 100, { rel: 0.05 })).toBe(false)
    expect(withinTolerance(100.4, 100, { abs: 0.5, rel: 0.001 })).toBe(true)
  })
  it('an explicit rel-only tolerance does not silently add the default abs', () => {
    expect(withinTolerance(0.0003, 0, { rel: 0.01 })).toBe(false)
  })
  it('checkAnswer combines parsing and tolerance', () => {
    expect(checkAnswer('1/3', 0.3333)).toBe(true)
    expect(checkAnswer('33%', 0.33)).toBe(false)
    expect(checkAnswer('', 0)).toBe(false)
  })
})
