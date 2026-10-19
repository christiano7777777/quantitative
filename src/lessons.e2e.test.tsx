// @vitest-environment jsdom
// Lecture pages and quizzes through the real pages (jsdom). Uses np, whose only prerequisite is p2.
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { topics } from './data'
import { lectureKey } from './lib/lessons'
import { createLocalProgress } from './lib/progress'
import type { GradeResult } from './lib/types'

const pass = { mcScore: 5, lqScore: 10, total: 15, max: 15, passed: true } as GradeResult
const seed = (key: string) =>
  createLocalProgress(window.localStorage).record(key, { seed: 's', mcIds: [], lqIds: [] }, { mc: [], lq: [] }, pass)

const NL = topics.find((t) => t.id === 'np')!.lectures.length // lectures of the np topic

beforeEach(() => {
  window.localStorage.clear()
  seed('p2') // np needs p2
  window.location.hash = '#/topic/np'
})
afterEach(cleanup)

describe('topic page with lessons', () => {
  it('lists the lectures, opens only lecture 1 and locks the topic test', () => {
    render(<App />)
    expect(screen.getByText(new RegExp(`Locked until you pass all ${NL} lecture quizzes \\(0/${NL} passed\\)`))).toBeTruthy()
    expect(screen.queryByRole('link', { name: /take the test/i })).toBeNull()
    const list = screen.getByRole('heading', { name: 'Lectures' }).closest('section')!
    expect(within(list).getAllByRole('link')).toHaveLength(1) // only lecture 1 is a link
    expect(within(list).getAllByText('locked')).toHaveLength(NL - 1)
  })

  it('passing lecture quizzes opens the next lecture, and all of them unlock the test', () => {
    seed(lectureKey('np', 1))
    render(<App />)
    const list = screen.getByRole('heading', { name: 'Lectures' }).closest('section')!
    expect(within(list).getAllByRole('link')).toHaveLength(2)
    expect(screen.getByText(new RegExp(`\\(1/${NL} passed\\)`))).toBeTruthy()
    cleanup()
    for (let n = 2; n <= NL; n++) seed(lectureKey('np', n))
    render(<App />)
    expect(screen.getByRole('link', { name: /take the test/i })).toBeTruthy()
  })

  it('a topic without lessons shows no lecture list and goes straight to its test', () => {
    window.location.hash = '#/topic/sp'
    seed('calc'); seed('mvc'); seed('p1')
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'Lectures' })).toBeNull()
    expect(screen.getByRole('link', { name: /take the test/i })).toBeTruthy()
  })
})

describe('lecture page and quiz', () => {
  it('shows the lesson, a worked sample with answers, and the quiz button', () => {
    window.location.hash = '#/topic/np/lecture/1'
    render(<App />)
    expect(screen.getByRole('heading', { name: /Lecture 1: Parametric versus nonparametric/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Lesson' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Worked sample' })).toBeTruthy()
    expect(screen.getAllByText('Working:').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('link', { name: /take the quiz/i })).toBeTruthy()
  })

  it('a locked lecture redirects to the topic page; dev mode opens it', async () => {
    window.location.hash = '#/topic/np/lecture/3'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /Nonparametric/i })).toBeTruthy()
    await userEvent.click(screen.getByLabelText(/dev mode/i))
    window.location.hash = '#/topic/np/lecture/3'
    cleanup()
    render(<App />)
    expect(screen.getByRole('heading', { name: /Lecture 3: Confidence intervals for the median/ })).toBeTruthy()
  })

  it('the quiz has 5 MC and 1 long question; a blank submission fails, is recorded, and does not unlock lecture 2', async () => {
    window.location.hash = '#/topic/np/lecture/1/quiz'
    render(<App />)
    expect(screen.getAllByRole('radio').length).toBe(5 * 4)
    expect(screen.getAllByRole('heading', { name: /Long question/ })).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: /submit quiz/i }))
    expect(screen.getByRole('status').textContent).toMatch(/Not passed.*0\/15 \(pass mark 12\)/)
    const store = createLocalProgress(window.localStorage)
    expect(store.attempts(lectureKey('np', 1))).toHaveLength(1)
    expect(store.isPassed(lectureKey('np', 1))).toBe(false)
    expect(store.isPassed('np')).toBe(false)
  })

  it('quizzing a locked lecture redirects away', () => {
    window.location.hash = '#/topic/np/lecture/2/quiz'
    render(<App />)
    expect(screen.queryByRole('button', { name: /submit quiz/i })).toBeNull()
  })
})
