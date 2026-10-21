// Structural rules of a typed (blanks) bank, used by src/content/banks.test.ts and by fixture tests. Each check returns
// a list of problems ("<id>: <what is wrong>"); an empty list means the bank is fine. These cannot check that a key is
// the right answer to its prompt; that needs a human reader.
import katex from 'katex'
import { BLANK_MARK, canonical, gradeBlank } from './blank-grader'
import { withoutCode } from './rich-text'
import { findGenerator } from './test-builder'
import { makeRng } from './rng'
import type { Blank, BlankQuestion, BlankView, TestBank } from './types'

/** Lectures of a topic where `render` mode may be used (KaTeX cannot render tables, floats, citations, TikZ or beamer). */
export const RENDER_LECTURES: Record<string, number[]> = { latex: [2, 3, 7] }

/** At least this many short questions per lecture, so a retake of the 5-question quiz is mostly new (owner rule). */
export const MIN_BLANKS_PER_LECTURE = 10

const MODES = new Set(['render', 'tokens', 'set', 'exact'])
const CONTROL = /[\u0000-\u0009\u000b-\u001f\u007f]/ // a newline is fine; a tab is usually a lost backslash (\\textbf)
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const balanced = (s: string) => (withoutCode(s).match(/(?<!\\)\$/g) ?? []).length % 2 === 0

/** The `$..$` formulas of a prompt (outside code). */
const formulas = (s: string) => [...withoutCode(s).matchAll(/\$\$([^$]+)\$\$|\$([^$]+)\$/g)].map((m) => m[1] ?? m[2])

/** True if `text` contains `key` as a whole token (not inside a longer word or command). */
export function containsKey(text: string, key: string): boolean {
  const k = key.trim()
  if (k.length < 3) return false
  return new RegExp('(?<![A-Za-z0-9])' + escapeRe(k) + '(?![A-Za-z0-9])').test(text)
}

export interface BlankContext { id: string; lecture: number; prompt: string; renderLectures: number[] }

/** Rules shared by short questions and typed long-question parts. */
export function checkBlank(b: Blank, view: BlankView, ctx: BlankContext): string[] {
  const out: string[] = []
  const bad = (m: string) => out.push(`${ctx.id}: ${m}`)
  if (!MODES.has(b.mode)) { bad(`unknown mode ${b.mode}`); return out }
  if (b.mode === 'render' && !ctx.renderLectures.includes(ctx.lecture)) bad(`render mode is not allowed in lecture ${ctx.lecture}`)
  if (b.macros && b.mode !== 'render') bad('macros are only used in render mode')
  if (b.context !== undefined && b.context.split(BLANK_MARK).length !== 2) bad('a context needs exactly one box')

  const answers = [b.key, ...(b.accept ?? [])]
  for (const a of answers) {
    if (canonical(a, b.mode, b.macros, b.context) === null) bad(`cannot be read in ${b.mode} mode: ${a}`)
    else if (!gradeBlank(a, b).correct) bad(`a right answer is rejected (or equals a trap): ${a}`)
    if (b.mode === 'exact') {
      if (/\$|\\[([]/.test(a)) bad(`exact answers must not contain LaTeX maths: ${a}`)
      if (/\s/.test(a.trim()) && !b.multiWord) bad(`exact answer with a space needs multiWord (prefer one token): ${a}`)
    }
    if (b.mode === 'set' && /\\usepackage(\[[^\]]*\])?\{[^}]*,[^}]*\}/.test(a) && /hyperref|cleveref/.test(a))
      bad('set mode would accept hyperref/cleveref in any load order')
    if (CONTROL.test(a)) bad(`control character in ${JSON.stringify(a)}`)
  }
  for (const t of b.traps ?? []) {
    if (t.misconception.trim().length <= 5) bad(`trap without a misconception: ${t.text}`)
    if (CONTROL.test(t.text) || CONTROL.test(t.misconception)) bad(`control character in trap ${JSON.stringify(t.text)}`)
    const v = gradeBlank(t.text, b)
    if (v.correct || v.trap?.text !== t.text) bad(`trap is not rejected as itself: ${t.text}`)
  }

  // what is shown around the box
  const marks = (view.template ?? '').split(BLANK_MARK).length - 1
  if (view.kind === 'template' && marks !== 1) bad(`a template needs exactly one box, has ${marks}`)
  if (view.template !== undefined && view.kind !== 'template' && view.kind !== 'name') bad(`kind ${view.kind} has a template`)
  if (view.kind === 'name' && view.template !== undefined && marks !== 1) bad(`a template needs exactly one box, has ${marks}`)
  if (view.kind === 'picture') {
    if (!view.picture) bad('a picture question needs `picture`')
    else try { katex.renderToString(view.picture, { output: 'html', throwOnError: true, displayMode: true, macros: { ...(b.macros ?? {}) } }) } catch (e) { bad(`picture does not render: ${(e as Error).message}`) }
  }
  if (view.kind === 'fix') {
    if (!view.broken) bad('a fix question needs `broken`')
    else if (gradeBlank(view.broken, b).correct) bad('the broken snippet is already accepted as right')
  }
  for (const s of [view.template, view.broken, view.picture]) if (s !== undefined && CONTROL.test(s)) bad(`control character in ${JSON.stringify(s)}`)

  // nothing on the page may give the key away before submission
  for (const a of answers) {
    if (containsKey(ctx.prompt, a)) bad(`the prompt contains the answer ${a}`)
    if (view.template && containsKey(view.template.replace(BLANK_MARK, ' '), a) && a.trim().length >= 3) bad(`the template contains the answer ${a}`)
  }
  if (b.mode === 'render')
    for (const f of formulas(ctx.prompt))
      if (answers.some((a) => canonical(f, 'render', b.macros) === canonical(a, 'render', b.macros))) bad(`the prompt shows the answer as $${f}$`)
  return out
}

