import { describe, expect, it } from 'vitest'
import { testConfig } from '../config/test.config'
import { renderPaper, selectPaper } from './test-builder'
import type { LQGenerator, MCQuestion, TestBank } from './types'

// Synthetic bank: 11 lectures, 5 questions each (55 total), 5 generators.
const mc: MCQuestion[] = Array.from({ length: 55 }, (_, i) => ({
  id: `q${i}`,
  lecture: (i % 11) + 1,
  stem: `stem ${i}`,
  correct: [`q${i} right A`, `q${i} right B`],
  distractors: Array.from({ length: 5 }, (_, k) => ({ text: `q${i} wrong ${k}`, misconception: `m${k}` })),
  explanation: 'e',
}))
const lq: LQGenerator[] = Array.from({ length: 5 }, (_, i) => ({
  id: `g${i}`,
  generate: (rng) => {
    const n = rng.int(2, 99)
    return { intro: `n=${n}`, parts: [{ prompt: 'p', answer: n, lecture: 1, explanation: 'e' }] }
  },
}))
const bank: TestBank = { mc, lq }

describe('selectPaper', () => {
  it('picks mcCount distinct MC questions and lqCount generators', () => {
    const s = selectPaper(bank, 'a')
    expect(s.mcIds).toHaveLength(testConfig.mcCount)
    expect(new Set(s.mcIds).size).toBe(testConfig.mcCount)
    expect(s.lqIds).toHaveLength(testConfig.lqCount)
    expect(new Set(s.lqIds).size).toBe(testConfig.lqCount)
  })
  it('covers every lecture in every attempt (checked over 200 seeds)', () => {
    for (let i = 0; i < 200; i++) {
      const s = selectPaper(bank, `seed${i}`)
      const lecs = new Set(s.mcIds.map((id) => mc.find((q) => q.id === id)!.lecture))
      expect(lecs.size).toBe(11)
    }
  })
  it('gives every lecture a quota of 1 or 2 questions, 20 in total, with exactly 9 lectures at 2 (200 seeds)', () => {
    for (let i = 0; i < 200; i++) {
      const s = selectPaper(bank, `quota${i}`)
      const per = new Map<number, number>()
      for (const id of s.mcIds) { const l = mc.find((q) => q.id === id)!.lecture; per.set(l, (per.get(l) ?? 0) + 1) }
      expect([...per.keys()]).toHaveLength(11)
      expect([...per.values()].every((n) => n === 1 || n === 2)).toBe(true)
      expect([...per.values()].filter((n) => n === 2)).toHaveLength(9)
    }
  })
  it('spreads the extra questions: over many seeds every lecture is sometimes at 2 and sometimes at 1', () => {
    const twos = new Map<number, number>()
    for (let i = 0; i < 400; i++) {
      const per = new Map<number, number>()
      for (const id of selectPaper(bank, `spread${i}`).mcIds) { const l = mc.find((q) => q.id === id)!.lecture; per.set(l, (per.get(l) ?? 0) + 1) }
      for (const [l, n] of per) if (n === 2) twos.set(l, (twos.get(l) ?? 0) + 1)
    }
    for (let l = 1; l <= 11; l++) { expect(twos.get(l) ?? 0).toBeGreaterThan(400 * 0.6); expect(twos.get(l)!).toBeLessThan(400 * 0.95) } // expected 9/11 = 82%
  })
  it('tops up from other lectures when a lecture has fewer questions than its quota', () => {
    const thin: TestBank = { mc: mc.filter((q) => q.lecture !== 3 || q.id === 'q2'), lq }
    const s = selectPaper(thin, 'thin')
    expect(s.mcIds).toHaveLength(testConfig.mcCount)
    expect(new Set(s.mcIds).size).toBe(testConfig.mcCount)
  })
  it('prefers unseen questions: with 35 unseen available, none of the 20 chosen was seen', () => {
    const seen = new Set(mc.slice(0, 20).map((q) => q.id)) // 20 seen, 35 unseen
    for (let i = 0; i < 50; i++) {
      const s = selectPaper(bank, `u${i}`, seen)
      // each lecture has at least 3 unseen of its 5, so the unseen-first rule leaves no seen question
      expect(s.mcIds.filter((id) => seen.has(id))).toEqual([])
    }
  })
  it('falls back to seen questions when the unseen ones run out', () => {
    const seen = new Set(mc.map((q) => q.id))
    expect(selectPaper(bank, 'x', seen).mcIds).toHaveLength(testConfig.mcCount)
  })
  it('is deterministic per seed', () => expect(selectPaper(bank, 'same')).toEqual(selectPaper(bank, 'same')))
})

describe('selectPaper with LQ slots', () => {
  const slotted: TestBank = { mc, lq, lqSlots: [['g0'], ['g1', 'g2'], ['g3', 'g4']] }
  it('draws exactly one generator per slot, and every option of a slot appears over many seeds', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const ids = selectPaper(slotted, `slot${i}`).lqIds
      expect(ids).toHaveLength(3)
      expect(ids[0]).toBe('g0')
      expect(['g1', 'g2']).toContain(ids[1])
      expect(['g3', 'g4']).toContain(ids[2])
      ids.forEach((x) => seen.add(x))
    }
    expect([...seen].sort()).toEqual(['g0', 'g1', 'g2', 'g3', 'g4'])
  })
})

describe('renderPaper', () => {
  const spec = selectPaper(bank, 'render')
  const paper = renderPaper(bank, spec)
  it('gives each MC 4 distinct options with exactly one correct', () => {
    for (const q of paper.mc) {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4)
      expect(q.options.filter((o) => o.correct)).toHaveLength(1)
      expect(q.options.filter((o) => !o.correct).every((o) => o.misconception)).toBe(true)
    }
  })
  it('rebuilds the identical paper from the spec alone', () => expect(renderPaper(bank, spec)).toEqual(paper))
  it('uses both paraphrases of a correct answer and varies the shown distractors across seeds', () => {
    const shown = new Set<string>(), wrong = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const p = renderPaper(bank, { seed: `v${i}`, mcIds: ['q0'], lqIds: [] })
      p.mc[0].options.forEach((o) => (o.correct ? shown : wrong).add(o.text))
    }
    expect(shown.size).toBe(2)
    expect(wrong.size).toBe(5)
  })
  it('gives LQ different numbers for different seeds', () => {
    const intros = new Set<string>()
    for (let i = 0; i < 20; i++) intros.add(renderPaper(bank, { seed: `n${i}`, mcIds: [], lqIds: ['g0'] }).lq[0].intro)
    expect(intros.size).toBeGreaterThan(10)
  })
  it('throws on an unknown question id', () => {
    expect(() => renderPaper(bank, { seed: 's', mcIds: ['nope'], lqIds: [] })).toThrow()
  })
})
