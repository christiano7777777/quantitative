// @vitest-environment jsdom
// End-to-end flow through the real pages (jsdom, not a real browser). Independent of the question content:
// it never needs the right answers, so it keeps working when the SP bank is replaced.
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { createLocalProgress } from './lib/progress'
import type { GradeResult } from './lib/types'

const pass = { mcScore: 20, lqScore: 30, total: 50, max: 50, passed: true } as GradeResult
const seedPassed = (...ids: string[]) => {
  const store = createLocalProgress(window.localStorage)
  for (const id of ids) store.record(id, { seed: 's', mcIds: [], lqIds: [] }, { mc: [], lq: [] }, pass)
}
const nodeLabel = (name: RegExp) => screen.getByRole('link', { name })

beforeEach(() => {
  window.localStorage.clear()
  window.location.hash = '#/'
})
afterEach(cleanup)

describe('skill tree', () => {
  it('shows all 72 topics with locked / open states', () => {
    render(<App />)
    const graph = screen.getByRole('img', { name: /prerequisite graph/i })
    expect(within(graph).getAllByRole('link')).toHaveLength(72)
    expect(nodeLabel(/^Calculus, open/)).toBeTruthy()
    expect(nodeLabel(/^Stochastic Processes, locked/)).toBeTruthy()
  })

  it('career dropdown shows effective topic count and hours', async () => {
    render(<App />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'Quant Researcher')
    expect(screen.getByText(/topics needed/).textContent).toMatch(/21.*topics needed.*672.*h/)
  })

  it('shows a progress bar for every career, which moves when topics are passed', () => {
    seedPassed('calc')
    render(<App />)
    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(8)
    const qr = screen.getByRole('progressbar', { name: /Quant Researcher progress/ })
    expect(Number(qr.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
    const swe = screen.getByRole('progressbar', { name: /Software Engineer progress/ })
    expect(swe.getAttribute('aria-valuenow')).toBe('0') // calculus is not on the software engineer path
  })

  it('passing prerequisites opens Stochastic Processes without dev mode; passing it marks it passed', () => {
    seedPassed('calc', 'mvc', 'p1', 'p2')
    render(<App />)
    expect(nodeLabel(/^Stochastic Processes, open/)).toBeTruthy()
    cleanup()
    seedPassed('sp')
    render(<App />)
    expect(nodeLabel(/^Stochastic Processes, passed/)).toBeTruthy()
  })
})

describe('topic and test flow', () => {
  it('locked topic has no test button; dev mode unlocks it', async () => {
    window.location.hash = '#/topic/sp'
    render(<App />)
    expect(screen.getByText(/Locked\. Pass these first/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /take the test/i })).toBeNull()
    await userEvent.click(screen.getByLabelText(/dev mode/i))
    expect(screen.getByRole('link', { name: /take the test/i })).toBeTruthy()
  })

  it('topic page lists all 11 lectures as the read-only coverage list', () => {
    window.location.hash = '#/topic/sp'
    render(<App />)
    expect(document.querySelectorAll('.outline > li')).toHaveLength(11)
  })

  it('a topic with no test says "coming soon" and offers no button', () => {
    window.location.hash = '#/topic/calc'
    render(<App />)
    expect(screen.getByText(/Test coming soon/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /take the test/i })).toBeNull()
  })

  it('take test -> submit blank -> not passed -> attempt in history, survives a reload', async () => {
    window.location.hash = '#/topic/sp'
    render(<App />)
    await userEvent.click(screen.getByLabelText(/dev mode/i))
    await userEvent.click(screen.getByRole('link', { name: /take the test/i }))
    expect(document.querySelectorAll('input[type=radio]').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('input.num').length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: /submit test/i }))
    expect(screen.getByRole('status').textContent).toMatch(/Not passed/)

    cleanup() // simulate closing the tab
    window.location.hash = '#/topic/sp'
    render(<App />)
    expect(screen.getByText(/Failed/)).toBeTruthy()
    expect(screen.getByLabelText(/dev mode/i)).toHaveProperty('checked', true)
  })

  it('a retake draws new LQ numbers (fresh seed)', async () => {
    window.location.hash = '#/topic/sp'
    render(<App />)
    await userEvent.click(screen.getByLabelText(/dev mode/i))
    const seen = new Set<string>()
    for (let i = 0; i < 4; i++) {
      await userEvent.click(screen.getByRole('link', { name: /(take|retake) the test/i }))
      seen.add(document.querySelector('.card')!.textContent ?? '')
      await userEvent.click(screen.getByRole('button', { name: /submit test/i }))
      await userEvent.click(screen.getByRole('link', { name: /back to topic/i }))
    }
    expect(seen.size).toBeGreaterThan(1)
  }, 60000)
})
