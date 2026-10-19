import { Link, Navigate, useParams } from 'react-router-dom'
import { Math } from '../components/Math'
import { lectureConfig, lecturePassMark, lectureTotal } from '../config/test.config'
import { useApp } from '../context'
import { banks } from '../lib/content'
import { isUnlocked } from '../lib/graph'
import { lectureKey, lectureUnlocked, lessons, workedExample } from '../lib/lessons'
import { fmt } from './Topic'

const num = (x: number) => String(Number(x.toPrecision(6)))

export function LecturePage() {
  const { id = '', lec = '' } = useParams()
  const { graph, store, passed, dev } = useApp()
  const topic = graph.byId.get(id)
  const n = Number(lec)
  const lesson = lessons[id]?.[n - 1]
  const bank = banks[id]
  if (!topic || !lesson || !bank || !isUnlocked(graph, id, passed, dev)) return <Navigate to={`/topic/${id}`} replace />

  if (!lectureUnlocked(store, id, n, dev)) return <Navigate to={`/topic/${id}`} replace />

  const info = topic.lectures[n - 1]
  const key = lectureKey(id, n)
  const attempts = store.attempts(key)
  const done = store.isPassed(key)
  const workedList = lesson.samples.map((s) => workedExample(bank, s))

  return (
    <>
      <p><Link to={`/topic/${id}`}>← {topic.label}</Link></p>
      <h1>
        Lecture {n}: {info.title}{' '}
        <span className={`badge st-${done ? 'passed' : 'open'}`}>{done ? 'passed' : 'open'}</span>
      </h1>
      <p className="muted small">
        <span className="tag">Theory</span>{info.theory}<br />
        <span className="tag">Computation</span>{info.computation}
      </p>

      <section className="card">
        <h2>Lesson</h2>
        {lesson.teach.map((p, i) => p.startsWith('## ')
          ? <h3 key={i}><Math text={p.slice(3)} /></h3>
          : <p key={i}><Math text={p} /></p>)}
      </section>

      {workedList.map((worked, wi) => (
      <section className="card" key={wi}>
        <h2>{workedList.length > 1 ? `Worked sample ${wi + 1} of ${workedList.length}` : 'Worked sample'}</h2>
        <p className="muted small">
          {workedList.length > 1
            ? 'The quiz asks a question of one of these kinds, with different numbers. Work through each before you start.'
            : 'The quiz asks a question of this kind with different numbers. Work through it before you start.'}
        </p>
        <p><Math text={worked.intro} /></p>
        <ol type="a">
          {worked.parts.map((p, i) => (
            <li key={i}>
              <p><Math text={p.prompt} /></p>
              <p className="small"><b>Working:</b> <Math text={p.explanation} /></p>
              <p className="small"><b>Answer:</b> <code>{num(p.answer)}</code></p>
            </li>
          ))}
        </ol>
      </section>
      ))}

      <section className="card">
        <h2>Quiz</h2>
        <p className="muted small">
          {lectureConfig.mcCount} multiple-choice questions (1 mark each, spread over the sections of this lecture) + 1 long question ({lectureConfig.lqMarks} marks, with parts from every section),
          {' '}{lectureTotal()} marks; pass at {lecturePassMark()}/{lectureTotal()}. Closed book, scientific calculator, unlimited retakes.
        </p>
        <p><Link className="btn primary" to={`/topic/${id}/lecture/${n}/quiz`}>{attempts.length ? 'Retake the quiz' : 'Take the quiz'}</Link></p>
        {attempts.length > 0 && (
          <table>
            <thead><tr><th>#</th><th>Date</th><th>MC</th><th>LQ</th><th>Total</th><th>Result</th><th /></tr></thead>
            <tbody>
              {attempts.map((a, i) => (
                <tr key={a.date + i}>
                  <td>{i + 1}</td>
                  <td>{new Date(a.date).toLocaleString()}</td>
                  <td>{fmt(a.mcScore)}</td><td>{fmt(a.lqScore)}</td>
                  <td>{fmt(a.total)}/{a.max}</td>
                  <td>{a.passed ? 'Passed' : 'Failed'}</td>
                  <td><Link to={`/topic/${id}/lecture/${n}/attempt/${i}`}>review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p>
        {n > 1 && <Link className="btn" to={`/topic/${id}/lecture/${n - 1}`}>← Lecture {n - 1}</Link>}{' '}
        {n < topic.lectures.length
          ? <Link className="btn" to={`/topic/${id}/lecture/${n + 1}`}>Lecture {n + 1} →</Link>
          : <Link className="btn" to={`/topic/${id}`}>Back to the topic</Link>}
      </p>
    </>
  )
}
