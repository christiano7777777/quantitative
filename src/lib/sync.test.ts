import { afterEach, describe, expect, it, vi } from 'vitest'
import { forUpload, GIST_FILE, mergeSnapshots, syncWithGist } from './sync'

const att = (date: string, seed: string, total = 40) => ({ spec: { seed, mcIds: [], lqIds: [] }, date, total, max: 50, passed: total >= 40 })
const ex = (id: string, submittedAt: string, extra: object = {}) => ({ id, submittedAt, startedAt: submittedAt, max: 100, ...extra })
const snap = (attempts: object, exams?: object) => ({ version: 1, devMode: false, attempts, ...(exams ? { exams } : {}) })
const exState = (written: object, coding: object = {}, drafts: object = { written: {}, coding: {} }) => ({ version: 1, written, coding, drafts })

describe('mergeSnapshots', () => {
  it('keeps attempts from both sides and drops exact duplicates', () => {
    const a = snap({ bay: [att('2026-10-01', 's1')], calc: [att('2026-10-02', 'c1')] })
    const b = snap({ bay: [att('2026-10-01', 's1'), att('2026-10-05', 's2')], inf: [att('2026-10-03', 'i1')] })
    const m = mergeSnapshots(a, b) as { attempts: Record<string, { date: string }[]> }
    expect(m.attempts.bay.map((x) => x.date)).toEqual(['2026-10-01', '2026-10-05'])
    expect(Object.keys(m.attempts).sort()).toEqual(['bay', 'calc', 'inf'])
  })

  it('is symmetric in content and idempotent', () => {
    const a = snap({ bay: [att('2026-10-01', 's1')] }, exState({ bay: [ex('w1', '2026-10-01T00:00')] }))
    const b = snap({ bay: [att('2026-10-02', 's2')] }, exState({ bay: [ex('w2', '2026-10-02T00:00')] }))
    const ab = mergeSnapshots(a, b)
    const ba = mergeSnapshots(b, a)
    expect(JSON.stringify((ab.attempts as object))).toBe(JSON.stringify(ba.attempts))
    expect(JSON.stringify((ab.exams as { written: object }).written)).toBe(JSON.stringify((ba.exams as { written: object }).written))
    expect(mergeSnapshots(ab, b)).toEqual(ab)
  })

  it('keeps the marked copy of the same exam attempt', () => {
    const unmarked = ex('w1', '2026-10-01T00:00')
    const marked = ex('w1', '2026-10-01T00:00', { marks: 70, grade: 'B', markedAt: '2026-10-02T00:00' })
    for (const [x, y] of [[unmarked, marked], [marked, unmarked]]) {
      const m = mergeSnapshots(snap({}, exState({ bay: [x] })), snap({}, exState({ bay: [y] })))
      expect((m.exams as { written: { bay: { marks?: number }[] } }).written.bay).toEqual([marked])
    }
  })

  it('uses only the local devMode and drafts', () => {
    const local = { ...snap({}, exState({}, {}, { written: { bay: { updatedAt: 'x' } }, coding: {} })), devMode: true }
    const remote = { ...snap({}, exState({}, {}, { written: { inf: { updatedAt: 'y' } }, coding: {} })), devMode: false }
    const m = mergeSnapshots(local, remote)
    expect(m.devMode).toBe(true)
    expect((m.exams as { drafts: { written: object } }).drafts.written).toEqual({ bay: { updatedAt: 'x' } })
  })

  it('works when the remote copy is empty or has no exam data', () => {
    const written = { bay: [ex('w1', '2026-10-01T00:00')] }
    const local = snap({ bay: [att('2026-10-01', 's1')] }, exState(written))
    expect(mergeSnapshots(local, {}).attempts).toEqual(local.attempts)
    expect((mergeSnapshots(local, snap({})).exams as { written: object }).written).toEqual(written)
    expect(mergeSnapshots(snap({}), snap({})).exams).toBeUndefined()
  })

  it('ignores malformed entries instead of throwing', () => {
    const m = mergeSnapshots(snap({ bay: [att('2026-10-01', 's1')] }), { attempts: { bay: [null, 3, 'x'], inf: 'oops' } })
    expect((m.attempts as { bay: unknown[] }).bay).toHaveLength(1)
  })
})

