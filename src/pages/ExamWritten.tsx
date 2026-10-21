import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context'
import { loadWritten } from '../exam/content'
import { fmtMarks } from '../exam/grades'
import { examEnabled } from '../exam/phases'
import type { WrittenExam, WrittenMarking } from '../exam/types'
import { MarkingPanel, WrittenResults } from '../exam/ui/Marking'
import { useLoaded } from '../exam/ui/useLoaded'
import { WrittenTake } from '../exam/ui/WrittenTake'

function Gate({ id, children }: { id: string; children: (exam: WrittenExam) => React.ReactNode }) {
  const { graph } = useApp()
  const topic = graph.byId.get(id)
  const exam = useLoaded(`w-${id}`, () => loadWritten(id))
  if (!topic || !examEnabled(topic)) return <Navigate to={`/topic/${id}`} replace />
  if (exam.state === 'loading') return <p>Loading the exam...</p>
  if (exam.state === 'missing') return <p><b>Coming soon.</b> There is no written exam for this topic yet. <Link to={`/topic/${id}/exam`}>Back</Link></p>
  if (exam.state === 'error') return <p role="alert">Could not load the exam: {exam.message}</p>
  return <>{children(exam.value)}</>
}

/** Start screen, then the exam itself. The draft (answers and start time) is saved as you type, so a refresh loses nothing. */
export function WrittenTakePage() {
  const { id = '' } = useParams()
  return <Gate id={id}>{(exam) => <Take id={id} exam={exam} />}</Gate>
}

function Take({ id, exam }: { id: string; exam: WrittenExam }) {
  const { exams, refresh } = useApp()
  const nav = useNavigate()
  const [draft, setDraft] = useState(() => exams.writtenDraft(id))
  const [answers, setAnswers] = useState<Record<string, string>>(() => draft?.answers ?? {})
  const [saved, setSaved] = useState('')
  const latest = useRef(answers)
  latest.current = answers

  useEffect(() => {
    if (!draft) return
    const t = setTimeout(() => { exams.saveWrittenDraft(id, answers); setSaved(`Draft saved ${new Date().toLocaleTimeString()}`) }, 400)
    return () => clearTimeout(t)
  }, [answers, draft, exams, id])
  useEffect(() => () => { if (exams.writtenDraft(id)) exams.saveWrittenDraft(id, latest.current) }, [exams, id])

  if (!draft) {
    return (
      <>
        <p><Link to={`/topic/${id}/exam`}>← Big Exam</Link></p>
        <h1>{exam.title}</h1>
        <section className="card">
          <ul className="plain">
            <li>{exam.totalMarks} marks over {exam.questions.length} question{exam.questions.length === 1 ? '' : 's'}.</li>
            <li>About {exam.durationMinutes} minutes. The countdown is a soft limit: it never submits for you.</li>
            <li>Type every answer in LaTeX. A live preview sits above each answer box; a mistake in one formula does not affect the others.</li>
            <li>Your draft is saved in this browser as you type. Closing the tab does not stop the clock.</li>
            <li>Marking is by AI against a marking scheme, after you submit.</li>
          </ul>
          <button className="primary" onClick={() => setDraft(exams.startWritten(id))}>Start the exam</button>
        </section>
      </>
    )
  }

  const submit = () => {
    const a = exams.submitWritten(id, exam, latest.current)
    refresh()
    nav(`/topic/${id}/exam/written/${a.id}`, { replace: true })
  }
  return (
    <WrittenTake exam={exam} startedAt={draft.startedAt} answers={answers} saved={saved}
      onChange={(k, v) => setAnswers((a) => ({ ...a, [k]: v }))} onSubmit={submit} />
  )
}

/** A submitted attempt: marking panel until marked, then the grade, marks, feedback and model answer. */
export function WrittenAttemptPage() {
  const { id = '', aid = '' } = useParams()
  return <Gate id={id}>{(exam) => <Attempt id={id} aid={aid} exam={exam} />}</Gate>
}

function Attempt({ id, aid, exam }: { id: string; aid: string; exam: WrittenExam }) {
  const { exams, settings, refresh } = useApp()
  const [remark, setRemark] = useState(false)
  const a = exams.writtenAttempt(id, aid)
  if (!a) return <Navigate to={`/topic/${id}/exam`} replace />
  const marked = a.marking !== undefined && a.marks !== undefined && !remark

  const onMarking = (m: WrittenMarking, by: 'import' | 'api') => {
    exams.markWritten(id, aid, exam, m, by)
    setRemark(false)
    refresh()
  }
  return (
    <>
      <p><Link to={`/topic/${id}/exam`}>← Big Exam</Link></p>
      <h1>{exam.title}</h1>
      <p className="muted small">
        Submitted {new Date(a.submittedAt).toLocaleString()}
        {a.markedAt && <> · marked {new Date(a.markedAt).toLocaleString()} ({a.markedBy === 'api' ? 'via the API' : 'by pasted result'})</>}
      </p>
      {marked
        ? <>
            <WrittenResults exam={exam} answers={a.answers} marking={a.marking!} marks={a.marks!} percent={a.percent!} grade={a.grade!} />
            <p><button onClick={() => setRemark(true)}>Mark again (replaces {fmtMarks(a.marks!)}/{fmtMarks(a.max)})</button></p>
          </>
        : <>
            {a.marking && <p><button onClick={() => setRemark(false)}>Cancel, keep the current marks</button></p>}
            <MarkingPanel exam={exam} answers={a.answers} apiKey={settings.anthropicKey} model={settings.model} onMarking={onMarking} />
          </>}
    </>
  )
}
