// @vitest-environment jsdom
import { cleanup, configure, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { careers, topics } from '../data'
import { ancestors, buildGraph } from '../lib/graph'
import type { Topic } from '../lib/types'
import { enabledPhases, examEnabled, needsCoding, needsWritten, contentReady } from './phases'
import { STATE_KEY } from './store'

// exam pages load their content with dynamic imports; give them time when the whole suite is running in parallel
configure({ asyncUtilTimeout: 15_000 })

const graph = buildGraph(topics)

describe('phase data', () => {
  it('phase 1 is exactly the three pilot topics, and only phase 1 is switched on', () => {
    expect(topics.filter((t) => t.examPhase === 1).map((t) => t.id).sort()).toEqual(['bay', 'inf', 'np'])
    expect(enabledPhases).toEqual([1])
  })

  it('phase 2 is exactly the rest of the QR track as the skill tree defines it (required + prerequisites + bonus)', () => {
    const qr = careers.find((c) => c.id === 'qr')!
    const track = new Set<string>([...qr.required, ...qr.bonus])
    qr.required.forEach((r) => ancestors(graph, r).forEach((a) => track.add(a)))
    const phase2 = topics.filter((t) => t.examPhase === 2).map((t) => t.id)
    expect(new Set(phase2)).toEqual(new Set([...track].filter((id) => !['bay', 'inf', 'np'].includes(id))))
    expect(phase2).toHaveLength(33)
    expect(topics.filter((t) => t.examPhase == null).every((t) => !track.has(t.id))).toBe(true)
  })

  it('switching phase 2 on needs only a config change: examEnabled follows the list it is given', () => {
    const calc = graph.byId.get('calc')!, bay = graph.byId.get('bay')!, dm = graph.byId.get('dm')!
    expect([examEnabled(bay, [1]), examEnabled(calc, [1]), examEnabled(dm, [1, 2])]).toEqual([true, false, false]) // dm is not on the QR track
    expect(examEnabled(calc, [1, 2])).toBe(true)
    expect(examEnabled(calc, [])).toBe(false)
  })

  it('a topic with weights 100/0 is written only: no coding needed', () => {
    const t = { ...graph.byId.get('bay')!, examWeights: { written: 1, coding: 0 } } as Topic
    expect([needsWritten(t), needsCoding(t)]).toEqual([true, false])
    expect(contentReady(t)).toBe(true) // bay has a written file; the coding file is not required
    const none = { ...t, id: 'nofiles' } as Topic
    expect(contentReady(none)).toBe(false)
  })
})

const seed = () => {
  window.localStorage.setItem('quantitative.progress.v1', JSON.stringify({
    version: 1, devMode: false,
    attempts: { bay: [{ spec: { seed: 's', mcIds: [], lqIds: [] }, date: new Date().toISOString(), mcScore: 20, lqScore: 30, total: 50, max: 50, passed: true, answers: { mc: [], lq: [] } }] },
  }))
  window.localStorage.setItem(STATE_KEY, JSON.stringify({
    version: 1, drafts: { written: {}, coding: {} },
    written: {
      bay: [
        { id: 'w1', startedAt: '2026-02-01T00:00:00Z', submittedAt: '2026-02-01T01:30:00Z', answers: {}, max: 20, marks: 18, percent: 90, grade: 'A+', marking: { questions: [] } },
        { id: 'w2', startedAt: '2026-03-01T00:00:00Z', submittedAt: '2026-03-01T01:30:00Z', answers: {}, max: 20, marks: 8, percent: 40, grade: 'D', marking: { questions: [] } },
        { id: 'w3', startedAt: '2026-04-01T00:00:00Z', submittedAt: '2026-04-01T01:30:00Z', answers: {}, max: 20 },
      ],
    },
    coding: { bay: [{ id: 'c1', startedAt: 'x', submittedAt: '2026-02-02T00:00:00Z', results: [], marks: 5, max: 10, percent: 50, grade: 'C-' }] },
  }))
}

beforeEach(() => { window.localStorage.clear(); window.location.hash = '#/' })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('history, best/latest and combined grade', () => {
  it('lists every attempt, marks the best one, and combines best written (90) with best coding (50) as 70/30', async () => {
    seed()
    window.location.hash = '#/topic/bay/exam'
    render(<App />)
    const region = await screen.findByRole('region', { name: 'Written exam' })
    const rows = within(region).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)
    expect(rows[0].textContent).toMatch(/best/)
    expect(rows[1].textContent).not.toMatch(/best/)
    expect(rows[2].textContent).toMatch(/needs marking/)
    const grades = screen.getByRole('region', { name: 'Grades' })
    expect(grades.textContent).toMatch(/Total:\s*A\s*\(78\.0%\)|Total:\s*B\+\s*\(78\.0%\)/) // 0.7*90 + 0.3*50 = 78 -> B+ (75..80)
    expect(grades.textContent).toMatch(/Written:\s*A\+/)
    expect(grades.textContent).toMatch(/Coding:\s*C-/)
  })

  it('the topic page and the skill tree show the grade once both parts are done', async () => {
    seed()
    window.location.hash = '#/topic/bay'
    render(<App />)
    const head = await screen.findByRole('heading', { name: /Bayesian/ })
    expect(head.textContent).toMatch(/B\+/)
    expect(head.textContent).not.toMatch(/Pass/)
    cleanup()
    window.location.hash = '#/'
    render(<App />)
    expect(await screen.findByRole('link', { name: /^Bayesian, passed.*big exam grade B\+/ })).toBeTruthy()
  })

  it('a passed topic with no big exam shows Pass', async () => {
    window.localStorage.setItem('quantitative.progress.v1', JSON.stringify({
      version: 1, devMode: false,
      attempts: { bay: [{ spec: { seed: 's', mcIds: [], lqIds: [] }, date: new Date().toISOString(), mcScore: 20, lqScore: 30, total: 50, max: 50, passed: true, answers: { mc: [], lq: [] } }] },
    }))
    window.location.hash = '#/topic/bay'
    render(<App />)
    expect((await screen.findByRole('heading', { name: /Bayesian/ })).textContent).toMatch(/Pass/)
  })
})

