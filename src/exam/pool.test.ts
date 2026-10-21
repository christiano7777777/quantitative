import { describe, expect, it } from 'vitest'
import { checkWritten } from './checks'
import { paperOf, selectPaper, slotsOf } from './pool'
import bay from './__fixtures__/bay.written.json'
import type { WrittenExam } from './types'

const q = (id: string, marks: number, slot?: number) => ({ id, marks, ...(slot === undefined ? {} : { slot }) })

describe('pool', () => {
  it('a question without a slot is its own slot, so old files are unchanged', () => {
    expect(paperOf([q('q1', 5), q('q2', 5)]).map((x) => x.id)).toEqual(['q1', 'q2'])
  })
  it('the paper is the first question of each slot, in order of first appearance', () => {
    const qs = [q('q1', 10, 1), q('q2', 10, 2), q('q3', 10, 1), q('q4', 10, 2)]
    expect(paperOf(qs).map((x) => x.id)).toEqual(['q1', 'q2'])
    expect(slotsOf(qs).map((a) => a.map((x) => x.id))).toEqual([['q1', 'q3'], ['q2', 'q4']])
    expect(selectPaper({ title: 't', questions: qs }).questions).toHaveLength(2)
  })
})

describe('pool checks', () => {
  const base = () => JSON.parse(JSON.stringify(bay)) as WrittenExam
  const errs = (e: WrittenExam) => checkWritten(e, 'bay').filter((i) => i.level === 'error').map((i) => i.message).join('\n')

  it('accepts alternatives: totalMarks counts only the first question of each slot', () => {
    const e = base(); const alt = JSON.parse(JSON.stringify(e.questions[0])); alt.id = 'q2'
    e.questions[0].slot = 1; alt.slot = 1; e.questions.push(alt)
    expect(errs(e)).toBe('')
  })
  it('rejects alternatives with different marks, mixed slot use and gaps in slot numbers', () => {
    const e = base(); const alt = JSON.parse(JSON.stringify(e.questions[0])); alt.id = 'q2'; alt.slot = 1; e.questions[0].slot = 1
    alt.marks = 25; e.questions.push(alt)
    expect(errs(e)).toMatch(/alternatives must have equal marks/)
    const f = base(); const alt2 = JSON.parse(JSON.stringify(f.questions[0])); alt2.id = 'q2'; f.questions[0].slot = 1; f.questions.push(alt2)
    expect(errs(f)).toMatch(/either every question has a "slot" or none does/)
    const g = base(); g.questions[0].slot = 3
    expect(errs(g)).toMatch(/numbered 1 to 1 without gaps/)
  })
})
