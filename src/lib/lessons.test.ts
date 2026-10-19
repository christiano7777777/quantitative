import { describe, expect, it } from 'vitest'
import { topics } from '../data'
import { lectureConfig, lecturePassMark, lectureTotal } from '../config/test.config'
import { banks } from './content'
import { lectureRules, localGrader } from './grader'
import {
  hasLessons, lectureKey, lecturePassed, lectureUnlocked, lessons, lessonsDone, selectLecturePaper, workedExample,
} from './lessons'
import { quizLqId } from './lq-composite'
import { createLocalProgress } from './progress'
import { makeRng } from './rng'
import { findGenerator, renderPaper } from './test-builder'
import type { Answers, Paper } from './types'

const balanced = (s: string) => (s.match(/(?<!\\)\$/g) ?? []).length % 2 === 0

describe('lecture quiz rules', () => {
  it('is 5 MC + 1 long question = 15 marks, pass at 12', () => {
    expect(lectureConfig.mcCount).toBe(5)
    expect(lectureConfig.lqCount).toBe(1)
    expect(lectureTotal()).toBe(15)
    expect(lecturePassMark()).toBeCloseTo(12, 9)
  })
})

describe.each(Object.keys(lessons))('lessons for %s', (id) => {
  const topic = topics.find((t) => t.id === id)!
  const bank = banks[id]
  const ls = lessons[id]

  it('has one lesson per lecture of the topic, and the topic has a test', () => {
    expect(topic).toBeDefined()
    expect(bank).toBeDefined()
    expect(ls.length).toBe(topic.lectures.length)
  })

  it('has between 8 and 12 lectures (owner rule)', () => {
    expect(ls.length).toBeGreaterThanOrEqual(8)
    expect(ls.length).toBeLessThanOrEqual(12)
  })

  it.each(ls.map((l, i) => [i + 1, l] as const))('lecture %i: well-formed teaching text and worked sample', (n, lesson) => {
    expect(lesson.teach.length).toBeGreaterThanOrEqual(5)
    for (const p of lesson.teach) {
      expect(p.trim().length).toBeGreaterThan(0)
      expect(balanced(p), p).toBe(true)
      expect(/[\u0000-\u0008\u000b-\u001f]/.test(p), p).toBe(false)
    }
    expect(lesson.samples.length).toBeGreaterThanOrEqual(1)
    expect(lesson.samples.length).toBeLessThanOrEqual(3)
    for (const sample of lesson.samples) {
      const g = findGenerator(bank, sample.lqId)
      expect(g, `generator ${sample.lqId}`).toBeDefined()
      const full = [...bank.lq, ...(bank.lectureLq ?? [])].find((x) => x.id === sample.lqId.split('#')[0])!
      const keep = sample.lqId.includes('#') ? sample.lqId.split('#')[1].split(',').map(Number) : null
      for (let s = 0; s < 30; s++) {
        const rng = makeRng(`check-${s}`)
        const inst = g!.generate(rng.fork('x'))
        const all = full.generate(rng.fork('x'))
        expect(inst.parts.length).toBe(keep ? keep.length : all.parts.length)
        inst.parts.forEach((p, i) => {
          // a kept part is the same part, with the same numbers, as in the full question
          expect(p).toEqual(all.parts[keep ? keep[i] : i])
          expect(p.lecture, `part ${i} of ${sample.lqId} is tagged lecture ${p.lecture}`).toBe(n)
          expect(Number.isFinite(p.answer)).toBe(true)
        })
      }
      const w = workedExample(bank, sample)
      expect(w.parts.length).toBeGreaterThanOrEqual(2)
      w.parts.forEach((p) => expect(p.explanation.trim().length).toBeGreaterThan(0))
    }
  })

  it.each(ls.map((l, i) => [i + 1, l] as const))('lecture %i: the quiz covers every section of the lecture', (n, lesson) => {
    const poolSections = new Set(bank.mc.filter((q) => q.lecture === n).map((q) => q.section ?? 0))
    for (let k = 0; k < 40; k++) {
      const spec = selectLecturePaper(bank, lesson, n, `seed-${n}-${k}`)
      expect(spec.mcIds.length).toBe(5)
      expect(new Set(spec.mcIds).size).toBe(5)
      for (const mid of spec.mcIds) expect(bank.mc.find((q) => q.id === mid)!.lecture).toBe(n)
      // the 5 MC are spread over the sections of the lecture
      const sections = new Set(spec.mcIds.map((mid) => bank.mc.find((q) => q.id === mid)!.section ?? 0))
      expect(sections.size, `lecture ${n} MC sections`).toBe(Math.min(5, poolSections.size))
      expect(spec.lqIds).toEqual([quizLqId(bank, lesson)])
      const paper = renderPaper(bank, spec)
      expect(paper.mc.length).toBe(5)
      expect(paper.lq.length).toBe(1)
      // one question with parts from every sample (section) of the lecture, all tagged with this lecture
      const q = paper.lq[0]
      expect(q.parts.length).toBeGreaterThanOrEqual(3)
      expect(q.parts.length).toBeLessThanOrEqual(9)
      q.parts.forEach((p) => expect(p.lecture).toBe(n))
      if (lesson.samples.length > 1) {
        for (let i = 1; i <= lesson.samples.length; i++) expect(q.parts.some((p) => p.prompt.startsWith(`[Setting ${i}]`)), `setting ${i}`).toBe(true)
      }
    }
  })

  it.each(ls.map((l, i) => [i + 1, l] as const))('lecture %i: a single-sample lesson has no "## Part" headings', (n, lesson) => {
    // one lesson = one story: a migrated lecture is a single sample with plain "## " sub-headings,
    // while a merged lecture (several samples) legitimately keeps its "## Part k" headings until migrated
    if (lesson.samples.length !== 1) return
    for (const p of lesson.teach)
      expect(p.startsWith('## Part'), `lecture ${n}: ${p.slice(0, 80)}`).toBe(false)
  })

  it('retakes prefer unseen MC questions when the lecture has enough of them', () => {
    const n = 1
    const first = selectLecturePaper(bank, ls[0], n, 'a')
    const have = bank.mc.filter((q) => q.lecture === n).length
    const second = selectLecturePaper(bank, ls[0], n, 'b', new Set(first.mcIds))
    const fresh = second.mcIds.filter((x) => !first.mcIds.includes(x)).length
    expect(fresh).toBe(Math.min(5, have - 5))
  })
})

