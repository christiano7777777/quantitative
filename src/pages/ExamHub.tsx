import { Link, Navigate, useParams } from 'react-router-dom'
import { useApp } from '../context'
import { examConfig } from '../exam/config'
import { hasCoding, hasWritten, loadCoding, loadWritten } from '../exam/content'
import { fmtMarks } from '../exam/grades'
import { contentReady, examEnabled, needsCoding, needsWritten, topicWeights } from '../exam/phases'
import { useLoaded } from '../exam/ui/useLoaded'

const minutes = (a: string, b: string) => Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000))

export function ExamHubPage() {
  const { id = '' } = useParams()
  const { graph, exams, passed } = useApp()
  const topic = graph.byId.get(id)
  const written = useLoaded(`w-${id}`, () => loadWritten(id))
  const coding = useLoaded(`c-${id}`, () => loadCoding(id))
  if (!topic || !examEnabled(topic)) return <Navigate to={`/topic/${id}`} replace />

  const w = topicWeights(topic)
  const summary = exams.summary(id, topic.examWeights)
  const attempts = exams.writtenAttempts(id)
  const draft = exams.writtenDraft(id)
  const codeAttempts = exams.codingAttempts(id)
  const codeDraft = exams.codingDraft(id)
  const ready = contentReady(topic)

  return (
    <>
      <p><Link to={`/topic/${id}`}>← {topic.label}</Link></p>
      <h1>{topic.label}: Big Exam</h1>
      <p className="muted">
        An extra on top of the topic test. It gives a grade and does not change your skill-tree progress.{' '}
        {needsCoding(topic) && needsWritten(topic)
          ? `Two parts, each graded, plus a total (written ${Math.round(w.written * 100)}%, coding ${Math.round(w.coding * 100)}%). Both parts must be completed before any grade shows.`
          : 'Written part only (100%).'}
      </p>

      <section className="card grade-card" aria-label="Grades">
        <h2>Grade</h2>
        <p>
          {summary.total
            ? <>Total: <span className="grade">{summary.total.grade}</span> ({summary.total.percent.toFixed(1)}%)</>
            : <>No total yet. {passed.has(id) ? <>The topic test shows <b>Pass</b> until the big exam is complete.</> : 'Complete every part to get a grade.'}</>}
          {' '}<span className="muted small">Counts your {examConfig.headline} attempt of each part.</span>
        </p>
        <ul className="plain">
          {needsWritten(topic) && <li>Written: {summary.written ? <><b>{summary.written.grade}</b> ({summary.written.percent.toFixed(1)}%)</> : <span className="muted">not marked yet</span>}</li>}
          {needsCoding(topic) && <li>Coding: {summary.coding ? <><b>{summary.coding.grade}</b> ({summary.coding.percent.toFixed(1)}%)</> : <span className="muted">not attempted</span>}</li>}
        </ul>
      </section>

      {!ready && <p><b>Coming soon.</b> The exam files for this topic are not in <code className="ic">content/exams/</code> yet.</p>}

      {needsWritten(topic) && hasWritten(id) && (
        <section className="card" aria-label="Written exam">
          <h2>Part 1: Written exam</h2>
          <p className="muted small">
            {written.state === 'ready' ? `${written.value.totalMarks} marks, about ${written.value.durationMinutes} minutes (soft limit with a visible countdown). ` : ''}
            Answers are typed in LaTeX with a live preview. Marking is done by AI against a marking scheme.
          </p>
          <p>
            {draft
              ? <><Link className="btn primary" to={`/topic/${id}/exam/written`}>Resume your draft</Link> <span className="muted small">started {new Date(draft.startedAt).toLocaleString()}</span></>
              : <Link className="btn primary" to={`/topic/${id}/exam/written`}>{attempts.length ? 'Start a new attempt' : 'Start the written exam'}</Link>}
          </p>
          {attempts.length > 0 && (
            <table>
              <thead><tr><th>#</th><th>Submitted</th><th>Time</th><th>Marks</th><th>Grade</th><th /></tr></thead>
              <tbody>
                {attempts.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}{summary.written?.attemptId === a.id && <span className="badge" title={`the ${examConfig.headline} attempt, used for the grade`}> {examConfig.headline}</span>}</td>
                    <td>{new Date(a.submittedAt).toLocaleString()}</td>
                    <td>{minutes(a.startedAt, a.submittedAt)} min</td>
                    <td>{a.marks !== undefined ? `${fmtMarks(a.marks)}/${fmtMarks(a.max)}` : <span className="muted">needs marking</span>}</td>
                    <td>{a.grade ?? ''}</td>
                    <td><Link to={`/topic/${id}/exam/written/${a.id}`}>{a.marks !== undefined ? 'review' : 'mark it'}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
      {needsCoding(topic) && hasCoding(id) && (
        <section className="card" aria-label="Coding exam">
          <h2>Part 2: Coding exam</h2>
          <p className="muted small">
            {coding.state === 'ready' ? `${coding.value.totalMarks} marks, ${coding.value.questions.length} question${coding.value.questions.length === 1 ? '' : 's'}. ` : ''}
            Python in your browser (numpy and scipy). Visible tests run any time; hidden tests run when you submit. Half the marks come from each.
          </p>
          <p>
            {codeDraft
              ? <><Link className="btn primary" to={`/topic/${id}/exam/coding`}>Resume your draft</Link> <span className="muted small">last saved {new Date(codeDraft.updatedAt).toLocaleString()}</span></>
              : <Link className="btn primary" to={`/topic/${id}/exam/coding`}>{codeAttempts.length ? 'Start a new attempt' : 'Start the coding exam'}</Link>}
          </p>
          {codeAttempts.length > 0 && (
            <table>
              <thead><tr><th>#</th><th>Submitted</th><th>Marks</th><th>Grade</th><th /></tr></thead>
              <tbody>
                {codeAttempts.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}{summary.coding?.attemptId === a.id && <span className="badge"> {examConfig.headline}</span>}</td>
                    <td>{new Date(a.submittedAt).toLocaleString()}</td>
                    <td>{fmtMarks(a.marks)}/{fmtMarks(a.max)}</td>
                    <td>{a.grade}</td>
                    <td><Link to={`/topic/${id}/exam/coding/${a.id}`}>review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
      <p className="small muted">
        Preview as a student sees it: {hasWritten(id) && <Link to={`/exam-preview/${id}/written`}>written</Link>}{hasWritten(id) && hasCoding(id) && ' · '}{hasCoding(id) && <Link to={`/exam-preview/${id}/coding`}>coding</Link>}
      </p>
    </>
  )
}
