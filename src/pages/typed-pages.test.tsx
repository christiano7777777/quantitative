// @vitest-environment jsdom
// Smoke tests of the pages with a typed bank: the results page shows the student's code beside the key, the grading mode
// and the trap; the lecture page renders a verbatim lesson, a practice box and a typed worked sample.
import { cleanup, fireEvent, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOX, typed } from '../content/shared/typed'
import { useApp } from '../context'
import { lectureRules, localGrader } from '../lib/grader'
import { renderPaper } from '../lib/test-builder'
import type { Lesson, TestBank } from '../lib/types'

const bank: TestBank = {
  mc: [],
  blanks: [{
    id: 'b1', lecture: 1, kind: 'name', prompt: 'Which package provides the rule `\\toprule`?', template: '\\usepackage{' + BOX + '}',
    blank: { mode: 'tokens', key: 'booktabs', traps: [{ text: 'array', misconception: 'array adds column types, not rules' }] },
    explanation: 'booktabs gives `\\toprule`, `\\midrule` and `\\bottomrule`.',
  }],
  lq: [{
    id: 'g', generate: () => ({
      intro: 'Typeset $x$ for a note.',
      parts: [typed({
        prompt: 'Type the code for this formula.', lecture: 1, explanation: 'Braces around the exponent.',
        view: { kind: 'picture', picture: 'x^{10}' },
        blank: { mode: 'render', key: 'x^{10}', traps: [{ text: 'x^10', misconception: 'without braces only the 1 is raised' }] },
      })],
    }),
  }],
}
const lesson: Lesson = {
  verbatim: true,
  teach: ['## Exponents', 'Write `x^{10}` and the formula is $x^{10}$.', '```latex\n\\begin{equation}\n  E = mc^2\n\\end{equation}\n```', 'c', 'd'],
  samples: [{ workedSeed: 'w', lqId: 'g' }],
  practice: [{ prompt: 'Typeset the square of $y$.', blank: { mode: 'render', key: 'y^2' } }],
}

vi.mock('../lib/content', () => ({ banks: { fx: bank }, hasTest: () => true }))
vi.mock('../lib/lessons', async (orig) => ({ ...(await orig<typeof import('../lib/lessons')>()), lessons: { fx: [lesson] }, lessonsDone: () => true, lectureUnlocked: () => true }))
vi.mock('../lib/graph', () => ({ isUnlocked: () => true }))
vi.mock('../context', async () => {
  const { createLocalProgress } = await vi.importActual<typeof import('../lib/progress')>('../lib/progress')
  const store = createLocalProgress(null)
  const topic = { id: 'fx', label: 'Fixture', lectures: [{ title: 'Tables', theory: 't', computation: 'c' }] }
  return { useApp: () => ({ graph: { byId: new Map([['fx', topic]]) }, store, passed: new Set(), dev: true, refresh: () => {} }) }
})

afterEach(cleanup)

describe('pages with a typed bank', () => {
  it('the results page shows both answers, the mode and the trap', async () => {
    const { ResultPage } = await import('./Result')
    const { store } = useApp()
    const spec = { seed: 's', mcIds: ['b1'], lqIds: ['g'] }
    const paper = renderPaper(bank, spec)
    const answers = { mc: [], blanks: ['array'], lq: [['x^{10}']] }
    store.record('fx#L1', spec, answers, localGrader.grade(paper, answers, lectureRules))
    const { container } = render(
      <MemoryRouter initialEntries={['/topic/fx/lecture/1/attempt/0']}>
        <Routes><Route path="/topic/:id/lecture/:lec/attempt/:n" element={<ResultPage />} /></Routes>
      </MemoryRouter>,
    )
    const text = container.textContent!
    expect(text).toContain('Short answers')
    expect(text).toContain('This is the trap: array adds column types')
    expect(text).toContain('booktabs')
    expect(text).toContain('Graded by: compared as rendered maths')
    expect(text).toContain('✓')
    expect(text).not.toContain('NaN')
  })

  it('the lecture page renders code verbatim, a practice box that checks, and the typed worked sample', async () => {
    const { LecturePage } = await import('./Lecture')
    const { container, getByText, getByLabelText } = render(
      <MemoryRouter initialEntries={['/topic/fx/lecture/1']}>
        <Routes><Route path="/topic/:id/lecture/:lec" element={<LecturePage />} /></Routes>
      </MemoryRouter>,
    )
    expect(container.querySelector('pre.code')!.textContent).toContain('\\begin{equation}')
    expect(container.querySelector('code.ic')!.textContent).toBe('x^{10}')
    expect(container.textContent).toContain('short typed answers')
    expect(container.textContent).not.toContain('NaN')
    const box = getByLabelText('Practice 1 answer')
    fireEvent.change(box, { target: { value: 'y^{2}' } })
    expect(container.querySelector('.preview .katex')).not.toBeNull()
    fireEvent.click(getByText('Check'))
    expect(container.textContent).toContain('✓ right')
  })
})
