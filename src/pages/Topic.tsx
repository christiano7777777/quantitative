import { Link, useParams } from 'react-router-dom'
import { domainLabels } from '../data'
import { useApp } from '../context'
import { isUnlocked, statusOf } from '../lib/graph'
import { hasTest } from '../lib/content'
import { hasLessons, lectureKey, lectureUnlocked, lessonsDone } from '../lib/lessons'
import { passMark, totalMarks, testConfig } from '../config/test.config'
import { examEnabled, contentReady } from '../exam/phases'
import { statusLabel } from '../exam/grades'

export function TopicPage() {
  const { id = '' } = useParams()
  const { graph, store, exams, passed, dev } = useApp()
  const topic = graph.byId.get(id)
  if (!topic) return <p>Unknown topic. <Link to="/">Back to the tree</Link></p>

  const status = statusOf(graph, id, passed, dev)
  const unlocked = isUnlocked(graph, id, passed, dev)
  const missing = topic.prerequisites.filter((p) => !passed.has(p))
  const attempts = store.attempts(id)
  const best = store.best(id)
  const ready = hasTest(id)
  const lessonsOn = hasLessons(id)
  const lecturesPassed = lessonsOn ? topic.lectures.filter((_, i) => store.isPassed(lectureKey(id, i + 1))).length : 0
  const lecturesOk = lessonsDone(store, id, dev)
  const examOn = examEnabled(topic)
  const examSummary = exams.summary(id, topic.examWeights)
  const examLabel = statusLabel(examSummary, passed.has(id))

  return (
    <>
      <p><Link to="/">← Skill tree</Link></p>
      <h1>
        {topic.label} <span className="badge">{domainLabels[topic.domain]}</span>{' '}
        <span className={`badge st-${status}`}>{status}</span>
        {examLabel && <> <span className="badge st-passed" title={examSummary.total ? 'Big Exam grade' : 'Topic test passed; the Big Exam grade replaces this once both parts are done'}>{examLabel}</span></>}
      </h1>
      <p>{topic.summary}</p>

      <dl className="facts">
        <dt>Prerequisites</dt>
        <dd>
          {topic.prerequisites.length === 0 ? <span className="muted">none</span> : topic.prerequisites.map((p) => (
            <Link key={p} to={`/topic/${p}`} className={`chip ${passed.has(p) ? 'ok' : 'todo'}`}>
              {passed.has(p) ? '✓ ' : ''}{graph.byId.get(p)!.label}
            </Link>
          ))}
        </dd>
        <dt>University courses</dt>
        <dd className="mono small">{topic.courses}</dd>
        <dt>Learning outcomes</dt>
        <dd><ul>{topic.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></dd>
      </dl>

      {examOn && (
        <section className="card" aria-label="Big Exam">
          <h2>Big Exam</h2>
          <p className="muted small">
            An extra, graded exam with a written part and a coding part. It does not affect your skill-tree progress; the topic test below stays the only
            gate. {examSummary.total ? '' : passed.has(id) ? 'Until the big exam is complete this topic shows "Pass".' : ''}
          </p>
          {examSummary.total && <p>Grade: <b>{examSummary.total.grade}</b> ({examSummary.total.percent.toFixed(1)}%)</p>}
          <p>{contentReady(topic)
            ? <Link className="btn primary" to={`/topic/${id}/exam`}>Big Exam</Link>
            : <><Link className="btn" to={`/topic/${id}/exam`}>Big Exam</Link> <span className="muted small">coming soon: exam files not added yet</span></>}</p>
        </section>
      )}

      <section className="card">
        <h2>Test</h2>
        <p className="muted small">
          Closed book, scientific calculator, no time limit. {testConfig.mcCount} multiple-choice + {testConfig.lqCount} long
          questions, {totalMarks()} marks; pass at {passMark()}/{totalMarks()}. Unlimited retakes with fresh numbers.
        </p>
        {!ready && <p><b>Test coming soon.</b> Nobody has written this topic's test yet; see CONTRIBUTING.md.</p>}
        {ready && !unlocked && (
          <p>Locked. Pass these first: {missing.map((m, i) => (
            <span key={m}>{i > 0 && ', '}<Link to={`/topic/${m}`}>{graph.byId.get(m)!.label}</Link></span>
          ))}.</p>
        )}
        {ready && unlocked && !lecturesOk && (
          <p>Locked until you pass all {topic.lectures.length} lecture quizzes ({lecturesPassed}/{topic.lectures.length} passed).</p>
        )}
        {ready && unlocked && lecturesOk && (
          <p><Link className="btn primary" to={`/topic/${id}/test`}>{attempts.length ? 'Retake the test' : 'Take the test'}</Link></p>
        )}
        {dev && !passed.has(id) && ready && missing.length > 0 && <p className="small muted">Dev mode: prerequisites ignored.</p>}

        {best && <p>Best score: <b>{fmt(best.total)}/{best.max}</b></p>}
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
                  <td><Link to={`/topic/${id}/attempt/${i}`}>review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {lessonsOn && (
        <section className="card">
          <h2>Lectures</h2>
          <p className="muted small">Each lecture has a lesson, a worked sample and a quiz. Pass the quiz (12/15) to open the next lecture; pass all of them to unlock the topic test.</p>
          <ol className="outline">
            {topic.lectures.map((l, i) => {
              const n = i + 1
              const done = store.isPassed(lectureKey(id, n))
              const open = unlocked && lectureUnlocked(store, id, n, dev)
              return (
                <li key={l.title} value={n}>
                  {open ? <Link to={`/topic/${id}/lecture/${n}`}><b>{l.title}</b></Link> : <b>{l.title}</b>}{' '}
                  <span className={`badge st-${done ? 'passed' : open ? 'open' : 'locked'}`}>{done ? 'passed' : open ? 'open' : 'locked'}</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="card">
        <h2>What this test covers</h2>
        <p className="muted small">{topic.note}</p>
        <ol className="outline">
          {topic.lectures.map((l, i) => (
            <li key={l.title} value={i + 1}>
              <b>{l.title}</b>
              <div className="small"><span className="tag">Theory</span>{l.theory}</div>
              <div className="small"><span className="tag">Computation</span>{l.computation}</div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

export const fmt = (x: number) => String(Number(x.toFixed(2)))
