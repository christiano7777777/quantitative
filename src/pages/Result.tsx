import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BlankPrompt } from '../components/BlankPrompt'
import { Math } from '../components/Math'
import { Rich } from '../components/Rich'
import { TypedReview } from '../components/TypedReview'
import { useApp } from '../context'
import { banks } from '../lib/content'
import { lectureRules, localGrader, topicRules } from '../lib/grader'
import { lectureKey } from '../lib/lessons'
import { renderPaper } from '../lib/test-builder'
import { fmt } from './Topic'

const num = (x: number) => String(Number(x.toPrecision(6)))

export function ResultPage() {
  const { id = '', n = '', lec } = useParams()
  const { graph, store } = useApp()
  const topic = graph.byId.get(id)
  const lecture = lec === undefined ? null : Number(lec)
  const key = lecture === null ? id : lectureKey(id, lecture)
  const rules = lecture === null ? topicRules : lectureRules
  const back = lecture === null ? `/topic/${id}` : `/topic/${id}/lecture/${lecture}`
  const retake = lecture === null ? `/topic/${id}/test` : `/topic/${id}/lecture/${lecture}/quiz`
  const attempt = store.attempts(key)[Number(n)]
  const bank = banks[id]

  // The paper is rebuilt from the saved seed and question ids, then re-graded from the saved answers.
  const view = useMemo(() => {
    if (!attempt || !bank) return null
    const paper = renderPaper(bank, attempt.spec)
    return { paper, result: localGrader.grade(paper, attempt.answers, rules) }
  }, [attempt, bank, rules])

  if (!topic || !view) return <Navigate to={back} replace />
  const { paper, result: r } = view
  const typedBank = paper.blanks !== undefined

  return (
    <>
      <p><Link to={back}>← {lecture === null ? topic.label : `Lecture ${lecture}`}</Link></p>
      <h1>{topic.label}{lecture === null ? '' : `, lecture ${lecture} quiz`}: attempt {Number(n) + 1}</h1>
      <div className={`banner ${r.passed ? 'pass' : 'fail'}`} role="status">
        <b>{r.passed ? 'Passed' : 'Not passed'}</b>: {fmt(r.total)}/{r.max} (pass mark {r.passMark}).
        {typedBank ? 'Short answers' : 'MC'} {fmt(r.mcScore)}/{r.mcMax}, long questions {fmt(r.lqScore)}/{r.lqMax}.
        {r.failedSectionMin.length > 0 && <> Below the section minimum: {r.failedSectionMin.join(', ')}.</>}
        {r.passed && lecture === null && <> Topics that depend on this one are now unlocked when their other prerequisites are passed.</>}
        {r.passed && lecture !== null && <> The next step is unlocked.</>}
      </div>
      <p>
        <Link className="btn" to={back}>{lecture === null ? 'Back to topic' : 'Back to lecture'}</Link>{' '}
        <Link className="btn primary" to={retake}>Retake with new questions</Link>
      </p>

      {typedBank && (
        <>
          <h2>Short answers</h2>
          <ol className="questions">
            {paper.blanks!.map((q, i) => {
              const g = r.blanks![i]
              return (
                <li key={q.id} value={i + 1} className={g.correct ? 'right' : 'wrong'}>
                  <span className="tag">Lecture {q.lecture}</span>
                  <BlankPrompt prompt={q.prompt} view={q} macros={q.blank.macros} />
                  <TypedReview given={g.given} blank={q.blank} correct={g.correct} marks={g.marks} max={g.max} trap={g.trap} />
                  <p className="small"><Rich text={q.explanation} /></p>
                </li>
              )
            })}
          </ol>
        </>
      )}

      {paper.mc.length > 0 && <h2>Multiple choice</h2>}
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
          <h3>Long question{paper.lq.length > 1 ? ` ${qi + 1}` : ''}</h3>
          <p>{typedBank ? <Rich text={q.intro} /> : <Math text={q.intro} />}</p>
          <ol type="a">
            {q.parts.map((p, pi) => {
              const g = r.lq[qi][pi]
              if (p.blank && p.view) return (
                <li key={pi} className={g.correct ? 'right' : 'wrong'}>
                  <span className="tag">Lecture {p.lecture}</span>
                  <BlankPrompt prompt={p.prompt} view={p.view} macros={p.blank.macros} />
                  <TypedReview given={g.given} blank={p.blank} correct={g.correct} marks={g.marks} max={g.max} trap={g.trap} />
                  <p className="small"><Rich text={p.explanation} /></p>
                </li>
              )
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
