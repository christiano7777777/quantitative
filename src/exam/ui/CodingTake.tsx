import { lazy, Suspense, useState } from 'react'
import { examConfig } from '../config'
import { buildResult } from '../coding/scoring'
import type { CaseResult, CodeRunner } from '../coding/runner'
import { fmtMarks } from '../grades'
import type { CodeQuestionResult, CodingExam, CodingQuestion, CodingTest, TestOutcome } from '../types'
import { Md } from './Rendered'

// CodeMirror is loaded only when a coding page opens
const CodeEditor = lazy(() => import('./CodeEditor'))

export const caseOf = (t: CodingTest) => ({ id: t.id, input: t.input, seed: t.seed, compare: t.compare, expected: t.expected })
export const limitMs = (q: CodingQuestion) => (q.timeLimitSeconds ?? examConfig.defaultTimeLimitSeconds) * 1000
export const mainName = (q: CodingQuestion) => q.functions.find((f) => f.main)!.name

const toOutcome = (r: CaseResult, hidden: boolean): TestOutcome => ({ id: r.id, passed: r.passed, message: r.message, hidden })

export function TestList({ tests, outcomes, showHiddenDetail }: { tests: CodingTest[]; outcomes: TestOutcome[]; showHiddenDetail: boolean }) {
  return (
    <ul className="tests">
      {tests.map((t) => {
        const o = outcomes.find((x) => x.id === t.id)
        const detail = o && (!o.hidden || showHiddenDetail) ? o.message : o && !o.passed ? 'failed (details are shown after you submit)' : ''
        return (
          <li key={t.id} className={o ? (o.passed ? 'pass' : 'fail') : 'todo'}>
            <b>{o ? (o.passed ? '✓' : '✗') : '·'}</b> <span className="mono">{t.id}</span> {t.description ?? ''}
            {o && !o.passed && detail && <div className="small testmsg">{detail}</div>}
          </li>
        )
      })}
    </ul>
  )
}

interface Props {
  exam: CodingExam
  code: Record<string, string>
  onCode(qid: string, value: string): void
  runner: CodeRunner
  onSubmit(results: CodeQuestionResult[]): void
  preview?: boolean
  saved?: string
}

