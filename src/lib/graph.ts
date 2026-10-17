import type { Career, Topic } from './types'

export const HOURS_PER_LECTURE = 3
/** a career is complete when its path is passed and this many of its bonus topics are too */
export const BONUS_NEEDED = 5

export type Status = 'passed' | 'open' | 'locked'

export interface Graph {
  topics: Topic[]
  byId: Map<string, Topic>
  dependents: Map<string, string[]>
  depth: Map<string, number>
}

export function buildGraph(topics: Topic[]): Graph {
  const byId = new Map(topics.map((t) => [t.id, t]))
  const dependents = new Map(topics.map((t) => [t.id, [] as string[]]))
  for (const t of topics)
    for (const p of t.prerequisites) {
      if (!byId.has(p)) throw new Error(`${t.id}: unknown prerequisite ${p}`)
      dependents.get(p)!.push(t.id)
    }
  const depth = new Map<string, number>()
  const visit = (id: string, stack: string[]): number => {
    if (stack.includes(id)) throw new Error(`prerequisite cycle: ${[...stack, id].join(' -> ')}`)
    if (!depth.has(id)) {
      const ps = byId.get(id)!.prerequisites
      depth.set(id, ps.length ? 1 + Math.max(...ps.map((p) => visit(p, [...stack, id]))) : 0)
    }
    return depth.get(id)!
  }
  topics.forEach((t) => visit(t.id, []))
  return { topics, byId, dependents, depth }
}

/** All ancestors (transitive prerequisites), not including the topic itself. */
export function ancestors(g: Graph, id: string): Set<string> {
  const out = new Set<string>()
  const go = (x: string) => g.byId.get(x)!.prerequisites.forEach((p) => { if (!out.has(p)) { out.add(p); go(p) } })
  go(id)
  return out
}

export function descendants(g: Graph, id: string): Set<string> {
  const out = new Set<string>()
  const go = (x: string) => g.dependents.get(x)!.forEach((d) => { if (!out.has(d)) { out.add(d); go(d) } })
  go(id)
  return out
}

/** Required topics plus every prerequisite of them. Bonus topics are not counted. */
export function careerClosure(g: Graph, c: Career): Set<string> {
  const s = new Set(c.required)
  c.required.forEach((r) => ancestors(g, r).forEach((a) => s.add(a)))
  return s
}

export function careerSummary(g: Graph, c: Career) {
  const ids = careerClosure(g, c)
  const lectures = [...ids].reduce((n, id) => n + g.byId.get(id)!.lectures.length, 0)
  return { topics: ids.size, lectures, hours: lectures * HOURS_PER_LECTURE, ids }
}

export interface CareerProgress {
  /** topics passed / needed, counting the required topics and all their prerequisites */
  path: { passed: number; total: number }
  required: { passed: number; total: number }
  bonus: { passed: number; total: number }
  /** hours of the path already passed, weighted by lectures; percent is 0-100 */
  hours: { passed: number; total: number }
  /** 0-100: path hours plus BONUS_NEEDED bonus topics (valued at the mean bonus topic's hours) */
  percent: number
  /** bonus topics passed (capped) / needed for completion */
  bonusNeeded: { passed: number; total: number }
  /** topics on the path whose test exists in the app */
  testable: number
}

export function careerProgress(
  g: Graph, c: Career, passed: ReadonlySet<string>, hasTest: (id: string) => boolean = () => true,
): CareerProgress {
  const ids = [...careerClosure(g, c)]
  const lect = (id: string) => g.byId.get(id)!.lectures.length * HOURS_PER_LECTURE
  const count = (list: readonly string[]) => ({ passed: list.filter((i) => passed.has(i)).length, total: list.length })
  const total = ids.reduce((n, id) => n + lect(id), 0)
  const done = ids.filter((i) => passed.has(i)).reduce((n, id) => n + lect(id), 0)
  const need = Math.min(BONUS_NEEDED, c.bonus.length)
  const meanBonus = c.bonus.length ? c.bonus.reduce((n, id) => n + lect(id), 0) / c.bonus.length : 0
  const bonusTotal = need * meanBonus
  const bonusDone = Math.min(bonusTotal, c.bonus.filter((i) => passed.has(i)).reduce((n, id) => n + lect(id), 0))
  return {
    path: count(ids), required: count(c.required), bonus: count(c.bonus),
    hours: { passed: done, total }, percent: total ? Math.round((100 * (done + bonusDone)) / (total + bonusTotal)) : 0,
    bonusNeeded: { passed: Math.min(need, count(c.bonus).passed), total: need },
    testable: ids.filter(hasTest).length,
  }
}

export function isUnlocked(g: Graph, id: string, passed: ReadonlySet<string>, dev: boolean): boolean {
  return dev || g.byId.get(id)!.prerequisites.every((p) => passed.has(p))
}

/** passed beats open beats locked. Dev mode opens every unpassed topic. */
export function statusOf(g: Graph, id: string, passed: ReadonlySet<string>, dev: boolean): Status {
  if (passed.has(id)) return 'passed'
  return isUnlocked(g, id, passed, dev) ? 'open' : 'locked'
}

// ---- layered layout: column = prerequisite depth, rows ordered by mean parent row ----

export interface Placed { col: number; row: number }

export function layout(g: Graph, domainOrder: string[]): Map<string, Placed> {
  const cols: Topic[][] = []
  g.topics.forEach((t) => (cols[g.depth.get(t.id)!] ??= []).push(t))
  const pos = new Map<string, Placed>()
  const dom = (t: Topic) => domainOrder.indexOf(t.domain)
  cols.forEach((col, ci) => {
    const key = (t: Topic) =>
      t.prerequisites.length ? t.prerequisites.reduce((s, p) => s + pos.get(p)!.row, 0) / t.prerequisites.length : 0
    const sorted = ci === 0
      ? [...col].sort((a, b) => dom(a) - dom(b))
      : [...col].sort((a, b) => key(a) - key(b) || dom(a) - dom(b))
    sorted.forEach((t, row) => pos.set(t.id, { col: ci, row }))
  })
  return pos
}
