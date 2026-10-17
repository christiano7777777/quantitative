import { testConfig } from '../config/test.config'
import { makeRng } from './rng'
import type { Paper, PaperMC, PaperSpec, TestBank } from './types'

/**
 * Choose which questions an attempt contains.
 * MC: a strict quota per lecture. With `want` questions over L lectures every lecture gets floor(want/L), and
 *   `want mod L` randomly chosen lectures get one more (20 over 11 lectures: every lecture has 1 or 2).
 *   Within a lecture, questions the student has not seen are preferred. Shortfalls (a lecture with too few
 *   questions) are topped up from the rest of the bank, unseen first.
 * LQ: one generator from each blueprint slot (bank.lqSlots), or uniformly random if the bank has no slots.
 */
export function selectPaper(bank: TestBank, seed: string, seenMcIds: ReadonlySet<string> = new Set()): PaperSpec {
  const rng = makeRng(seed).fork('select')
  const want = Math.min(testConfig.mcCount, bank.mc.length)

  const byLecture = new Map<number, typeof bank.mc>()
  for (const q of bank.mc) byLecture.set(q.lecture, [...(byLecture.get(q.lecture) ?? []), q])

  const unseenFirst = <T extends { id: string }>(xs: T[]) => {
    const sh = rng.shuffle(xs)
    return [...sh.filter((q) => !seenMcIds.has(q.id)), ...sh.filter((q) => seenMcIds.has(q.id))]
  }

  const lectures = rng.shuffle([...byLecture.keys()]) // the order decides who gets the extra questions
  const base = Math.floor(want / lectures.length), extra = want % lectures.length
  const chosen: string[] = []
  lectures.forEach((lec, i) => {
    const quota = base + (i < extra ? 1 : 0)
    for (const q of unseenFirst(byLecture.get(lec)!).slice(0, quota)) chosen.push(q.id)
  })
  for (const q of unseenFirst(bank.mc.filter((q) => !chosen.includes(q.id)))) {
    if (chosen.length >= want) break
    chosen.push(q.id)
  }

  const lqIds = bank.lqSlots
    ? bank.lqSlots.map((slot) => rng.pick(slot))
    : rng.sample(bank.lq, Math.min(testConfig.lqCount, bank.lq.length)).map((g) => g.id)
  return { seed, mcIds: rng.shuffle(chosen), lqIds }
}

/** Deterministic: the same spec always rebuilds the same paper (options, order, LQ numbers). */
export function renderPaper(bank: TestBank, spec: PaperSpec): Paper {
  const root = makeRng(spec.seed)
  const mc: PaperMC[] = spec.mcIds.map((id) => {
    const q = bank.mc.find((x) => x.id === id)
    if (!q) throw new Error(`unknown MC question ${id}`)
    const r = root.fork(`mc/${id}`)
    const options = r.shuffle([
      { text: r.pick(q.correct), correct: true },
      ...r.sample(q.distractors, 3).map((d) => ({ text: d.text, correct: false, misconception: d.misconception })),
    ])
    return { id, lecture: q.lecture, stem: q.stem, options, explanation: q.explanation }
  })
  const lq = spec.lqIds.map((id) => {
    const g = bank.lq.find((x) => x.id === id)
    if (!g) throw new Error(`unknown LQ generator ${id}`)
    const inst = g.generate(root.fork(`lq/${id}`))
    return { id, intro: inst.intro, parts: inst.parts }
  })
  return { spec, mc, lq }
}

export function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 2 ** 32).toString(36)}`
}
