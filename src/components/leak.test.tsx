// @vitest-environment jsdom
// Before an attempt is submitted, nothing in the page may reveal the key, an accepted answer or a trap: not in the text,
// not in attributes, not through KaTeX's MathML annotation, not through the size of the box. The bank still ships in the
// JavaScript bundle, so this only protects against reading the page.
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOX, typed } from '../content/shared/typed'
import type { BlankQuestion, TestBank } from '../lib/types'
import { BlankInput } from './BlankInput'
import { BlankPrompt } from './BlankPrompt'

const secrets = ['x^{10}\\alpha', 'x^{10} \\alpha', 'x^10\\alpha', 'booktabs-secret', 'arraysecret', 'lrrsecret', 'lccsecret']

const blanks: BlankQuestion[] = [
  {
    id: 'p1', lecture: 1, kind: 'picture', prompt: 'Type the code for this formula.', picture: 'x^{10}\\alpha',
    blank: { mode: 'render', key: 'x^{10}\\alpha', accept: ['x^{10} \\alpha'], traps: [{ text: 'x^10\\alpha', misconception: 'only one digit is raised' }] },
    explanation: 'Braces group the exponent.',
  },
  {
    id: 't1', lecture: 1, kind: 'template', prompt: 'Which package?', template: '\\usepackage{' + BOX + '}',
    blank: { mode: 'tokens', key: 'booktabs-secret', traps: [{ text: 'arraysecret', misconception: 'wrong package' }] },
    explanation: 'It is the fixture key.',
  },
]
const bank: TestBank = {
  mc: [], blanks,
  lq: [{
    id: 'g', generate: () => ({
      intro: 'A table.',
      parts: [typed({
        prompt: 'Column spec.', lecture: 1, explanation: 'l then r.', view: { kind: 'template', template: '\\begin{tabular}{' + BOX + '}' },
        blank: { mode: 'tokens', key: 'lrrsecret', traps: [{ text: 'lccsecret', misconception: 'numbers go right' }] },
      })],
    }),
  }],
  examSlots: [['g'], ['g'], ['g']],
}

vi.mock('../lib/content', () => ({ banks: { fx: bank }, hasTest: () => true }))
vi.mock('../lib/lessons', async (orig) => ({ ...(await orig<typeof import('../lib/lessons')>()), lessons: {}, lessonsDone: () => true }))
vi.mock('../lib/graph', () => ({ isUnlocked: () => true }))
vi.mock('../context', async () => {
  const { createLocalProgress } = await vi.importActual<typeof import('../lib/progress')>('../lib/progress')
  const store = createLocalProgress(null)
  const topic = { id: 'fx', label: 'Fixture', lectures: [{ title: 'L1', theory: '', computation: '' }] }
  return { useApp: () => ({ graph: { byId: new Map([['fx', topic]]) }, store, passed: new Set(), dev: true, refresh: () => {} }) }
})

afterEach(cleanup)

const assertClean = (html: string, questions: string) => {
  for (const s of secrets) expect(html.includes(s), `leaked ${s}`).toBe(false)
  expect(html).not.toMatch(/annotation|application\/x-tex/)
  expect(questions).not.toMatch(/placeholder=|data-[a-z-]+=|title=/) // (links elsewhere carry router data- attributes)
}

describe('no answer leaks before submission', () => {
  it('the test page with a typed bank', async () => {
    const { TestPage } = await import('../pages/Test')
    const { container } = render(
      <MemoryRouter initialEntries={['/topic/fx/test']}>
        <Routes><Route path="/topic/:id/test" element={<TestPage />} /></Routes>
      </MemoryRouter>,
    )
    const html = container.innerHTML
    expect(html).toContain('Part A: short answers')
    expect(container.querySelectorAll('textarea.blank-in').length).toBe(2 + 3)
    expect(container.querySelector('.pic')).not.toBeNull()
    const questions = [...container.querySelectorAll('ol.questions, section.card')].map((e) => e.outerHTML).join('')
    assertClean(html, questions)
    // every box is identical apart from its numbered label, whatever the key's length or kind
    const boxes = new Set([...container.querySelectorAll('textarea')].map((t) => t.outerHTML.replace(/aria-label="[^"]*"/, '')))
    expect(boxes.size).toBe(1)
  })

  it('a box outside a template has the same attributes', () => {
    const { container } = render(<BlankPrompt prompt="q" view={{ kind: 'fix', broken: 'x' }}
      input={<BlankInput label="Answer 1" value="" onChange={() => {}} />} />)
    expect(container.querySelector('textarea')!.getAttribute('maxlength')).toBe('2000')
    expect(container.querySelector('textarea')!.hasAttribute('placeholder')).toBe(false)
  })
})