function answeredPaper(paper: Paper, mcRight: number, lqRight: number): Answers {
  return {
    mc: paper.mc.map((q, i) => (i < mcRight ? q.options.findIndex((o) => o.correct) : q.options.findIndex((o) => !o.correct))),
    lq: paper.lq.map((q) => q.parts.map((p, i) => (i < lqRight ? String(p.answer) : '9999999'))),
  }
}

describe('lecture marking: 12 of 15 passes', () => {
  const id = Object.keys(lessons)[0]
  const bank = banks[id]
  const paper = renderPaper(bank, selectLecturePaper(bank, lessons[id][0], 1, 'mark'))
  const nParts = paper.lq[0].parts.length
  const grade = (mc: number, lq: number) => localGrader.grade(paper, answeredPaper(paper, mc, lq), lectureRules)

  it('full marks is 15/15', () => {
    const r = grade(5, nParts)
    expect(r.max).toBe(15)
    expect(r.total).toBeCloseTo(15, 9)
    expect(r.passed).toBe(true)
  })
  it('5 MC and no LQ is 5/15: fail', () => expect(grade(5, 0).passed).toBe(false))
  it('no MC but the whole LQ is 10/15: fail', () => expect(grade(0, nParts).passed).toBe(false))
  it('4 MC + whole LQ is 14/15: pass', () => expect(grade(4, nParts).passed).toBe(true))
  it('3 MC + whole LQ is 13/15: pass', () => expect(grade(3, nParts).passed).toBe(true))
  it('2 MC + whole LQ is 12/15: pass (the boundary)', () => {
    const r = grade(2, nParts)
    expect(r.total).toBeCloseTo(12, 9)
    expect(r.passed).toBe(true)
  })
  it('1 MC + whole LQ is 11/15: fail', () => expect(grade(1, nParts).passed).toBe(false))
})