describe('forUpload', () => {
  it('removes drafts and devMode before anything leaves the browser', () => {
    const up = forUpload(snap({}, exState({}, {}, { written: { bay: { answers: { a: 'secret draft' } } }, coding: {} }))) as { devMode?: boolean; exams: { drafts: object } }
    expect(up.devMode).toBeUndefined()
    expect(up.exams.drafts).toEqual({ written: {}, coding: {} })
  })
})

describe('syncWithGist', () => {
  afterEach(() => vi.unstubAllGlobals())

  /** a tiny in-memory GitHub: records every request */
  function fakeGitHub(initial: Record<string, string> | null, status = 200) {
    const calls: { method: string; url: string; body?: string; auth?: string }[] = []
    let files = initial
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      calls.push({ method, url, body: init?.body as string | undefined, auth: (init?.headers as Record<string, string>)?.Authorization })
      const reply = (data: unknown, st = status) => ({ ok: st < 400, status: st, json: async () => data, text: async () => '' }) as Response
      if (status >= 400) return reply({})
      if (method === 'POST') { files = { [GIST_FILE]: JSON.parse(init!.body as string).files[GIST_FILE].content }; return reply({ id: 'new1', files: {} }) }
      if (method === 'PATCH') { files = { [GIST_FILE]: JSON.parse(init!.body as string).files[GIST_FILE].content }; return reply({ id: 'g1', files: {} }) }
      if (url.includes('/gists?')) return reply(files ? [{ id: 'g1', files: { [GIST_FILE]: { content: files[GIST_FILE] } } }] : [])
      return reply({ id: 'g1', files: { [GIST_FILE]: { content: files?.[GIST_FILE] } } })
    })
    return { calls, stored: () => (files ? JSON.parse(files[GIST_FILE]) : null) }
  }

  it('creates a private gist on first use', async () => {
    const gh = fakeGitHub(null)
    const local = snap({ bay: [att('2026-10-01', 's1')] })
    const r = await syncWithGist('tok', '', local)
    expect(r.created).toBe(true)
    expect(r.gistId).toBe('new1')
    const post = gh.calls.find((c) => c.method === 'POST')!
    expect(JSON.parse(post.body!).public).toBe(false)
    expect(post.auth).toBe('Bearer tok')
    expect(gh.stored().attempts.bay).toHaveLength(1)
  })

  it('merges the remote copy with the local one and writes the union back', async () => {
    const remote = snap({ inf: [att('2026-10-03', 'i1')] })
    const gh = fakeGitHub({ [GIST_FILE]: JSON.stringify(remote) })
    const r = await syncWithGist('tok', 'g1', snap({ bay: [att('2026-10-01', 's1')] }))
    expect(Object.keys(r.merged.attempts as object).sort()).toEqual(['bay', 'inf'])
    expect(Object.keys(gh.stored().attempts).sort()).toEqual(['bay', 'inf'])
    expect(gh.calls.map((c) => c.method)).toEqual(['GET', 'PATCH'])
  })

  it('finds an existing gist by file name when no id is remembered', async () => {
    const gh = fakeGitHub({ [GIST_FILE]: JSON.stringify(snap({ inf: [att('2026-10-03', 'i1')] })) })
    const r = await syncWithGist('tok', '', snap({}))
    expect(r.gistId).toBe('g1')
    expect(gh.calls[0].url).toContain('/gists?')
  })

  it('reports a bad token and changes nothing', async () => {
    fakeGitHub(null, 401)
    await expect(syncWithGist('bad', '', snap({}))).rejects.toThrow(/token/)
  })

  it('refuses to overwrite a gist whose file is not valid JSON', async () => {
    const gh = fakeGitHub({ [GIST_FILE]: '{broken' })
    await expect(syncWithGist('tok', 'g1', snap({}))).rejects.toThrow(/not valid JSON/)
    expect(gh.calls.some((c) => c.method === 'PATCH')).toBe(false)
  })
})
