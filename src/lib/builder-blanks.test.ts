import { describe, expect, it } from 'vitest'
import { lectureConfig, testConfig } from '../config/test.config'
import { BOX, typed } from '../content/shared/typed'
import { lectureRules, localGrader, topicRules } from './grader'
import { selectLecturePaper } from './lessons'
import { buildExamSlots, quizLqId } from './lq-composite'
import { renderPaper, selectPaper } from './test-builder'
import type { Answers, BlankQuestion, Lesson, LQGenerator, Paper, TestBank } from './types'

// A fixture typed topic: 10 lectures, 10 short questions each (2 sections), one 5-part typed long question per lecture.
const L = 10
const blanks: BlankQuestion[] = []
for (let l = 1; l <= L; l++)
  for (let k = 0; k < 10; k++)
    blanks.push({
      id: `fx-${l}-${k}`, lecture: l, section: 1 + (k % 2), kind: 'template', prompt: `Lecture ${l} question ${k}.`,
      template: '\\cmd{' + BOX + '}', blank: { mode: 'tokens', key: `k${l}x${k}` }, explanation: 'The key is the label shown.',
    })
const gens: LQGenerator[] = Array.from({ length: L }, (_, i) => ({
  id: `fx-lq-${i + 1}`,
  generate: (rng) => {
    const w = rng.pick(['alpha', 'beta', 'gamma'])
    return {
      intro: 'A fixture story.',
      parts: Array.from({ length: 5 }, (_, p) => typed({
        prompt: `Part ${p}.`, lecture: i + 1, explanation: 'Fixture.',
        view: { kind: 'template', template: '\\label{' + BOX + '}' }, blank: { mode: 'exact', key: `${w}-${p}` },
      })),
    }
  },
}))
const lessons: Lesson[] = gens.map((g, i) => ({ teach: ['## A', 'b', 'c', 'd', 'e'], samples: [{ workedSeed: `w${i}`, lqId: g.id }], verbatim: true }))
const bank: TestBank = { mc: [], blanks, lq: gens }
bank.examSlots = buildExamSlots(bank, lessons, [[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]])

function answer(paper: Paper, shortRight: number, lqRight: number): Answers {
  return {
    mc: [],
    blanks: paper.blanks!.map((q, i) => (i < shortRight ? q.blank.key : 'wrong')),
    lq: paper.lq.map((q) => q.parts.map((p, i) => (i < lqRight ? p.blank!.key : 'wrong'))),
  }
}

describe('typed banks: building papers', () => {
  it('the final test asks 2 short questions from every lecture and 3 long questions that cover every lecture', () => {
    for (let s = 0; s < 30; s++) {
      const paper = renderPaper(bank, selectPaper(bank, `t${s}`))
      expect(paper.mc).toEqual([])
      expect(paper.blanks).toHaveLength(testConfig.mcCount)
      for (let l = 1; l <= L; l++) expect(paper.blanks!.filter((q) => q.lecture === l)).toHaveLength(2)
      expect(paper.lq).toHaveLength(3)
      expect(new Set(paper.lq.flatMap((q) => q.parts.map((p) => p.lecture))).size).toBe(L)
    }
  })

  it('the same spec rebuilds the same paper', () => {
    const spec = selectPaper(bank, 'same')
    expect(renderPaper(bank, spec)).toEqual(renderPaper(bank, spec))
  })

  it('a paper item does not carry the section and keeps the question fields', () => {
    const p = renderPaper(bank, selectPaper(bank, 'x')).blanks![0]
    expect('section' in p && p.section !== undefined).toBe(false)
    expect(p.blank.key).toMatch(/^k\d+x\d$/)
  })

  it('a lecture quiz has 5 short questions of that lecture over both sections, unseen first, and one typed long question', () => {
    const first = selectLecturePaper(bank, lessons[2], 3, 'a')
    expect(first.mcIds).toHaveLength(lectureConfig.mcCount)
    expect(first.mcIds.every((id) => id.startsWith('fx-3-'))).toBe(true)
    expect(new Set(first.mcIds.map((id) => blanks.find((q) => q.id === id)!.section)).size).toBe(2)
    expect(first.lqIds).toEqual([quizLqId(bank, lessons[2])])
    const second = selectLecturePaper(bank, lessons[2], 3, 'b', new Set(first.mcIds))
    // round robin over the sections can repeat one question when the seen ones are split unevenly (as for MC banks)
    expect(second.mcIds.filter((id) => first.mcIds.includes(id)).length).toBeLessThanOrEqual(1)
  })

  it('an unknown short question id is an error', () => {
    expect(() => renderPaper(bank, { seed: 's', mcIds: ['nope'], lqIds: [] })).toThrow(/unknown short question/)
  })
})

describe('typed banks: marking', () => {
  const quiz = renderPaper(bank, selectLecturePaper(bank, lessons[0], 1, 'm'))
  const grade = (s: number, l: number) => localGrader.grade(quiz, answer(quiz, s, l), lectureRules)

  it('15/15 with everything right, and short answers count in mcScore', () => {
    const r = grade(5, 5)
    expect(r.total).toBeCloseTo(15, 9)
    expect(r.mcScore).toBe(5)
    expect(r.blanks).toHaveLength(5)
    expect(r.blanks!.every((b) => b.correct && b.mode === 'tokens')).toBe(true)
    expect(r.lq[0].every((p) => p.correct && p.expectedText !== undefined && p.mode === 'exact')).toBe(true)
  })
  it('the pass mark is 12 of 15', () => {
    expect(grade(2, 5).passed).toBe(true)
    expect(grade(1, 5).passed).toBe(false)
    expect(grade(5, 3).passed).toBe(false) // 3 of 5 parts = 6 marks: 5 + 6 = 11
    expect(grade(4, 4).passed).toBe(true) // 4 + 8 = 12
  })
  it('an attempt saved without typed answers grades as unanswered instead of crashing', () => {
    const r = localGrader.grade(quiz, { mc: [], lq: [] }, lectureRules)
    expect(r.total).toBe(0)
    expect(r.blanks!.every((b) => b.given === '')).toBe(true)
  })
  it('the final test: 50 marks, pass at 40', () => {
    const paper = renderPaper(bank, selectPaper(bank, 'final'))
    const all = localGrader.grade(paper, answer(paper, 20, 99), topicRules)
    expect(all.total).toBeCloseTo(50, 9)
    expect(all.passed).toBe(true)
  })
  it('a typed part is never accepted by numeric marking', () => {
    const r = localGrader.grade(quiz, { mc: [], blanks: [], lq: [quiz.lq[0].parts.map(() => 'NaN')] }, lectureRules)
    expect(r.lqScore).toBe(0)
  })
})

describe('MC banks are untouched', () => {
  it('a paper of an MC bank has no blanks field and grading adds no blanks field', () => {
    const mcBank: TestBank = {
      mc: Array.from({ length: 3 }, (_, i) => ({
        id: `m${i}`, lecture: 1, stem: 's', correct: ['a', 'b'], explanation: 'xxxxxxxxxxx',
        distractors: ['c', 'd', 'e', 'f', 'g'].map((t) => ({ text: t, misconception: 'because' })),
      })),
      lq: [],
    }
    const paper = renderPaper(mcBank, selectPaper(mcBank, 's'))
    expect('blanks' in paper).toBe(false)
    expect('blanks' in localGrader.grade(paper, { mc: paper.mc.map(() => 0), lq: [] })).toBe(false)
  })
})
