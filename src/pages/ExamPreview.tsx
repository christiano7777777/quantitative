import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context'
import { hasCoding, hasWritten, loadCoding, loadWritten, topicsWithExamFiles } from '../exam/content'
import { useRunner } from '../exam/coding/factory'
import { scoreAttempt } from '../exam/coding/scoring'
import { CodingResults, CodingTake } from '../exam/ui/CodingTake'
import { enabledPhases, examEnabled } from '../exam/phases'
import { fmtMarks, toPercent } from '../exam/grades'
import { percentToGrade } from '../exam/config'
import { scoreWritten } from '../exam/store'
import type { CodeQuestionResult, WrittenMarking } from '../exam/types'
import { MarkingPanel, WrittenResults } from '../exam/ui/Marking'
import { useLoaded } from '../exam/ui/useLoaded'
import { WrittenTake } from '../exam/ui/WrittenTake'

/** Every topic that has exam files, whether or not its phase is switched on. For checking content before it goes live. */
export function ExamPreviewIndex() {
  const { graph } = useApp()
  return (
    <>
      <h1>Exam preview</h1>
      <p className="muted">
        See an exam exactly as a student sees it, with nothing saved. Works for every topic that has files in <code className="ic">content/exams/</code>, also
        for phases that are not switched on yet (switched on now: {enabledPhases.map((p) => `phase ${p}`).join(', ') || 'none'}).
      </p>
      <table>
        <thead><tr><th>Topic</th><th>Phase</th><th>Live</th><th>Written</th><th>Coding</th></tr></thead>
        <tbody>
          {topicsWithExamFiles().map((id) => {
            const t = graph.byId.get(id)
            return (
              <tr key={id}>
                <td>{t?.label ?? id} <span className="muted small mono">{id}</span></td>
                <td>{t?.examPhase ?? '–'}</td>
                <td>{t && examEnabled(t) ? 'yes' : 'no'}</td>
                <td>{hasWritten(id) ? <Link to={`/exam-preview/${id}/written`}>preview</Link> : '–'}</td>
                <td>{hasCoding(id) ? <Link to={`/exam-preview/${id}/coding`}>preview</Link> : '–'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

export function WrittenPreviewPage() {
  const { id = '' } = useParams()
  const { settings } = useApp()
  const exam = useLoaded(`w-${id}`, () => loadWritten(id))
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString())
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [marking, setMarking] = useState<WrittenMarking | null>(null)

  if (exam.state === 'loading') return <p>Loading...</p>
  if (exam.state !== 'ready') return <p>No written exam file for “{id}”. <Link to="/exam-preview">Back</Link></p>
  const e = exam.value

  const marks = marking ? scoreWritten(e, marking) : 0
  return (
    <>
      <div className="preview-banner" role="note">
        <b>Preview mode.</b> This is exactly what a student sees. Nothing is saved. <Link to="/exam-preview">All previews</Link>{' '}
        <button onClick={() => { setStartedAt(new Date().toISOString()); setAnswers({}); setSubmitted(false); setMarking(null) }}>Reset</button>
        {e.placeholder && <b className="tex-err"> This is a PLACEHOLDER exam.</b>}
      </div>
      {!submitted
        ? <WrittenTake exam={e} startedAt={startedAt} answers={answers} preview
            onChange={(k, v) => setAnswers((a) => ({ ...a, [k]: v }))} onSubmit={() => setSubmitted(true)} />
        : (
          <>
            <p><button onClick={() => setSubmitted(false)}>← Back to the exam</button></p>
            {marking
              ? <WrittenResults exam={e} answers={answers} marking={marking} marks={marks} percent={toPercent(marks, e.totalMarks)} grade={percentToGrade(toPercent(marks, e.totalMarks))} />
              : null}
            <MarkingPanel exam={e} answers={answers} apiKey={settings.anthropicKey} model={settings.model} onMarking={(m) => setMarking(m)} />
          </>
        )}
    </>
  )
}

export function CodingPreviewPage() {
  const { id = '' } = useParams()
  const exam = useLoaded(`c-${id}`, () => loadCoding(id))
  const runner = useRunner()
  const [code, setCode] = useState<Record<string, string>>({})
  const [results, setResults] = useState<CodeQuestionResult[] | null>(null)

  if (exam.state === 'loading') return <p>Loading...</p>
  if (exam.state !== 'ready') return <p>No coding exam file for “{id}”. <Link to="/exam-preview">Back</Link></p>
  const e = exam.value
  const full = Object.fromEntries(e.questions.map((q) => [q.id, code[q.id] ?? q.skeleton]))
  return (
    <>
      <div className="preview-banner" role="note">
        <b>Preview mode.</b> This is exactly what a student sees; code runs for real, nothing is saved. <Link to="/exam-preview">All previews</Link>{' '}
        <button onClick={() => { setCode({}); setResults(null) }}>Reset</button>
        {e.placeholder && <b className="tex-err"> This is a PLACEHOLDER exam.</b>}
      </div>
      {results
        ? <>
            <p><button onClick={() => setResults(null)}>← Back to the exam</button></p>
            <section className="card grade-card"><h2>Result (not saved): {percentToGrade(scoreAttempt(e, results).percent)}</h2><p>{fmtMarks(scoreAttempt(e, results).marks)}/{e.totalMarks} marks</p></section>
            <CodingResults exam={e} results={results} />
          </>
        : <CodingTake exam={e} code={full} preview runner={runner} onCode={(q, v) => setCode((c) => ({ ...c, [q]: v }))} onSubmit={setResults} />}
    </>
  )
}