export function CodingTake({ exam, code, onCode, runner, onSubmit, preview, saved }: Props) {
  const [qi, setQi] = useState(0)
  const [outcomes, setOutcomes] = useState<Record<string, TestOutcome[]>>({})
  const [stdout, setStdout] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [loading, setLoading] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [showRef, setShowRef] = useState(false)
  const q = exam.questions[qi]
  runner.onStatus(setLoading)

  const run = async (question: CodingQuestion, tests: CodingTest[], hidden: boolean, label: string): Promise<TestOutcome[]> => {
    const res = await runner.run(
      { helper: question.helperCode, student: code[question.id] ?? question.skeleton, main: mainName(question), rngArg: question.rngArg, timeLimitMs: limitMs(question), cases: tests.map(caseOf) },
      (_r, done, total) => setBusy(`${label} ${done}/${total}`),
    )
    const first = res.find((r) => r.stdout)
    if (first && !hidden) setStdout((s) => ({ ...s, [question.id]: first.stdout! }))
    return res.map((r) => toOutcome(r, hidden))
  }

  const runVisible = async () => {
    setBusy('Running visible tests...'); setStdout((s) => ({ ...s, [q.id]: '' }))
    const out = await run(q, q.visibleTests, false, 'Running visible tests')
    setOutcomes((o) => ({ ...o, [q.id]: out }))
    setBusy('')
  }

  const submit = async () => {
    setConfirm(false)
    const results: CodeQuestionResult[] = []
    for (const question of exam.questions) {
      const vis = await run(question, question.visibleTests, false, `${question.id}: visible tests`)
      const hid = await run(question, question.hiddenTests, true, `${question.id}: hidden tests`)
      results.push(buildResult(question, code[question.id] ?? question.skeleton, vis, hid))
    }
    setBusy('')
    onSubmit(results)
  }

  const mine = outcomes[q.id]
  return (
    <>
      <div className="exam-bar">
        <b>{exam.title}</b>
        <span className="muted small">{exam.totalMarks} marks · visible tests: {Math.round(examConfig.codingVisibleShare * 100)}%, hidden tests: {Math.round((1 - examConfig.codingVisibleShare) * 100)}%</span>
        <span className="grow" />
        {saved && <span className="muted small" role="status">{saved}</span>}
        {busy && <span className="small" role="status">{busy}</span>}
        {!confirm
          ? <button className="primary" disabled={!!busy} onClick={() => setConfirm(true)}>{preview ? 'Try the submit step' : 'Submit exam'}</button>
          : <span className="inline-confirm">Run all tests and {preview ? 'show the result (preview: not saved)' : 'submit'}? <button className="primary" onClick={submit}>Yes</button> <button onClick={() => setConfirm(false)}>Cancel</button></span>}
      </div>
      {loading && <p className="card" role="status">{loading}</p>}
      <section className="card"><Md text={exam.instructions} /></section>

      <div className="tabs" role="tablist">
        {exam.questions.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === qi} className={i === qi ? 'primary' : ''} onClick={() => { setQi(i); setShowRef(false) }}>Q{i + 1} · {x.title}</button>
        ))}
      </div>

      <section className="card" key={q.id}>
        <h2>Question {qi + 1}: {q.title} <span className="muted small">[{q.marks} marks]</span></h2>
        <Md text={q.text} />
        <p className="small"><b>Write:</b> {q.functions.map((f) => <span key={f.name}><code className="ic">{f.name}</code>{f.main ? ' (tested)' : ' (helper)'} — {f.description}{' '}</span>)}</p>
        <details open><summary>Notes and pseudocode</summary><Md text={q.docs} /></details>
        {q.helperCode.trim() && <details><summary>Provided code (read-only, runs before yours)</summary><pre className="code">{q.helperCode}</pre></details>}

        <Suspense fallback={<p className="muted">Loading the editor...</p>}>
          <CodeEditor label={`Python code for question ${qi + 1}`} value={code[q.id] ?? q.skeleton} onChange={(v) => onCode(q.id, v)} />
        </Suspense>
        <p>
          <button className="primary" disabled={!!busy} onClick={runVisible}>Run visible tests</button>{' '}
          <button disabled={!!busy} onClick={() => onCode(q.id, q.skeleton)}>Reset to skeleton</button>
        </p>
        <h3>Visible tests</h3>
        <TestList tests={q.visibleTests} outcomes={mine ?? []} showHiddenDetail={false} />
        {stdout[q.id] && <><h3>Your output (print)</h3><pre className="code">{stdout[q.id]}</pre></>}
        <p className="muted small">{q.hiddenTests.length} hidden test{q.hiddenTests.length === 1 ? '' : 's'} run when you submit. Results can change from run to run only if your code is unseeded; the tests seed everything for you.</p>

        {preview && (
          <details className="key" open={showRef} onToggle={(e) => setShowRef((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>Author view: difficulty notes, hidden tests and reference solution</summary>
            {q.difficultyNotes && <p><b>Difficulty notes:</b> {q.difficultyNotes}</p>}
            <h3>Hidden tests</h3>
            <TestList tests={q.hiddenTests} outcomes={[]} showHiddenDetail />
            <h3>Reference solution</h3>
            <pre className="code">{q.referenceSolution}</pre>
          </details>
        )}
      </section>
    </>
  )
}

export function CodingResults({ exam, results }: { exam: CodingExam; results: CodeQuestionResult[] }) {
  return (
    <>
      {exam.questions.map((q, i) => {
        const r = results.find((x) => x.id === q.id)
        if (!r) return null
        return (
          <section className="card" key={q.id}>
            <h2>Question {i + 1}: {q.title} <span className="mark-badge">{fmtMarks(r.marks)}/{q.marks}</span></h2>
            <p className="small muted">Visible {r.visible.filter((t) => t.passed).length}/{r.visible.length} passed · hidden {r.hidden.filter((t) => t.passed).length}/{r.hidden.length} passed</p>
            <h3>Visible tests</h3>
            <TestList tests={q.visibleTests} outcomes={r.visible} showHiddenDetail />
            <h3>Hidden tests</h3>
            <TestList tests={q.hiddenTests} outcomes={r.hidden} showHiddenDetail />
            <details><summary>Your code</summary><pre className="code">{r.code}</pre></details>
            <details><summary>Reference solution</summary><pre className="code">{q.referenceSolution}</pre></details>
          </section>
        )
      })}
    </>
  )
}
