import { Component, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react'
import { macrosOf, renderLatexAnswer, renderMarkdown, type RenderError } from '../latex'

/** Markdown + LaTeX (question text, model answers, docs). HTML in the source is escaped by renderMarkdown. */
export function Md({ text, preamble, className }: { text: string; preamble?: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(text, macrosOf(preamble)).html, [text, preamble])
  return <div className={`md${className ? ` ${className}` : ''}`} dangerouslySetInnerHTML={{ __html: html }} />
}

class Boundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidUpdate(prev: { resetKey: string }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false }) // try again after the next edit
  }
  render() {
    return this.state.failed ? <p className="tex-err">The preview hit an unexpected error. Your answer is safe; keep typing.</p> : this.props.children
  }
}

function Inner({ source, preamble }: { source: string; preamble?: string }) {
  const deferred = useDeferredValue(source)
  const r = useMemo<{ html: string; errors: RenderError[] }>(() => {
    try {
      return renderLatexAnswer(deferred, macrosOf(preamble))
    } catch (e) { // renderLatexAnswer is built not to throw; this is the last line of defence
      return { html: '', errors: [{ line: 1, message: `preview failed: ${(e as Error).message}`, source: '' }] }
    }
  }, [deferred, preamble])
  return (
    <>
      {r.html ? <div className="md" dangerouslySetInnerHTML={{ __html: r.html }} /> : <p className="muted small">Your typed LaTeX appears here as you write.</p>}
      {r.errors.length > 0 && (
        <ul className="tex-errors" role="alert" aria-label="Formula errors">
          {r.errors.slice(0, 8).map((e, i) => <li key={i}>Line {e.line}: {e.message}</li>)}
          {r.errors.length > 8 && <li>... and {r.errors.length - 8} more</li>}
        </ul>
      )}
    </>
  )
}

/** Live preview of a LaTeX answer. Each formula renders on its own, so one bad line shows an error and nothing else breaks. */
export function LatexPreview({ source, preamble }: { source: string; preamble?: string }) {
  return (
    <div className="xpreview" aria-label="Preview of your answer" aria-live="polite">
      <Boundary resetKey={source}><Inner source={source} preamble={preamble} /></Boundary>
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
export const clock = (ms: number) => {
  const s = Math.floor(Math.abs(ms) / 1000)
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

/** Countdown to a soft limit: it turns red and counts the overrun, and never submits for you. */
export function Timer({ startedAt, minutes }: { startedAt: string; minutes: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = new Date(startedAt).getTime() + minutes * 60_000 - now
  const over = left < 0
  return (
    <span className={`timer${over ? ' over' : ''}`} role="timer" aria-label={over ? 'Time over' : 'Time left'}>
      {over ? `+${clock(left)} over time` : `${clock(left)} left`}
    </span>
  )
}