describe('unlocking', () => {
  const mem = () => {
    const data: Record<string, string> = {}
    return { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v } }
  }
  const id = Object.keys(lessons)[0]
  const bank = banks[id]

  function pass(store: ReturnType<typeof createLocalProgress>, n: number) {
    const paper = renderPaper(bank, selectLecturePaper(bank, lessons[id][n - 1], n, `p${n}`))
    const answers = answeredPaper(paper, 5, paper.lq[0].parts.length)
    store.record(lectureKey(id, n), paper.spec, answers, localGrader.grade(paper, answers, lectureRules))
  }

  it('lecture 1 is open, lecture n needs n-1, and the topic test needs every lecture', () => {
    const store = createLocalProgress(mem())
    expect(hasLessons(id)).toBe(true)
    expect(lectureUnlocked(store, id, 1, false)).toBe(true)
    expect(lectureUnlocked(store, id, 2, false)).toBe(false)
    expect(lessonsDone(store, id, false)).toBe(false)
    const total = lessons[id].length
    for (let n = 1; n <= total; n++) {
      expect(lectureUnlocked(store, id, n, false)).toBe(true)
      expect(lessonsDone(store, id, false)).toBe(false)
      pass(store, n)
      expect(lecturePassed(store, id, n)).toBe(true)
    }
    expect(lessonsDone(store, id, false)).toBe(true)
  })

  it('a failed retake never un-passes a lecture; lecture quizzes are not topics', () => {
    const store = createLocalProgress(mem())
    pass(store, 1)
    const paper = renderPaper(bank, selectLecturePaper(bank, lessons[id][0], 1, 'bad'))
    const wrong = answeredPaper(paper, 0, 0)
    store.record(lectureKey(id, 1), paper.spec, wrong, localGrader.grade(paper, wrong, lectureRules))
    expect(lecturePassed(store, id, 1)).toBe(true)
    expect(store.passedIds().has(id)).toBe(false)
    expect([...store.passedIds()].some((k) => k.includes('#'))).toBe(false)
  })

  it('dev mode opens every lecture and the test; topics without lessons have no gate', () => {
    const store = createLocalProgress(mem())
    expect(lectureUnlocked(store, id, 5, true)).toBe(true)
    expect(lessonsDone(store, id, true)).toBe(true)
    expect(hasLessons('calc')).toBe(false)
    expect(lessonsDone(store, 'calc', false)).toBe(true)
  })
})

describe('lecture structure revision', () => {
  it('keys of a restructured topic differ from the old ones, so old saved quizzes are ignored', () => {
    expect(lectureKey('np', 3)).not.toBe('np#L3')
    expect(lectureKey('np', 3)).toContain('#')
    expect(lectureKey('calc', 3)).toBe('calc#L3') // a topic whose structure was never revised
    const store = createLocalProgress({ getItem: () => JSON.stringify({ version: 1, devMode: false, attempts: { 'np#L1': [{ spec: { seed: 's', mcIds: [], lqIds: [] }, date: 'd', mcScore: 5, lqScore: 10, total: 15, max: 15, passed: true, answers: { mc: [], lq: [] } }] } }), setItem: () => {} })
    expect(store.isPassed('np#L1')).toBe(true) // still stored
    expect(lecturePassed(store, 'np', 1)).toBe(false) // but not counted for the new lecture 1
  })
})
