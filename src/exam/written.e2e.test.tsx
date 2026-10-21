// @vitest-environment jsdom
// The written exam through the real pages (jsdom): gating, typing LaTeX with a bad line, submit, mark by pasted JSON, grade.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import bay from '../../content/exams/bay.written.json'
import { App } from '../App'
import { STATE_KEY } from './store'
import type { WrittenExam } from './types'

const exam = bay as unknown as WrittenExam
const go = (hash: string) => { window.location.hash = hash }

beforeEach(() => { window.localStorage.clear(); go('#/') })
afterEach(cleanup)

const reply = (marks: number[]) => JSON.stringify({
  questions: [{ id: 'q1', parts: exam.questions[0].parts.map((p, i) => ({ id: p.id, marks: marks[i], feedback: `fb-${p.id}` })) }], overall: 'Good work.',
})

describe('phase gating', () => {
  it('shows the Big Exam card on a phase 1 topic and not on a topic outside the enabled phases', async () => {
    go('#/topic/bay')
    render(<App />)
    expect(await screen.findByRole('region', { name: 'Big Exam' })).toBeTruthy()
    cleanup()
    go('#/topic/calc') // phase 2: exists in topics.json but is not switched on
    render(<App />)
    await screen.findByRole('heading', { name: /Calculus/ })
    expect(screen.queryByRole('region', { name: 'Big Exam' })).toBeNull()
  })

  it('redirects the exam URLs of a topic that is not enabled back to the topic page', async () => {
    go('#/topic/calc/exam/written')
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Calculus/ })).toBeTruthy()
    expect(window.location.hash).toBe('#/topic/calc')
  })
})

