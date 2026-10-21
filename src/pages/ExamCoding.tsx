import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context'
import { useRunner } from '../exam/coding/factory'
import { scoreAttempt } from '../exam/coding/scoring'
import { loadCoding } from '../exam/content'
import { fmtMarks } from '../exam/grades'
import { examEnabled } from '../exam/phases'
import type { CodeQuestionResult, CodingExam } from '../exam/types'
import { CodingResults, CodingTake } from '../exam/ui/CodingTake'
import { useLoaded } from '../exam/ui/useLoaded'

function Gate({ id, children }: { id: string; children: (exam: CodingExam) => React.ReactNode }) {
  const { graph } = useApp()
  const topic = graph.byId.get(id)
  const exam = useLoaded(`c-${id}`, () => loadCoding(id))
  if (!topic || !examEnabled(topic)) return <Navigate to={`/topic/${id}`} replace />
  if (exam.state === 'loading') return <p>Loading the exam...</p>
  if (exam.state === 'missing') return <p><b>Coming soon.</b> There is no coding exam for this topic yet. <Link to={`/topic/${id}/exam`}>Back</Link></p>
  if (exam.state === 'error') return <p role="alert">Could not load the exam: {exam.message}</p>
  return <>{children(exam.value)}</>
}

export function CodingTakePage() {
  const { id = '' } = useParams()
  return <Gate id={id}>{(exam) => <Take id={id} exam={exam} />}</Gate>
}

function Take({ id, exam }: { id: string; exam: CodingExam }) {
  const { exams, refresh } = useApp()
  const nav = useNavigate()
  const runner = useRunner()
  const skeletons = Object.fromEntries(exam.questions.map((q) => [q.id, q.skeleton]))
  const [code, setCode] = useState<Record<string, string>>(() => ({ ...skeletons, ...(exams.codingDraft(id) ?? exams.startCoding(id, skeletons)).code }))
  const [saved, setSaved] = useState('')
  const latest = useRef(code)
  latest.current = code

  useEffect(() => {
    const t = setTimeout(() => { exams.saveCodingDraft(id, code); setSaved(`Draft saved ${new Date().toLocaleTimeString()}`) }, 400)
    return () => clearTimeout(t)
  }, [code, exams, id])

  const submit = (results: CodeQuestionResult[]) => {
    const s = scoreAttempt(exam, results)
    const a = exams.recordCoding(id, { results, ...s })
    refresh()
    nav(`/topic/${id}/exam/coding/${a.id}`, { replace: true })
  }
  return (
    <>
      <p><Link to={`/topic/${id}/exam`}>← Big Exam</Link></p>
      <CodingTake exam={exam} code={code} runner={runner} saved={saved} onCode={(q, v) => setCode((c) => ({ ...c, [q]: v }))} onSubmit={submit} />
    </>
  )
}

export function CodingAttemptPage() {
  const { id = '', aid = '' } = useParams()
  return <Gate id={id}>{(exam) => <Attempt id={id} aid={aid} exam={exam} />}</Gate>
}

function Attempt({ id, aid, exam }: { id: string; aid: string; exam: CodingExam }) {
  const { exams } = useApp()
  const a = exams.codingAttempt(id, aid)
  if (!a) return <Navigate to={`/topic/${id}/exam`} replace />
  return (
    <>
      <p><Link to={`/topic/${id}/exam`}>← Big Exam</Link></p>
      <h1>{exam.title}</h1>
      <section className="card grade-card">
        <h2>Coding exam: <span className="grade">{a.grade}</span></h2>
        <p><b>{fmtMarks(a.marks)}/{fmtMarks(a.max)}</b> marks · {a.percent.toFixed(1)}% · submitted {new Date(a.submittedAt).toLocaleString()}</p>
      </section>
      <CodingResults exam={exam} results={a.results} />
    </>
  )
}
