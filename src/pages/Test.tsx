import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BlankInput } from '../components/BlankInput'
import { BlankPrompt } from '../components/BlankPrompt'
import { Math } from '../components/Math'
import { Rich } from '../components/Rich'
import { useApp } from '../context'
import { banks } from '../lib/content'
import { lectureRules, localGrader, topicRules } from '../lib/grader'
import { isUnlocked } from '../lib/graph'
import { lectureKey, lectureUnlocked, lessons, lessonsDone, selectLecturePaper } from '../lib/lessons'
import { newSeed, renderPaper, selectPaper } from '../lib/test-builder'
import { fmt } from './Topic'

export function TestPage() {
  const { id = '', lec } = useParams()
  const { graph, store, passed, dev, refresh } = useApp()
  const nav = useNavigate()
  const topic = graph.byId.get(id)
  const bank = banks[id]
  // Lecture quiz when the route has a lecture number, otherwise the topic test.
  const lecture = lec === undefined ? null : Number(lec)
  const lesson = lecture === null ? undefined : lessons[id]?.[lecture - 1]
  const key = lecture === null ? id : lectureKey(id, lecture)
  const rules = lecture === null ? topicRules : lectureRules
  const back = lecture === null ? `/topic/${id}` : `/topic/${id}/lecture/${lecture}`

  // Built once per visit; nothing is saved until the student submits.
  const paper = useMemo(() => {
    if (!bank) return null
    if (lecture === null) return renderPaper(bank, selectPaper(bank, newSeed(), store.seenMcIds(key)))
    if (!lesson) return null
    return renderPaper(bank, selectLecturePaper(bank, lesson, lecture, newSeed(), store.seenMcIds(key)))
  }, [bank, key, lecture, lesson, store])

  const [mc, setMc] = useState<(number | null)[]>(() => paper?.mc.map(() => null) ?? [])
  const [lq, setLq] = useState<string[][]>(() => paper?.lq.map((q) => q.parts.map(() => '')) ?? [])
  const [bl, setBl] = useState<string[]>(() => paper?.blanks?.map(() => '') ?? [])

  const allowed = lecture === null ? lessonsDone(store, id, dev) : lectureUnlocked(store, id, lecture, dev)
  if (!topic || !bank || !paper || !isUnlocked(graph, id, passed, dev) || !allowed) return <Navigate to={`/topic/${id}`} replace />

  const typedBank = paper.blanks !== undefined
  const unanswered =
    mc.filter((x) => x === null).length + lq.flat().filter((s) => s.trim() === '').length + bl.filter((s) => s.trim() === '').length
  const setPart = (qi: number, pi: number, v: string) =>
    setLq((a) => a.map((row, r) => (r === qi ? row.map((x, c) => (c === pi ? v : x)) : row)))

  const submit = () => {
    const answers = typedBank ? { mc, lq, blanks: bl } : { mc, lq }
    const result = localGrader.grade(paper, answers, rules)
    store.record(key, paper.spec, answers, result)
    refresh()
    const last = store.attempts(key).length - 1
    nav(lecture === null ? `/topic/${id}/attempt/${last}` : `/topic/${id}/lecture/${lecture}/attempt/${last}`, { replace: true })
  }

  return (
    <>
      <p><Link to={back}>← {lecture === null ? topic.label : `Lecture ${lecture}`}</Link></p>
      <h1>{topic.label}: {lecture === null ? 'test' : `lecture ${lecture} quiz`}</h1>
      {typedBank ? (
        <p className="muted small">
          Closed book. Type code as you would write it in a .tex file (or the command where one is asked for); each answer is
          checked automatically, and the results page shows how. Nothing is saved until you submit.
        </p>
      ) : (
        <p className="muted small">
          Closed book. A scientific calculator is allowed (no programming or graphing). Type numbers as decimals or fractions (0.5 or 1/2); no percent signs.
          Nothing is saved until you submit.
        </p>
      )}

      {typedBank ? (
        <>
          <h2>Part A: short answers <span className="muted small">({rules.mcMarks} mark each)</span></h2>
          <ol className="questions">
            {paper.blanks!.map((q, i) => (
              <li key={q.id} value={i + 1}>
                <BlankPrompt prompt={q.prompt} view={q} macros={q.blank.macros}
                  input={<BlankInput label={`Short answer ${i + 1}`} value={bl[i]} onChange={(v) => setBl((a) => a.map((x, j) => (j === i ? v : x)))} />} />
              </li>
            ))}
          </ol>
        </>
      ) : (
      <>
      <h2>Part A: multiple choice <span className="muted small">({rules.mcMarks} mark each)</span></h2>
      <ol className="questions">
        {paper.mc.map((q, i) => (
          <li key={q.id} value={i + 1}>
            <p><Math text={q.stem} /></p>
            {q.options.map((o, k) => (
              <label key={k} className="opt">
                <input type="radio" name={`mc${i}`} checked={mc[i] === k}
                  onChange={() => setMc((m) => m.map((v, j) => (j === i ? k : v)))} />
                <span><Math text={o.text} /></span>
              </label>
            ))}
          </li>
        ))}
      </ol>
      </>
      )}

      <h2>Part B: long questions</h2>
      {paper.lq.map((q, qi) => (
        <section key={q.id} className="card">
          <h3>Long question{paper.lq.length > 1 ? ` ${qi + 1}` : ''} <span className="muted small">({rules.lqMarks} marks, {fmt(rules.lqMarks / q.parts.length)} per part)</span></h3>
          <p>{typedBank ? <Rich text={q.intro} /> : <Math text={q.intro} />}</p>
          <ol type="a">
            {q.parts.map((p, pi) => (
              <li key={pi}>
                {p.blank && p.view ? (
                  <BlankPrompt prompt={p.prompt} view={p.view} macros={p.blank.macros}
                    input={<BlankInput label={`Long question ${qi + 1} part ${pi + 1} answer`} value={lq[qi][pi]} onChange={(v) => setPart(qi, pi, v)} />} />
                ) : (
                  <>
                    <p><Math text={p.prompt} /></p>
                    <input className="num" type="text" inputMode="text" autoComplete="off" spellCheck={false}
                      aria-label={`Long question ${qi + 1} part ${pi + 1} answer`}
                      value={lq[qi][pi]}
                      onChange={(e) => setPart(qi, pi, e.target.value)} />
                  </>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}

      <p>
        <button className="primary" onClick={submit}>{lecture === null ? 'Submit test' : 'Submit quiz'}</button>{' '}
        {unanswered > 0 && <span className="muted small">{unanswered} unanswered (they score 0)</span>}
      </p>
    </>
  )
}