export function checkBlankQuestion(q: BlankQuestion, lectures: number, renderLectures: number[]): string[] {
  const out: string[] = []
  const bad = (m: string) => out.push(`${q.id}: ${m}`)
  if (!Number.isInteger(q.lecture) || q.lecture < 1 || q.lecture > lectures) bad(`lecture ${q.lecture} out of range`)
  if (!q.prompt.trim()) bad('empty prompt')
  if (q.explanation.trim().length <= 10) bad('explanation too short')
  for (const s of [q.prompt, q.explanation]) {
    if (CONTROL.test(s)) bad(`control character in ${JSON.stringify(s)}`)
    if (!balanced(s)) bad(`unbalanced $ in ${s}`)
  }
  out.push(...checkBlank(q.blank, q, { id: q.id, lecture: q.lecture, prompt: q.prompt, renderLectures }))
  return out
}

/** Every rule for a typed bank: its short questions and the typed parts of its long-question generators. */
export function checkBlankBank(topicId: string, bank: TestBank, lectures: number, minPerLecture = MIN_BLANKS_PER_LECTURE): string[] {
  const out: string[] = []
  const blanks = bank.blanks ?? []
  const renderLectures = RENDER_LECTURES[topicId] ?? []
  if (!bank.blanks) return [`${topicId}: not a typed bank`]
  if (bank.mc.length > 0) out.push(`${topicId}: a typed bank must have no MC questions (mixed banks are not supported)`)
  const ids = blanks.map((q) => q.id)
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dup.length) out.push(`${topicId}: duplicate ids ${[...new Set(dup)].join(', ')}`)
  for (let l = 1; l <= lectures; l++) {
    const n = blanks.filter((q) => q.lecture === l).length
    if (n < minPerLecture) out.push(`${topicId}: lecture ${l} has ${n} short questions, needs ${minPerLecture}`)
  }
  for (const q of blanks) out.push(...checkBlankQuestion(q, lectures, renderLectures))
  out.push(...checkTypedParts(topicId, bank, lectures))
  return out
}

/** The typed parts of every long-question generator, over a few seeds. */
export function checkTypedParts(topicId: string, bank: TestBank, lectures: number, seeds = 20): string[] {
  const out: string[] = []
  const renderLectures = RENDER_LECTURES[topicId] ?? []
  for (const g of [...bank.lq, ...(bank.lectureLq ?? [])]) {
    const gen = findGenerator(bank, g.id)!
    for (let s = 0; s < seeds; s++) {
      const inst = gen.generate(makeRng(`typed-check-${s}`))
      if (!balanced(inst.intro)) out.push(`${g.id}: unbalanced $ in the intro`)
      inst.parts.forEach((p, i) => {
        const id = `${g.id} part ${i} seed ${s}`
        if (p.lecture < 1 || p.lecture > lectures) out.push(`${id}: lecture ${p.lecture} out of range`)
        if (!balanced(p.prompt) || !balanced(p.explanation)) out.push(`${id}: unbalanced $`)
        if (!p.blank) return
        if (!Number.isNaN(p.answer)) out.push(`${id}: a typed part must have answer NaN`)
        if (!p.view) out.push(`${id}: a typed part needs a view`)
        else out.push(...checkBlank(p.blank, p.view, { id, lecture: p.lecture, prompt: inst.intro + ' ' + p.prompt, renderLectures }))
      })
    }
  }
  return [...new Set(out)]
}
