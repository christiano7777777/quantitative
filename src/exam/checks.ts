// Structural checks on exam content that a JSON schema cannot express: marks add up, ids are unique, formulas render.
// Pure TypeScript, shared by `npm run validate-exams` and the tests.

import { examConfig } from './config.ts'
import { mathErrors } from './latex.ts'
import { paperOf, slotsOf, type Poolable } from './pool.ts'
import { FROM_REFERENCE } from './types.ts'
import type { CodingExam, CodingTest, WrittenExam } from './types.ts'

export interface Issue { level: 'error' | 'warning'; where: string; message: string }

const err = (where: string, message: string): Issue => ({ level: 'error', where, message })
const warn = (where: string, message: string): Issue => ({ level: 'warning', where, message })

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9
const onStep = (x: number) => close(Math.round(x / examConfig.markStep) * examConfig.markStep, x)
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

function dupes(ids: string[]): string[] {
  const seen = new Set<string>(), out = new Set<string>()
  for (const id of ids) (seen.has(id) ? out : seen).add(id)
  return [...out]
}

/** slots: all questions or none carry one, numbered 1..k without gaps, and alternatives of a slot have equal marks */
function checkPool(out: Issue[], at: (...p: string[]) => string, questions: Poolable[]) {
  const withSlot = questions.filter((q) => q.slot !== undefined).length
  if (withSlot !== 0 && withSlot !== questions.length) { out.push(err(at(), 'either every question has a "slot" or none does')); return }
  if (withSlot === 0) return
  const slots = [...new Set(questions.map((q) => q.slot!))].sort((a, b) => a - b)
  if (slots.some((v, i) => v !== i + 1)) out.push(err(at(), `slots must be numbered 1 to ${slots.length} without gaps (found ${slots.join(', ')})`))
  for (const alts of slotsOf(questions))
    if (alts.some((q) => !close(q.marks, alts[0].marks)))
      out.push(err(at(), `slot ${alts[0].slot}: alternatives must have equal marks (${alts.map((q) => `${q.id}=${q.marks}`).join(', ')}), so every paper has the same total`))
}

function checkMath(out: Issue[], where: string, text: string, preamble = '') {
  for (const e of mathErrors(text, preamble)) out.push(err(where, `formula does not render (line ${e.line} of the text): ${e.message}  [${e.source.slice(0, 60)}]`))
}

/** Marks arithmetic, unique ids, rendering of every formula. Run the JSON schema first; this assumes the shape is right. */
export function checkWritten(exam: WrittenExam, fileTopic: string): Issue[] {
  const out: Issue[] = []
  const at = (...p: string[]) => `${fileTopic}.written ${p.join('.')}`.trim()
  if (exam.topicId !== fileTopic) out.push(err(at(), `topicId "${exam.topicId}" does not match the file name prefix "${fileTopic}"`))
  if (exam.placeholder) out.push(warn(at(), 'placeholder file: replace it with real questions before real use'))
  if (exam.durationMinutes < 90 || exam.durationMinutes > 150) out.push(warn(at(), `durationMinutes is ${exam.durationMinutes}; the target is about 120`))
  for (const d of dupes(exam.questions.map((q) => q.id))) out.push(err(at(), `duplicate question id ${d}`))
  checkMath(out, at('instructions'), exam.instructions, exam.preamble)
  if (exam.preamble) checkMath(out, at('preamble'), exam.preamble + '\n\n$x$')

  let proofs = 0
  for (const q of exam.questions) {
    const qa = (...p: string[]) => at(q.id, ...p)
    for (const d of dupes(q.parts.map((p) => p.id))) out.push(err(qa(), `duplicate part id ${d}`))
    if (!onStep(q.marks)) out.push(err(qa(), `marks ${q.marks} is not a multiple of ${examConfig.markStep}`))
    const partSum = sum(q.parts.map((p) => p.marks))
    if (!close(partSum, q.marks)) out.push(err(qa(), `part marks add up to ${partSum}, but the question says ${q.marks}`))
    checkMath(out, qa('text'), q.text, exam.preamble)
    for (const p of q.parts) {
      const pa = (...s: string[]) => qa(p.id, ...s)
      if (p.type === 'proof') proofs++
      if (!onStep(p.marks)) out.push(err(pa(), `marks ${p.marks} is not a multiple of ${examConfig.markStep}`))
      const stepSum = sum(p.markingScheme.map((s) => s.marks))
      if (!close(stepSum, p.marks)) out.push(err(pa('markingScheme'), `scheme steps add up to ${stepSum}, but the part is worth ${p.marks}`))
      for (const [i, s] of p.markingScheme.entries()) {
        if (!onStep(s.marks)) out.push(err(pa('markingScheme', String(i + 1)), `marks ${s.marks} is not a multiple of ${examConfig.markStep}`))
        checkMath(out, pa('markingScheme', String(i + 1)), s.step, exam.preamble)
      }
      checkMath(out, pa('text'), p.text, exam.preamble)
      checkMath(out, pa('modelAnswer'), p.modelAnswer, exam.preamble)
    }
  }
  checkPool(out, at, exam.questions)
  const total = sum(paperOf(exam.questions).map((q) => q.marks))
  if (!close(total, exam.totalMarks)) out.push(err(at(), `the paper (the first question of each slot) adds up to ${total}, but totalMarks is ${exam.totalMarks}`))
  if (proofs === 0) out.push(warn(at(), 'no part has type "proof"; the written exam should include proofs'))
  return out
}