describe('taking the written exam', () => {
  it('start, type LaTeX with a broken formula, see the live preview above the box, submit, mark by paste, see the grade', async () => {
    const user = userEvent.setup()
    go('#/topic/bay/exam/written')
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /start the exam/i }))

    // the countdown is visible
    expect(screen.getByRole('timer').textContent).toMatch(/left/)

    const box = screen.getByLabelText(/Answer to question 1\(a\)/) as HTMLTextAreaElement
    const preview = box.previousElementSibling as HTMLElement // the preview sits directly above the answer box
    expect(preview.getAttribute('aria-label')).toBe('Preview of your answer')

    fireEvent.change(box, { target: { value: 'Good $x^2$ here.\n\nBad $\\frac{1}{$ line.\n\nAlso good: $$\\sum_i a_i$$' } })
    await waitFor(() => expect(preview.querySelectorAll('.katex').length).toBe(2)) // two good formulas still render
    expect(within(preview).getByRole('alert').textContent).toMatch(/Line 3/)
    expect(preview.textContent).toContain('line.')

    // the draft is saved while typing, so a reload loses nothing
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(STATE_KEY)!).drafts.written.bay.answers['q1.a']).toContain('Good $x^2$'))

    await user.click(screen.getByRole('button', { name: /submit exam/i }))
    await user.click(screen.getByRole('button', { name: /yes, submit/i }))

    // now on the attempt page, waiting for marks
    expect(await screen.findByRole('heading', { name: /Mark this attempt/ })).toBeTruthy()
    const saved = JSON.parse(window.localStorage.getItem(STATE_KEY)!)
    expect(saved.written.bay).toHaveLength(1)
    expect(saved.drafts.written.bay).toBeUndefined()

    // bad paste: clear errors, nothing recorded
    const paste = screen.getByLabelText(/Paste Claude's reply/)
    await user.click(paste); await user.paste('{"questions":[{"id":"q1","parts":[{"id":"a","marks":99}]}]}')
    await user.click(screen.getByRole('button', { name: /record marks/i }))
    expect(screen.getByRole('alert').textContent).toMatch(/q1\.a: 99 marks is outside 0 to 5/)
    expect(JSON.parse(window.localStorage.getItem(STATE_KEY)!).written.bay[0].marks).toBeUndefined()

    // good paste (with chatter around it)
    fireEvent.change(paste, { target: { value: 'Here you go:\n' + reply([5, 4, 3, 2.5]) } })
    await user.click(screen.getByRole('button', { name: /record marks/i }))
    expect(await screen.findByText(/Written exam:/)).toBeTruthy()
    expect(screen.getAllByText(/14\.5\/20/).length).toBeGreaterThan(0)
    expect(screen.getByText(/72\.5%/)).toBeTruthy()
    expect(screen.getByText('B', { selector: '.grade' })).toBeTruthy() // 72.5% -> B
    expect(screen.getByText(/fb-a/)).toBeTruthy()
    expect(screen.getByText(/fb-d/)).toBeTruthy()
    expect(screen.getByText(/Good work\./)).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem(STATE_KEY)!).written.bay[0]).toMatchObject({ marks: 14.5, grade: 'B', markedBy: 'import' })
  })

  it('the topic page shows Pass, not the grade, until both parts are done', async () => {
    window.localStorage.setItem('quantitative.progress.v1', JSON.stringify({
      version: 1, devMode: false,
      attempts: { bay: [{ spec: { seed: 's', mcIds: [], lqIds: [] }, date: new Date().toISOString(), mcScore: 20, lqScore: 30, total: 50, max: 50, passed: true, answers: { mc: [], lq: [] } }] },
    }))
    window.localStorage.setItem(STATE_KEY, JSON.stringify({
      version: 1, coding: {}, drafts: { written: {}, coding: {} },
      written: { bay: [{ id: 'a1', startedAt: '2026-01-01T00:00:00Z', submittedAt: '2026-01-01T01:00:00Z', answers: {}, max: 20, marks: 20, percent: 100, grade: 'A+', marking: { questions: [] } }] },
    }))
    go('#/topic/bay')
    render(<App />)
    const head = await screen.findByRole('heading', { name: /Bayesian/ })
    expect(head.textContent).toMatch(/Pass/)
    expect(head.textContent).not.toMatch(/A\+/)
  })

  it('a written-only topic would show the grade once the written part is marked (weights 100/0)', async () => {
    // weights come from topics.json; here we only prove the arithmetic path used by the page
    const { summarise } = await import('./grades')
    expect(summarise([{ id: 'a', startedAt: '', submittedAt: '', answers: {}, max: 20, marks: 20, percent: 100 }], [], { written: 1, coding: 0 }).total!.grade).toBe('A+')
  })
})

describe('preview mode', () => {
  it('shows the exam like a student sees it, with the author view on request, and saves nothing', async () => {
    const user = userEvent.setup()
    go('#/exam-preview/bay/written')
    render(<App />)
    expect(await screen.findByText(/Preview mode/)).toBeTruthy()
    expect(screen.getByText(/PLACEHOLDER exam/)).toBeTruthy()
    expect(screen.queryByText(/Marking scheme and model answer/)).toBeNull()
    await user.click(screen.getByLabelText(/Show marking scheme and model answers/))
    expect(screen.getAllByText(/Marking scheme and model answer \(author view\)/).length).toBe(4)
    fireEvent.change(screen.getByLabelText(/Answer to question 1\(a\)/), { target: { value: 'hello' } })
    expect(window.localStorage.getItem(STATE_KEY)).toBeNull()
  })

  it('works for a topic whose phase is not switched on', async () => {
    go('#/exam-preview')
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Exam preview/ })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'preview' }).length).toBeGreaterThan(0)
  })
})

describe('settings and export', () => {
  it('keeps the API key out of exported progress, with a clear warning', async () => {
    const user = userEvent.setup()
    go('#/settings')
    render(<App />)
    expect(await screen.findByText(/stored in plain text in this browser/i)).toBeTruthy()
    await user.type(screen.getByLabelText(/API key/), 'sk-ant-secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(window.localStorage.getItem('quantitative.settings.v1')).toContain('sk-ant-secret')
    expect(window.localStorage.getItem(STATE_KEY) ?? '').not.toContain('sk-ant-secret')
  })
})
