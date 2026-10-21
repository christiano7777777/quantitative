import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fmtMarks as fmt } from '../grades'
import { buildMarkingPrompt, answerKey, markWithApi, parseMarkingResult } from '../marking'
import type { WrittenExam, WrittenMarking } from '../types'
import { LatexPreview, Md } from './Rendered'

interface PanelProps {
  exam: WrittenExam
  answers: Record<string, string>
  apiKey: string
  model: string
  onMarking(m: WrittenMarking, by: 'import' | 'api'): void
  /** inject fetch in tests */
  fetchImpl?: typeof fetch
}

/** Two ways to mark: copy a prompt into Claude and paste the JSON back, or (with a stored key) call the API from here. */
export function MarkingPanel({ exam, answers, apiKey, model, onMarking, fetchImpl }: PanelProps) {
  const prompt = useMemo(() => buildMarkingPrompt(exam, answers), [exam, answers])
  const promptBox = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState('')
  const [pasted, setPasted] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied('Copied. Paste it into Claude, then paste the JSON reply below.')
    } catch {
      promptBox.current?.select()
      setCopied('Could not copy automatically: the prompt is selected below, press Ctrl+C.')
    }
  }
  const record = () => {
    const r = parseMarkingResult(pasted, exam)
    if (r.ok) { setErrors([]); onMarking(r.marking, 'import') } else setErrors(r.errors)
  }
  const viaApi = async () => {
    setBusy(true); setErrors([])
    try {
      const r = await markWithApi(exam, answers, { apiKey, model, fetchImpl })
      if (r.ok) onMarking(r.marking, 'api')
      else setErrors(['The API reply could not be used:', ...r.errors])
    } catch (e) {
      setErrors([(e as Error).message])
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card marking">
      <h2>Mark this attempt</h2>
      <h3>1. Export the marking prompt</h3>
      <p className="muted small">
        The prompt holds every question, its marking scheme and model answer, your LaTeX answers, and strict instructions to return JSON with marks per sub-part.
      </p>
      <p>
        <button className="primary" onClick={copy}>Export marking prompt (copy)</button>{' '}
        {copied && <span className="small" role="status">{copied}</span>}
      </p>
      <details>
        <summary>Show the prompt ({prompt.length.toLocaleString()} characters)</summary>
        <textarea ref={promptBox} className="prompt-box" readOnly value={prompt} rows={12} aria-label="Marking prompt" />
      </details>

      <h3>2. Import the result</h3>
      <label htmlFor="mark-json" className="small muted">Paste Claude's reply (the JSON object; fences or chatter around it are fine)</label>
      <textarea id="mark-json" className="prompt-box" value={pasted} onChange={(e) => setPasted(e.target.value)} rows={8} spellCheck={false} placeholder='{"questions":[{"id":"q1","parts":[{"id":"a","marks":4,"feedback":"..."}]}],"overall":"..."}' />
      <p><button onClick={record} disabled={!pasted.trim()}>Record marks</button></p>
      {errors.length > 0 && (
        <div className="errbox" role="alert">
          <b>Cannot record these marks:</b>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <h3>Or mark with the API</h3>
      {apiKey ? (
        <>
          <p className="small muted">Sends the same prompt from this browser to api.anthropic.com using the key stored in this browser (model {model}).</p>
          <p><button onClick={viaApi} disabled={busy}>{busy ? 'Marking... (this can take a minute)' : 'Mark with Anthropic API'}</button></p>
        </>
      ) : (
        <p className="small muted">No API key stored. <Link to="/settings">Add one in Settings</Link> for one-click marking (optional).</p>
      )}
    </section>
  )
}

interface ResultProps {
  exam: WrittenExam
  answers: Record<string, string>
  marking: WrittenMarking
  marks: number
  percent: number
  grade: string
}

/** Grade, per-question marks, feedback, the student's own answer and the model answer. */
export function WrittenResults({ exam, answers, marking, marks, percent, grade }: ResultProps) {
  return (
    <>
      <section className="card grade-card">
        <h2>Written exam: <span className="grade">{grade}</span></h2>
        <p><b>{fmt(marks)}/{fmt(exam.totalMarks)}</b> marks · {percent.toFixed(1)}%</p>
        {marking.overall && <p><b>Overall:</b> {marking.overall}</p>}
      </section>
      {exam.questions.map((q, qi) => {
        const qm = marking.questions.find((x) => x.id === q.id)
        const got = q.parts.reduce((n, p) => n + (qm?.parts.find((x) => x.id === p.id)?.marks ?? 0), 0)
        return (
          <section className="card" key={q.id}>
            <h2>Question {qi + 1}: {q.title} <span className="muted small">{fmt(got)}/{q.marks}</span></h2>
            {q.parts.map((p) => {
              const pm = qm?.parts.find((x) => x.id === p.id)
              const mine = answers[answerKey(q.id, p.id)] ?? ''
              return (
                <div className="exam-part" key={p.id}>
                  <h3>({p.id}) <span className="mark-badge">{pm ? fmt(pm.marks) : '–'}/{p.marks}</span></h3>
                  <Md text={p.text} preamble={exam.preamble} />
                  {pm?.feedback && <p className="feedback"><b>Feedback:</b> {pm.feedback}</p>}
                  <details>
                    <summary>Your answer</summary>
                    {mine.trim() ? <LatexPreview source={mine} preamble={exam.preamble} /> : <p className="muted">(no answer)</p>}
                  </details>
                  <details>
                    <summary>Marking scheme and model answer</summary>
                    <ol>{p.markingScheme.map((s, i) => <li key={i}><b>[{s.marks}]</b> <Md text={s.step} preamble={exam.preamble} className="inline" /></li>)}</ol>
                    <Md text={p.modelAnswer} preamble={exam.preamble} />
                  </details>
                </div>
              )
            })}
          </section>
        )
      })}
    </>
  )
}
