import { testConfig } from '../config/test.config'
import { makeRng } from './rng'
import type { LQGenerator, Paper, PaperMC, PaperSpec, TestBank } from './types'

/**
 * Choose which questions an attempt contains.
 * MC: a strict quota per lecture. With `want` questions over L lectures every lecture gets floor(want/L), and
 *   `want mod L` randomly chosen lectures get one more (20 over 11 lectures: every lecture has 1 or 2).
 *   Within a lecture, the questions are spread over the lecture's sections and unseen ones are preferred. Shortfalls (a lecture with too few
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
    for (const q of pickStratified(byLecture.get(lec)!, quota, seenMcIds, rng)) chosen.push(q.id)
  })
  for (const q of unseenFirst(bank.mc.filter((q) => !chosen.includes(q.id)))) {
    if (chosen.length >= want) break
    chosen.push(q.id)
  }

  const slots = bank.examSlots ?? bank.lqSlots
  const lqIds = slots
    ? slots.map((slot) => rng.pick(slot))
    : rng.sample(bank.lq, Math.min(testConfig.lqCount, bank.lq.length)).map((g) => g.id)
  return { seed, mcIds: rng.shuffle(chosen), lqIds }
}

/**
 * Look up a long-question generator. An id of the form `base#0,1,3` means "generator `base`, keeping only parts
 * 0, 1 and 3" (0-based): the numbers are those of the full question, so a lecture quiz can use just the parts
 * that belong to its lecture. Parts of a generator must therefore not depend on each other's printed answers.
 */
export function findGenerator(bank: Pick<TestBank, 'lq' | 'lectureLq'>, id: string): LQGenerator | undefined {
  if (id.includes('+')) return findComposite(bank, id)
  const [base, sel] = id.split('#')
  const g = [...bank.lq, ...(bank.lectureLq ?? [])].find((x) => x.id === base)
  if (!g || sel === undefined) return g
  const keep = sel.split(',').map(Number)
  return {
    id,
    generate: (rng) => {
      const inst = g.generate(rng)
      return { ...inst, parts: keep.map((i) => inst.parts[i]) }
    },
  }
}

/**
 * A composite id `a#0,1+b#2,3` joins several (sliced) generators into one long question: one setting per piece, with every
 * part prompt labelled by its setting. Each piece draws its numbers from its own fork of the rng. This is how a lecture quiz
 * or a final-test question covers more than one section of the course notes.
 */
function findComposite(bank: Pick<TestBank, 'lq' | 'lectureLq'>, id: string): LQGenerator | undefined {
  const gens = id.split('+').map((piece) => findGenerator(bank, piece))
  if (gens.some((g) => !g)) return undefined
  return {
    id,
    generate: (rng) => {
      const insts = gens.map((g, k) => g!.generate(rng.fork(`piece${k}`)))
      return {
        intro: 'This question has ' + insts.length + ' settings. ' + insts.map((x, k) => 'Setting ' + (k + 1) + '. ' + x.intro).join(' '),
        parts: insts.flatMap((x, k) => x.parts.map((p) => ({ ...p, prompt: '[Setting ' + (k + 1) + '] ' + p.prompt }))),
      }
    },
  }
}

/**
 * Choose `k` questions from `pool` spread over the question `section`s (round robin over the sections in a random order,
 * unseen questions first within each section). Questions without a section form one section.
 */
export function pickStratified<T extends { id: string; section?: number }>(
  pool: T[], k: number, seen: ReadonlySet<string>, rng: ReturnType<typeof makeRng>,
): T[] {
  const bySection = new Map<number, T[]>()
  for (const q of pool) bySection.set(q.section ?? 0, [...(bySection.get(q.section ?? 0) ?? []), q])
  const lists = rng.shuffle([...bySection.keys()]).map((s) => {
    const sh = rng.shuffle(bySection.get(s)!)
    return [...sh.filter((q) => !seen.has(q.id)), ...sh.filter((q) => seen.has(q.id))]
  })
  const out: T[] = []
  for (let round = 0; out.length < k && lists.some((l) => l.length > round); round++)
    for (const l of lists) if (out.length < k && l.length > round) out.push(l[round])
  return out
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
    const g = findGenerator(bank, id)
    if (!g) throw new Error(`unknown LQ generator ${id}`)
    const inst = g.generate(root.fork(`lq/${id}`))
    return { id, intro: inst.intro, parts: inst.parts }
  })
  return { spec, mc, lq }
}

export function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 2 ** 32).toString(36)}`
}
