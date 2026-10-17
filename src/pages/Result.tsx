import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Math } from '../components/Math'
import { useApp } from '../context'
import { banks } from '../lib/content'
import { localGrader } from '../lib/grader'
import { renderPaper } from '../lib/test-builder'
import { fmt } from './Topic'

const num = (x: number) => String(Number(x.toPrecision(6)))

export function ResultPage() {
  const { id = '', n = '' } = useParams()
  const { graph, store } = useApp()
  const topic = graph.byId.get(id)
  const attempt = store.attempts(id)[Number(n)]
  const bank = banks[id]

  // The paper is rebuilt from the saved seed and question ids, then re-graded from the saved answers.
  const view = useMemo(() => {
    if (!attempt || !bank) return null
    const paper = renderPaper(bank, attempt.spec)
    return { paper, result: localGrader.grade(paper, attempt.answers) }
  }, [attempt, bank])

  if (!topic || !view) return <Navigate to={`/topic/${id}`} replace />
  const { paper, result: r } = view

  return (
    <>
      <p><Link to={`/topic/${id}`}>← {topic.label}</Link></p>
      <h1>{topic.label}: attempt {Number(n) + 1}</h1>
      <div className={`banner ${r.passed ? 'pass' : 'fail'}`} role="status">
        <b>{r.passed ? 'Passed' : 'Not passed'}</b>: {fmt(r.total)}/{r.max} (pass mark {r.passMark}).
        MC {fmt(r.mcScore)}/{r.mcMax}, long questions {fmt(r.lqScore)}/{r.lqMax}.
        {r.failedSectionMin.length > 0 && <> Below the section minimum: {r.failedSectionMin.join(', ')}.</>}
        {r.passed && <> Topics that depend on this one are now unlocked when their other prerequisites are passed.</>}
      </div>
      <p>
        <Link className="btn" to={`/topic/${id}`}>Back to topic</Link>{' '}
        <Link className="btn primary" to={`/topic/${id}/test`}>Retake with new questions</Link>
      </p>

      <h2>Multiple choice</h2>
      <ol className="questions">
        {paper.mc.map((q, i) => {
          const g = r.mc[i]
          return (
            <li key={q.id} value={i + 1} className={g.correct ? 'right' : 'wrong'}>
              <p><Math text={q.stem} /> <span className="tag">Lecture {q.lecture}</span> <b>{g.correct ? '✓' : '✗'}</b></p>
              {q.options.map((o, k) => (
                <div key={k} className={`opt res${o.correct ? ' key' : ''}${g.chosen === k ? ' picked' : ''}`}>
                  <span>{o.correct ? '✓' : g.chosen === k ? '✗' : '○'}</span>
                  <span>
                    <Math text={o.text} />
                    {g.chosen === k && !o.correct && o.misconception && (
                      <em className="small"> (This is the trap: {o.misconception})</em>
                    )}
                  </span>
                </div>
              ))}
              {g.chosen === null && <p className="small muted">Not answered.</p>}
              <p className="small"><Math text={q.explanation} /></p>
            </li>
          )
        })}
      </ol>

      <h2>Long questions</h2>
      {paper.lq.map((q, qi) => (
        <section key={q.id} className="card">
          <h3>Long question {qi + 1}</h3>
          <p><Math text={q.intro} /></p>
          <ol type="a">
            {q.parts.map((p, pi) => {
              const g = r.lq[qi][pi]
              return (
                <li key={pi} className={g.correct ? 'right' : 'wrong'}>
                  <p><Math text={p.prompt} /> <span className="tag">Lecture {p.lecture}</span></p>
                  <p className="small">
                    Your answer: <code>{g.given.trim() || '(blank)'}</code>; correct answer: <code>{num(g.expected)}</code>{' '}
                    <b>{g.correct ? `✓ ${fmt(g.marks)}/${fmt(g.max)}` : `✗ 0/${fmt(g.max)}`}</b>
                  </p>
                  <p className="small"><Math text={p.explanation} /></p>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </>
  )
}