describe('export and import of all progress', () => {
  /** click Export and return the JSON text of the downloaded file */
  async function exportFile(): Promise<string> {
    let blob: Blob | null = null
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => { blob = b as Blob; return 'blob:x' })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    screen.getByRole('button', { name: 'Export progress' }).click()
    await waitFor(() => expect(blob).not.toBeNull())
    return await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsText(blob!) })
  }
  const upload = async (text: string) => {
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    const file = new File([text], 'p.json', { type: 'application/json' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  it('exports skill-tree progress and exam attempts in one file, without the API key, and imports them back', async () => {
    seed()
    window.localStorage.setItem('quantitative.settings.v1', JSON.stringify({ anthropicKey: 'sk-ant-secret', model: 'm' }))
    render(<App />)
    const text = await exportFile()
    const data = JSON.parse(text)
    expect(data.version).toBe(1)
    expect(data.attempts.bay).toHaveLength(1) // old skill-tree part unchanged
    expect(data.exams.written.bay).toHaveLength(3)
    expect(data.exams.coding.bay).toHaveLength(1)
    expect(text).not.toContain('sk-ant-secret')
    cleanup()

    window.localStorage.clear()
    render(<App />)
    await upload(text)
    await screen.findByText(/Imported progress and exam attempts/)
    const stored = JSON.parse(window.localStorage.getItem(STATE_KEY)!)
    expect(stored.written.bay.map((a: { id: string }) => a.id)).toEqual(['w1', 'w2', 'w3'])
    expect(stored.coding.bay[0].grade).toBe('C-')
  })

  it('refuses a file with a broken exam section and changes nothing', async () => {
    seed()
    const before = window.localStorage.getItem(STATE_KEY)
    const beforeProgress = window.localStorage.getItem('quantitative.progress.v1')
    render(<App />)
    await upload(JSON.stringify({ version: 1, devMode: true, attempts: {}, exams: { version: 1, written: { bay: 'nope' }, coding: {} } }))
    await screen.findByText(/Import failed: .*must be a list/)
    expect(window.localStorage.getItem(STATE_KEY)).toBe(before)
    expect(window.localStorage.getItem('quantitative.progress.v1')).toBe(beforeProgress)
  })

  it('an older file without exam data imports the skill-tree progress and leaves exam attempts alone', async () => {
    seed()
    const before = window.localStorage.getItem(STATE_KEY)
    render(<App />)
    await upload(JSON.stringify({ version: 1, devMode: false, attempts: {} }))
    await screen.findByText('Imported.')
    expect(window.localStorage.getItem(STATE_KEY)).toBe(before)
  })
})