// ---- coding ----

function checkTestShape(out: Issue[], where: string, t: CodingTest) {
  const c = t.compare
  if (t.expected === FROM_REFERENCE) return // checked after --fill-expected
  if (c.type === 'quantiles' || c.type === 'summary') {
    const want = c.type === 'quantiles' ? c.probs.length : c.stats.length
    if (!Array.isArray(t.expected) || t.expected.length !== want || !t.expected.every((x) => typeof x === 'number' && Number.isFinite(x)))
      out.push(err(where, `${c.type} comparison needs "expected" to be a list of ${want} numbers`))
  }
  if (c.type === 'numeric') {
    const flat = JSON.stringify(t.expected)
    if (t.expected === null || /"/.test(flat)) out.push(err(where, 'numeric comparison needs "expected" to be a number or a (nested) list of numbers'))
  }
  if ((c.type === 'quantiles' || c.type === 'summary') && !(c.abs! > 0) && !(c.rel! > 0))
    out.push(err(where, 'a stochastic comparison needs a tolerance greater than 0'))
}

export const isStochastic = (t: CodingTest) => t.compare.type === 'quantiles' || t.compare.type === 'summary'

/** Everything about a coding file that does not need to run Python. */
export function checkCodingStatic(exam: CodingExam, fileTopic: string): Issue[] {
  const out: Issue[] = []
  const at = (...p: string[]) => `${fileTopic}.coding ${p.join('.')}`.trim()
  if (exam.topicId !== fileTopic) out.push(err(at(), `topicId "${exam.topicId}" does not match the file name prefix "${fileTopic}"`))
  if (exam.placeholder) out.push(warn(at(), 'placeholder file: replace it with real questions before real use'))
  for (const d of dupes(exam.questions.map((q) => q.id))) out.push(err(at(), `duplicate question id ${d}`))
  checkMath(out, at('instructions'), exam.instructions)
  checkPool(out, at, exam.questions)
  const total = sum(paperOf(exam.questions).map((q) => q.marks))
  if (!close(total, exam.totalMarks)) out.push(err(at(), `the paper (the first question of each slot) adds up to ${total}, but totalMarks is ${exam.totalMarks}`))

  for (const q of exam.questions) {
    const qa = (...p: string[]) => at(q.id, ...p)
    if (!onStep(q.marks)) out.push(err(qa(), `marks ${q.marks} is not a multiple of ${examConfig.markStep}`))
    checkMath(out, qa('text'), q.text)
    checkMath(out, qa('docs'), q.docs)
    const mains = q.functions.filter((f) => f.main)
    if (mains.length !== 1) out.push(err(qa('functions'), `exactly one function must have main: true (found ${mains.length})`))
    for (const d of dupes(q.functions.map((f) => f.name))) out.push(err(qa('functions'), `duplicate function ${d}`))
    if (q.skeleton.trim() === q.referenceSolution.trim()) out.push(err(qa('skeleton'), 'the skeleton is identical to the reference solution'))
    if (q.rngArg && !q.skeleton.includes(q.rngArg)) out.push(err(qa('skeleton'), `rngArg "${q.rngArg}" does not appear in the skeleton`))
    const ids = [...q.visibleTests, ...q.hiddenTests].map((t) => t.id)
    for (const d of dupes(ids)) out.push(err(qa(), `duplicate test id ${d}`))
    for (const t of q.visibleTests) if (!t.id.startsWith('v')) out.push(err(qa(t.id), 'visible test ids must start with v'))
    for (const t of q.hiddenTests) if (!t.id.startsWith('h')) out.push(err(qa(t.id), 'hidden test ids must start with h'))
    for (const t of [...q.visibleTests, ...q.hiddenTests]) checkTestShape(out, qa(t.id), t)
    if (q.visibleTests.length < 2) out.push(warn(qa(), 'fewer than 2 visible tests; the student needs a few to debug against'))
    if (q.hiddenTests.length < 2) out.push(warn(qa(), 'fewer than 2 hidden tests; one failure would cost half of the hidden share'))
    const seen = new Set(q.visibleTests.map((t) => JSON.stringify(t.input)))
    for (const t of q.hiddenTests) if (seen.has(JSON.stringify(t.input))) out.push(warn(qa(t.id), 'hidden test uses the same input as a visible test'))
  }
  return out
}
