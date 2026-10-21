import { useState } from 'react'
import { answerKey } from '../marking'
import type { WrittenExam } from '../types'
import { LatexPreview, Md, Timer } from './Rendered'

interface Props {
  exam: WrittenExam
  startedAt: string
  answers: Record<string, string>
  onChange(key: string, value: string): void
  onSubmit(): void
  /** author preview: nothing is saved, and the marking scheme and model answer can be shown beside each part */
  preview?: boolean
  saved?: string
}

/** The written exam as the student sees it: question text, then for each part a live preview directly above the answer box. */
export function WrittenTake({ exam, startedAt, answers, onChange, onSubmit, preview, saved }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const empty = exam.questions.reduce((n, q) => n + q.parts.filter((p) => !(answers[answerKey(q.id, p.id)] ?? '').trim()).length, 0)

  return (
    <>
      <div className="exam-bar">
        <b>{exam.title}</b>
        <Timer startedAt={startedAt} minutes={exam.durationMinutes} />
        <span className="muted small">{exam.totalMarks} marks · soft limit {exam.durationMinutes} min, no auto-submit</span>
        <span className="grow" />
        {saved && <span className="muted small" role="status">{saved}</span>}
        {preview && (
          <label className="small"><input type="checkbox" checked={showKey} onChange={(e) => setShowKey(e.target.checked)} /> Show marking scheme and model answers</label>
        )}
        {!confirm
          ? <button className="primary" onClick={() => setConfirm(true)}>{preview ? 'Try the submit step' : 'Submit exam'}</button>
          : (
            <span className="inline-confirm">
              {empty > 0 ? `${empty} part(s) are empty. ` : ''}Submit{preview ? ' (preview: nothing is saved)' : ' for marking'}?{' '}
              <button className="primary" onClick={() => { setConfirm(false); onSubmit() }}>Yes, submit</button>{' '}
              <button onClick={() => setConfirm(false)}>Keep writing</button>
            </span>
          )}
      </div>

      <section className="card"><Md text={exam.instructions} preamble={exam.preamble} /></section>

      {exam.questions.map((q, qi) => (
        <section className="card exam-q" key={q.id} aria-labelledby={`h-${q.id}`}>
          <h2 id={`h-${q.id}`}>Question {qi + 1}: {q.title} <span className="muted small">[{q.marks} marks]</span></h2>
          <Md text={q.text} preamble={exam.preamble} />
          {q.parts.map((p) => {
            const key = answerKey(q.id, p.id)
            const value = answers[key] ?? ''
            return (
              <div className="exam-part" key={p.id}>
                <h3>({p.id}) <span className="muted small">[{p.marks} mark{p.marks === 1 ? '' : 's'}{p.type ? ` · ${p.type}` : ''}]</span></h3>
                <Md text={p.text} preamble={exam.preamble} />
                <label className="sr-only" htmlFor={`a-${key}`}>Answer to question {qi + 1}({p.id}), typed in LaTeX</label>
                <LatexPreview source={value} preamble={exam.preamble} />
                <textarea id={`a-${key}`} className="latex-in" rows={Math.max(6, Math.min(24, value.split('\n').length + 2))} spellCheck={false}
                  placeholder="Type your answer in LaTeX, e.g.  By Bayes' theorem, $\pi(\theta\mid y)\propto \dots$"
                  value={value} onChange={(e) => onChange(key, e.target.value)} />
                {preview && showKey && (
                  <details open className="key">
                    <summary>Marking scheme and model answer (author view)</summary>
                    <ol>{p.markingScheme.map((s, i) => <li key={i}><b>[{s.marks}]</b> <Md text={s.step} preamble={exam.preamble} className="inline" /></li>)}</ol>
                    <Md text={p.modelAnswer} preamble={exam.preamble} />
                  </details>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </>
  )
}
