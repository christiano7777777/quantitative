import { describe, expect, it } from 'vitest'
import { topics } from '../data'
import { testConfig } from '../config/test.config'
import { banks } from '../lib/content'
import { makeRng } from '../lib/rng'
import { findGenerator, renderPaper, selectPaper } from '../lib/test-builder'

// Structural rules every MC bank must obey (CONTRIBUTING.md). These cannot check that a "correct"
// option is true or that a distractor is false; that needs a human reader.
describe.each(Object.entries(banks))('bank %s: multiple choice', (topicId, bank) => {
  const lectures = topics.find((t) => t.id === topicId)!.lectures.length

  it('has unique question ids', () => {
    const ids = bank.mc.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers every lecture at least 3 times', () => {
    for (let l = 1; l <= lectures; l++) expect(bank.mc.filter((q) => q.lecture === l).length).toBeGreaterThanOrEqual(3)
  })

  it('every question has lecture in range, exactly 2 correct and 5 distractors with misconception notes', () => {
    for (const q of bank.mc) {
      expect(q.lecture, q.id).toBeGreaterThanOrEqual(1)
      expect(q.lecture, q.id).toBeLessThanOrEqual(lectures)
      expect(q.correct, q.id).toHaveLength(2)
      expect(q.distractors, q.id).toHaveLength(5)
      for (const d of q.distractors) expect(d.misconception.trim().length, q.id).toBeGreaterThan(5)
      expect(q.explanation.trim().length, q.id).toBeGreaterThan(10)
    }
  })

  it('no option text is repeated within a question, nor equal to the stem', () => {
    for (const q of bank.mc) {
      const texts = [...q.correct, ...q.distractors.map((d) => d.text)].map((t) => t.trim())
      expect(new Set(texts).size, q.id).toBe(texts.length)
      expect(texts.includes(q.stem.trim()), q.id).toBe(false)
    }
  })

  it('has balanced $ delimiters so KaTeX never sees a half-open formula', () => {
    for (const q of bank.mc) {
      for (const s of [q.stem, q.explanation, ...q.correct, ...q.distractors.map((d) => d.text)])
        expect((s.match(/\$/g) ?? []).length % 2, `${q.id}: ${s}`).toBe(0)
    }
  })

  it('contains no control characters (a lost backslash can turn rho into a carriage return)', () => {
    for (const q of bank.mc)
      for (const s of [q.stem, q.explanation, ...q.correct, ...q.distractors.flatMap((d) => [d.text, d.misconception])])
        expect(/[\u0000-\u001f\u007f]/.test(s), `${q.id}: ${JSON.stringify(s)}`).toBe(false)
  })

  it('does not leak the answer through option length', () => {
    // visible length: LaTeX commands count as one character, delimiters and spaces as none
    const vis = (s: string) => s.replace(/\\[a-zA-Z]+/g, 'x').replace(/[$%{}\s\\]/g, '').length
    // Over every possible displayed set (2 true wordings x 10 distractor triples), where does the true
    // option rank by length among the 4 shown? 0 = longest ... 3 = shortest; ties share the position.
    const bankRanks = [0, 0, 0, 0]
    for (const q of bank.mc) {
      const ranks = [0, 0, 0, 0]
      let n = 0
      const ds = q.distractors.map((d) => vis(d.text))
      for (const c of q.correct.map(vis))
        for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) for (let k = j + 1; k < 5; k++) {
          const others = [ds[i], ds[j], ds[k]]
          const longer = others.filter((x) => x > c).length
          const equal = others.filter((x) => x === c).length
          for (let t = 0; t <= equal; t++) ranks[longer + t] += 1 / (equal + 1)
          n++
        }
      const p = ranks.map((r) => r / n)
      expect(Math.max(...p), `${q.id}: the true option's length rank is too predictable: ${p.map((x) => x.toFixed(2))}`).toBeLessThanOrEqual(0.8)
      p.forEach((x, r) => (bankRanks[r] += x / bank.mc.length))
    }
    // chance is 0.25 for each rank; "always pick the longest/shortest/etc." must not beat it by much
    bankRanks.forEach((x, r) => expect(x, `bank-wide frequency of rank ${r}: ${bankRanks.map((y) => y.toFixed(2))}`).toBeGreaterThan(0.15))
    bankRanks.forEach((x, r) => expect(x, `bank-wide frequency of rank ${r}: ${bankRanks.map((y) => y.toFixed(2))}`).toBeLessThan(0.35))
  })

  it('has no numeric-only answers (MC is conceptual)', () => {
    for (const q of bank.mc)
      for (const s of [...q.correct, ...q.distractors.map((d) => d.text)])
        expect(/^\s*\$?-?[\d.]+(\/[\d.]+)?\$?\s*\.?$/.test(s), `${q.id}: ${s}`).toBe(false)
  })

  it('a correct option is never also listed as a distractor in another wording of the same question', () => {
    for (const q of bank.mc) {
      const norm = (s: string) => s.toLowerCase().replace(/[\s.$]/g, '')
      const right = new Set(q.correct.map(norm))
      for (const d of q.distractors) expect(right.has(norm(d.text)), q.id).toBe(false)
    }
  })
})

describe.each(Object.entries(banks))('bank %s: long-question blueprint', (_topicId, bank) => {
  it('if lqSlots is present: one slot per LQ, known generator ids, every generator in exactly one slot', () => {
    if (!bank.lqSlots) return
    const ids = bank.lq.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(bank.lqSlots).toHaveLength(testConfig.lqCount)
    const used = bank.lqSlots.flat()
    for (const id of used) expect(ids, id).toContain(id)
    expect(new Set(used).size).toBe(used.length)
    expect([...used].sort()).toEqual([...ids].sort())
    for (const slot of bank.lqSlots) expect(slot.length).toBeGreaterThan(0)
  })
})

describe.each(Object.entries(banks))('bank %s: final test blueprint', (topicId, bank) => {
  it('if examSlots is present: one slot per LQ, composite questions that cover every lecture', () => {
    if (!bank.examSlots) return
    expect(bank.examSlots).toHaveLength(testConfig.lqCount)
    const lectures = topics.find((t) => t.id === topicId)!.lectures.length
    const seen = new Set<number>()
    for (const slot of bank.examSlots) {
      expect(slot.length).toBeGreaterThan(0)
      const slotLectures = new Set<number>()
      for (const id of slot) {
        const g = findGenerator(bank, id)
        expect(g, id).toBeDefined()
        const inst = g!.generate(makeRng('exam-check'))
        inst.parts.forEach((p) => { expect(p.lecture).toBeGreaterThanOrEqual(1); expect(p.lecture).toBeLessThanOrEqual(lectures); slotLectures.add(p.lecture) })
        expect(inst.parts.length).toBeLessThanOrEqual(10)
      }
      slotLectures.forEach((l) => seen.add(l))
    }
    expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, i) => i + 1))
  })

  it('every final test attempt asks at least one long-question part from every lecture', () => {
    if (!bank.examSlots) return
    const lectures = topics.find((t) => t.id === topicId)!.lectures.length
    for (let i = 0; i < 10; i++) {
      const paper = renderPaper(bank, selectPaper(bank, `cover${i}`))
      const asked = new Set(paper.lq.flatMap((q) => q.parts.map((p) => p.lecture)))
      expect([...asked].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, k) => k + 1))
    }
  })
})
