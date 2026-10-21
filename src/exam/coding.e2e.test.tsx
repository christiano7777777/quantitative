// @vitest-environment jsdom
// The coding exam through the real pages with a fake runner (Pyodide itself is exercised in a real browser and by
// `npm run validate-exams -- --pyodide`). CodeMirror is replaced by a textarea because jsdom has no layout.
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import bay from '../../content/exams/bay.coding.json'
import { App } from '../App'
import { setRunnerFactory } from './coding/factory'
import type { CaseResult, CodeRunner, RunRequest } from './coding/runner'
import { scoreAttempt, scoreQuestion } from './coding/scoring'
import { STATE_KEY } from './store'
import type { CodingExam } from './types'

// exam pages load their content with dynamic imports; give them time when the whole suite is running in parallel
configure({ asyncUtilTimeout: 15_000 })

vi.mock('./ui/CodeEditor', () => ({
  default: ({ value, onChange, label }: { value: string; onChange?(v: string): void; label: string }) =>
    <textarea aria-label={label} value={value} onChange={(e) => onChange?.(e.target.value)} />,
}))

const exam = bay as unknown as CodingExam

/** passes every case when the student code contains SOLVED, except the hidden test h2 which always fails */
function fakeRunner(seen: RunRequest[]): CodeRunner {
  return {
    onStatus() {},
    dispose() {},
    async run(req, onResult) {
      seen.push(req)
      const out: CaseResult[] = req.cases.map((c) => {
        const ok = req.student.includes('SOLVED') && c.id !== 'h2'
        return { id: c.id, passed: ok, message: ok ? 'ok' : c.id === 'h2' ? 'quantiles [0.05]: expected [1], got [2]' : 'NotImplementedError' }
      })
      out.forEach((r, i) => onResult?.(r, i + 1, out.length))
      return out
    },
  }
}

let seen: RunRequest[] = []
beforeEach(() => { window.localStorage.clear(); window.location.hash = '#/'; seen = []; setRunnerFactory(() => fakeRunner(seen)) })
afterEach(() => { cleanup(); setRunnerFactory(null) })

describe('scoring', () => {
  const q = { marks: 10 }
  it('splits marks 50/50 between visible and hidden tests by the proportion passed', () => {
    expect(scoreQuestion(q, [true, true], [true, true, true])).toBe(10)
    expect(scoreQuestion(q, [true, false], [true, true, true])).toBe(7.5)
    expect(scoreQuestion(q, [true, true], [true, false, false])).toBeCloseTo(5 + 5 / 3, 9)
    expect(scoreQuestion(q, [false, false], [false])).toBe(0)
    expect(scoreQuestion(q, [], [])).toBe(0)
  })
  it('adds up questions against the exam total', () => {
    const r = scoreAttempt(exam, [{ id: 'c1', code: '', visible: [], hidden: [], marks: 4, max: 10 }])
    expect(r).toEqual({ marks: 4, max: 10, percent: 40 })
  })
})

describe('taking the coding exam', () => {
  it('run visible tests, fix the code, submit; hidden tests only run on submit; reference is revealed after', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/topic/bay/exam/coding'
    render(<App />)
    const editor = await screen.findByLabelText(/Python code for question 1/) as HTMLTextAreaElement
    expect(editor.value).toContain('# YOUR CODE HERE') // the skeleton
    expect(screen.getByText(/3 hidden tests run when you submit/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Run visible tests' }))
    await waitFor(() => expect(screen.getAllByText('NotImplementedError').length).toBe(2))
    expect(seen).toHaveLength(1)
    expect(seen[0].cases.map((c) => c.id)).toEqual(['v1', 'v2']) // hidden tests were not sent
    expect(seen[0]).toMatchObject({ main: 'mh_posterior', rngArg: 'rng', timeLimitMs: 20000 })
    expect(seen[0].helper).toContain('N_ITER = 20000')

    fireEvent.change(editor, { target: { value: '# SOLVED\n' } })
    await user.click(screen.getByRole('button', { name: 'Run visible tests' }))
    await waitFor(() => expect(screen.getAllByText('✓').length).toBe(2))

    // the draft is saved
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(STATE_KEY)!).drafts.coding.bay.code.c1).toBe('# SOLVED\n'))

    await user.click(screen.getByRole('button', { name: 'Submit exam' }))
    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(await screen.findByText(/Coding exam:/)).toBeTruthy()

    // visible 2/2, hidden 2/3 -> 10 * (0.5 + 0.5 * 2/3) = 8.33
    const a = JSON.parse(window.localStorage.getItem(STATE_KEY)!).coding.bay[0]
    expect(a.marks).toBeCloseTo(8.3333, 3)
    expect(a.grade).toBe('A-') // 83.3% reaches the A- band (80)
    expect(screen.getByText(/quantiles \[0\.05\]: expected \[1\], got \[2\]/)).toBeTruthy() // hidden detail revealed after submission
    await user.click(screen.getByText('Reference solution'))
    expect(screen.getByText(/def mh_posterior/, { selector: 'pre' })).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem(STATE_KEY)!).drafts.coding.bay).toBeUndefined()
  })

  it('shows the grade only when both parts are done, on the hub', async () => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify({
      version: 1, written: {}, drafts: { written: {}, coding: {} },
      coding: { bay: [{ id: 'c1', startedAt: 'x', submittedAt: '2026-01-01T00:00:00Z', results: [], marks: 10, max: 10, percent: 100, grade: 'A+' }] },
    }))
    window.location.hash = '#/topic/bay/exam'
    render(<App />)
    expect(await screen.findByText(/No total yet/)).toBeTruthy()
    expect(screen.getByText(/Coding:/).textContent).toMatch(/A\+/)
  })

  it('redirects when the topic is not in an enabled phase', async () => {
    window.location.hash = '#/topic/calc/exam/coding'
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Calculus/ })).toBeTruthy()
  })
})
