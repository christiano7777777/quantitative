// @vitest-environment jsdom
// Full pass-through: answer the real SP test correctly in the real pages, pass it, and see dependants unlock.
// newSeed is pinned so the test can rebuild the same paper and know the right answers.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { banks } from './lib/content'
import { createLocalProgress } from './lib/progress'
import { renderPaper, selectPaper } from './lib/test-builder'
import type { GradeResult } from './lib/types'

vi.mock('./lib/test-builder', async (orig) => ({ ...(await orig<typeof import('./lib/test-builder')>()), newSeed: () => 'e2e-fixed-seed' }))

const pass = { mcScore: 20, lqScore: 30, total: 50, max: 50, passed: true } as GradeResult
const nodeLabel = (name: RegExp) => screen.getByRole('link', { name })

beforeEach(() => { window.localStorage.clear(); window.location.hash = '#/' })
afterEach(cleanup)

function answerEverything(correct: boolean) {
  const bank = banks.sp
  const paper = renderPaper(bank, selectPaper(bank, 'e2e-fixed-seed', new Set()))
  const items = Array.from(document.querySelectorAll('ol.questions > li'))
  expect(items).toHaveLength(paper.mc.length)
  paper.mc.forEach((q, i) => {
    const radios = items[i].querySelectorAll<HTMLInputElement>('input[type=radio]')
    const right = q.options.findIndex((o) => o.correct)
    const pick = correct ? right : (right + 1) % 4
    fireEvent.click(radios[pick])
  })
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input.num'))
  const parts = paper.lq.flatMap((q) => q.parts)
  expect(inputs).toHaveLength(parts.length)
  parts.forEach((p, i) => fireEvent.change(inputs[i], { target: { value: correct ? String(p.answer) : '-999' } }))
  return paper
}

describe('Stochastic Processes end to end', () => {
  it('all-correct attempt scores 50/50, passes, and unlocks Stochastic Calculus', () => {
    const store = createLocalProgress(window.localStorage)
    for (const id of ['calc', 'mvc', 'p1', 'p2']) store.record(id, { seed: 's', mcIds: [], lqIds: [] }, { mc: [], lq: [] }, pass)

    window.location.hash = '#/'
    render(<App />)
    expect(nodeLabel(/^Stochastic Calculus, locked/)).toBeTruthy() // needs sp (and mvc)
    fireEvent.click(nodeLabel(/^Stochastic Processes, open/))

    fireEvent.click(screen.getByRole('link', { name: /take the test/i }))
    answerEverything(true)
    fireEvent.click(screen.getByRole('button', { name: /submit test/i }))

    expect(screen.getByRole('status').textContent).toMatch(/Passed.*50\/50/)
    fireEvent.click(screen.getByRole('link', { name: /back to topic/i }))
    expect(screen.getByText('Passed', { selector: 'td' })).toBeTruthy()

    fireEvent.click(screen.getByRole('link', { name: /skill tree/i }))
    expect(nodeLabel(/^Stochastic Processes, passed/)).toBeTruthy()
    expect(nodeLabel(/^Stochastic Calculus, open/)).toBeTruthy() // unlocked by passing sp
    expect(nodeLabel(/^Reinforcement Learning, locked/)).toBeTruthy() // also needs Machine Learning
  }, 60000)

  it('all-wrong attempt fails; review page shows the correct answers and misconception notes', () => {
    window.location.hash = '#/topic/sp'
    render(<App />)
    fireEvent.click(screen.getByLabelText(/dev mode/i))
    fireEvent.click(screen.getByRole('link', { name: /take the test/i }))
    answerEverything(false)
    fireEvent.click(screen.getByRole('button', { name: /submit test/i }))
    expect(screen.getByRole('status').textContent).toMatch(/Not passed/)
    const page = within(document.body)
    expect(page.getAllByText(/This is the trap:/).length).toBeGreaterThan(5)
    expect(document.querySelectorAll('li.right').length).toBe(0)
    expect(document.body.textContent).toMatch(/correct answer:/)
  }, 60000)
})
