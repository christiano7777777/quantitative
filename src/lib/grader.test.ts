import { describe, expect, it } from 'vitest'
import { testConfig } from '../config/test.config'
import { localGrader } from './grader'
import type { Answers, Paper } from './types'

// 20 MC (option 0 correct), 3 LQ with 3, 2 and 4 parts (answers 1, 2, 3, ...)
const paper: Paper = {
  spec: { seed: 's', mcIds: [], lqIds: [] },
  mc: Array.from({ length: 20 }, (_, i) => ({
    id: `q${i}`, lecture: 1, stem: '', explanation: '',
    options: [{ text: 'r', correct: true }, ...[1, 2, 3].map((k) => ({ text: `w${k}`, correct: false, misconception: 'm' }))],
  })),
  lq: [3, 2, 4].map((n, qi) => ({
    id: `g${qi}`, intro: '',
    parts: Array.from({ length: n }, (_, pi) => ({ prompt: '', answer: pi + 1, lecture: 1, explanation: '' })),
  })),
}
const allRight: Answers = { mc: Array(20).fill(0), lq: [['1', '2', '3'], ['1', '2'], ['1', '2', '3', '4']] }

describe('localGrader', () => {
  it('full marks = 50 and passes', () => {
    const r = localGrader.grade(paper, allRight)
    expect(r.max).toBe(50)
    expect(r.total).toBeCloseTo(50, 9)
    expect(r.passed).toBe(true)
  })
  it('blank answers score 0 and fail', () => {
    const r = localGrader.grade(paper, { mc: Array(20).fill(null), lq: [[], [], []] })
    expect(r.total).toBe(0)
    expect(r.passed).toBe(false)
  })
  it('splits each LQ evenly: one wrong part of three loses 10/3', () => {
    const a: Answers = { ...allRight, lq: [['1', '2', 'x'], ['1', '2'], ['1', '2', '3', '4']] }
    expect(localGrader.grade(paper, a).lqScore).toBeCloseTo(30 - 10 / 3, 9)
  })
  it('pass boundary is exactly 40/50: 40 passes, 39 fails', () => {
    const lqFull = allRight.lq
    // 20 MC + two full LQs (20) = 40; blank the third LQ
    const p40 = localGrader.grade(paper, { mc: Array(20).fill(0), lq: [lqFull[0], lqFull[1], []] })
    expect(p40.total).toBeCloseTo(40, 9)
    expect(p40.passed).toBe(true)
    const p39 = localGrader.grade(paper, { mc: [...Array(19).fill(0), 1], lq: [lqFull[0], lqFull[1], []] })
    expect(p39.total).toBeCloseTo(39, 9)
    expect(p39.passed).toBe(false)
  })
  it('MC and fraction/decimal LQ input both work', () => {
    const a: Answers = { mc: Array(20).fill(0), lq: [['1.0', '4/2', '9/3'], ['1', '2'], ['1', '2', '3', '4']] }
    expect(localGrader.grade(paper, a).total).toBeCloseTo(50, 9)
  })
  it('optional per-section minimum fails an otherwise-passing attempt', () => {
    const old = testConfig.sectionMinFraction.mc
    testConfig.sectionMinFraction.mc = 0.9 // needs 18 of 20 MC marks
    try {
      // 15 MC + 30 LQ = 45 clears the 40-mark total, but 15 < 18 on MC
      const weakMc = { mc: [...Array(15).fill(0), ...Array(5).fill(1)], lq: allRight.lq }
      const r = localGrader.grade(paper, weakMc)
      expect(r.total).toBeCloseTo(45, 9)
      expect(r.failedSectionMin).toEqual(['mc'])
      expect(r.passed).toBe(false)
      // 18 MC + 30 LQ passes both rules
      const ok = localGrader.grade(paper, { mc: [...Array(18).fill(0), 1, 1], lq: allRight.lq })
      expect(ok.failedSectionMin).toEqual([])
      expect(ok.passed).toBe(true)
    } finally {
      testConfig.sectionMinFraction.mc = old
    }
  })
})
