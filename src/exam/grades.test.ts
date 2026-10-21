import { describe, expect, it } from 'vitest'
import { gradeScale, percentToGrade } from './config'
import { pick, statusLabel, summarise, toPercent, weightsOf } from './grades'
import type { CodingAttempt, WrittenAttempt } from './types'

const w = (id: string, percent: number | undefined, at: string): WrittenAttempt => ({
  id, startedAt: at, submittedAt: at, answers: {}, max: 100, marks: percent, percent, grade: undefined,
})
const c = (id: string, percent: number, at: string): CodingAttempt => ({
  id, startedAt: at, submittedAt: at, results: [], marks: percent, max: 100, percent, grade: percentToGrade(percent),
})

describe('grade scale', () => {
  it('is sorted high to low and ends at 0', () => {
    const mins = gradeScale.map((b) => b.min)
    expect([...mins].sort((a, b) => b - a)).toEqual(mins)
    expect(mins[mins.length - 1]).toBe(0)
  })
  it('gives the band whose minimum is reached, with exact boundaries going up', () => {
    expect(percentToGrade(100)).toBe('A+')
    expect(percentToGrade(90)).toBe('A+')
    expect(percentToGrade(89.99)).toBe('A')
    expect(percentToGrade(50)).toBe('C-')
    expect(percentToGrade(49.9)).toBe('D+')
    expect(percentToGrade(0)).toBe('F')
    expect(percentToGrade(-5)).toBe('F')
    expect(percentToGrade(130)).toBe('A+')
  })
})

describe('weights', () => {
  it('defaults to 70/30 and normalises overrides', () => {
    expect(weightsOf()).toEqual({ written: 0.7, coding: 0.3 })
    expect(weightsOf({ written: 1, coding: 0 })).toEqual({ written: 1, coding: 0 })
    expect(weightsOf({ written: 3, coding: 1 })).toEqual({ written: 0.75, coding: 0.25 })
  })
  it('rejects nonsense', () => {
    expect(() => weightsOf({ written: 0, coding: 0 })).toThrow()
    expect(() => weightsOf({ written: -1, coding: 2 })).toThrow()
  })
})

describe('summarise', () => {
  it('needs both parts before showing a total', () => {
    expect(summarise([w('a', 80, '1')], []).total).toBeNull()
    expect(summarise([], [c('a', 80, '1')]).total).toBeNull()
    const s = summarise([w('a', 80, '1')], [c('b', 50, '1')])
    expect(s.total!.percent).toBeCloseTo(0.7 * 80 + 0.3 * 50, 9)
    expect(s.total!.percent).toBeCloseTo(71, 9)
    expect(s.total!.grade).toBe('B')
  })
  it('ignores written attempts that are not marked yet', () => {
    expect(summarise([w('a', undefined, '1')], [c('b', 50, '1')]).total).toBeNull()
  })
  it('a written-only topic (coding weight 0) is complete without coding', () => {
    const s = summarise([w('a', 92, '1')], [], { written: 1, coding: 0 })
    expect(s.total).toEqual({ percent: 92, grade: 'A+' })
  })
  it('uses the best attempt by default and the latest on request', () => {
    const ws = [w('a', 90, '2026-01-01'), w('b', 40, '2026-02-01')]
    expect(summarise(ws, [c('x', 100, '1')]).written!.percent).toBe(90)
    expect(summarise(ws, [c('x', 100, '1')], undefined, 'latest').written!.percent).toBe(40)
    expect(pick(ws, 'latest')!.id).toBe('b')
  })
  it('takes the later attempt on a tie for best', () => {
    expect(pick([w('a', 70, '1'), w('b', 70, '2')], 'best')!.id).toBe('b')
  })
})

describe('statusLabel', () => {
  it('shows Pass for a passed topic test, the grade once the big exam is complete, nothing otherwise', () => {
    const none = summarise([], [])
    expect(statusLabel(none, true)).toBe('Pass')
    expect(statusLabel(none, false)).toBeNull()
    expect(statusLabel(summarise([w('a', 95, '1')], [c('b', 95, '1')]), true)).toBe('A+')
    expect(statusLabel(summarise([w('a', 95, '1')], []), true)).toBe('Pass')
  })
  it('toPercent handles a zero maximum', () => {
    expect(toPercent(3, 0)).toBe(0)
    expect(toPercent(3, 4)).toBe(75)
  })
})
