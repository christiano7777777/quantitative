import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { careers, domainLabels, domainOrder, topics } from '../data'
import { useApp } from '../context'
import { careerProgress, careerSummary, layout, statusOf } from '../lib/graph'
import { hasTest } from '../lib/content'
import { examEnabled } from '../exam/phases'

const W = 190, H = 30, GX = 52, GY = 10, PX = 20, PY = 36

export function Tree() {
  const { graph, passed, dev, exams } = useApp()
  const nav = useNavigate()
  const [careerId, setCareerId] = useState('')
  const pos = useMemo(() => layout(graph, domainOrder), [graph])

  const maxCol = Math.max(...[...pos.values()].map((p) => p.col))
  const maxRow = Math.max(...[...pos.values()].map((p) => p.row))
  const width = PX * 2 + (maxCol + 1) * W + maxCol * GX
  const height = PY + (maxRow + 1) * (H + GY) + PX
  const xy = (id: string) => {
    const p = pos.get(id)!
    return { x: PX + p.col * (W + GX), y: PY + p.row * (H + GY) }
  }

  const career = careers.find((c) => c.id === careerId)
  const summary = career ? careerSummary(graph, career) : null
  const required = new Set(career?.required)
  const bonus = new Set(career?.bonus)
  const inCareer = (id: string) => !career || summary!.ids.has(id) || bonus.has(id)

  const counts = { passed: 0, open: 0, locked: 0 }
  topics.forEach((t) => counts[statusOf(graph, t.id, passed, dev)]++)

  return (
    <>
      <h1>Skill tree</h1>
      <p className="muted">
        {topics.length} topics. A topic opens when all its prerequisites are passed. Click a topic to see its test.
      </p>
      <div className="controls">
        <label>
          Career{' '}
          <select value={careerId} onChange={(e) => setCareerId(e.target.value)}>
            <option value="">All topics</option>
            {careers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        {summary && (
          <span className="stat">
            <b>{summary.topics}</b> topics needed (required + all prerequisites) · <b>{summary.hours}</b> h
            ({summary.lectures} lectures × 3 h) · {bonus.size} bonus topics
          </span>
        )}
        <span className="muted small">
          {counts.passed} passed · {counts.open} open · {counts.locked} locked
        </span>
      </div>
      <section className="careers" aria-label="Career progress">
        {careers.map((c) => {
          const p = careerProgress(graph, c, passed, hasTest)
          return (
            <button key={c.id} type="button" className={`career${c.id === careerId ? ' on' : ''}`}
              onClick={() => setCareerId(c.id === careerId ? '' : c.id)} aria-pressed={c.id === careerId}>
              <span className="ctitle"><b>{c.label}</b><span>{p.percent}%</span></span>
              <span className="bar" role="progressbar" aria-label={`${c.label} progress`}
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent}>
                <span className="fill" style={{ width: `${p.percent}%` }} />
              </span>
              <span className="csub">
                {p.required.passed}/{p.required.total} required · {p.path.passed}/{p.path.total} on path · {p.bonusNeeded.passed}/{p.bonusNeeded.total} bonus needed ({p.bonus.total} to choose from, {c.bonus.filter(hasTest).length} with tests)
              </span>
              <span className="csub">{p.hours.passed}/{p.hours.total} h · tests ready for {p.testable}/{p.path.total} path topics</span>
            </button>
          )
        })}
      </section>
      <div className="legend">
        {domainOrder.map((d) => (
          <span key={d}><i className="sw" style={{ background: `var(--d-${d})` }} />{domainLabels[d]}</span>
        ))}
        <span><i className="sw ring req" />required</span>
        <span><i className="sw ring bonus" />bonus</span>
        <span>✓ passed · 🔒 locked · dashed = no direct university course</span>
      </div>

      <div className="graph">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Prerequisite graph">
          {Array.from({ length: maxCol + 1 }, (_, c) => (
            <text key={c} x={PX + c * (W + GX)} y={20} className="colhead">STAGE {c + 1}</text>
          ))}
          <g>
            {topics.flatMap((t) =>
              t.prerequisites.map((p) => {
                const a = xy(p), b = xy(t.id)
                const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2
                const dx = Math.max(30, (x2 - x1) / 2)
                const dim = career && !(inCareer(p) && inCareer(t.id))
                return (
                  <path key={`${p}>${t.id}`} className={`edge${dim ? ' dim' : ''}`}
                    d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`} />
                )
              }),
            )}
          </g>
          <g>
            {topics.map((t) => {
              const { x, y } = xy(t.id)
              const st = statusOf(graph, t.id, passed, dev)
              const cls = ['node', st, t.starred ? 'star' : '', required.has(t.id) ? 'req' : bonus.has(t.id) ? 'bonus' : '',
                career && !inCareer(t.id) ? 'dim' : ''].join(' ')
              const go = () => nav(`/topic/${t.id}`)
              // Big Exam grade, once both parts are done; the node keeps its plain tick otherwise
              const grade = examEnabled(t) ? exams.summary(t.id, t.examWeights).total?.grade : undefined
              return (
                <g key={t.id} className={cls} transform={`translate(${x},${y})`} tabIndex={0} role="link"
                  aria-label={`${t.label}, ${st}${hasTest(t.id) ? '' : ', test coming soon'}${grade ? `, big exam grade ${grade}` : ''}`}
                  onClick={go} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } }}>
                  <rect className="box" width={W} height={H} rx={5} />
                  <rect width={5} height={H} rx={2} fill={`var(--d-${t.domain})`} />
                  <text x={13} y={H / 2 + 4}>{t.label}</text>
                  <text x={W - 8} y={H / 2 + 4} textAnchor="end" className="mark">
                    {grade ?? (st === 'passed' ? '✓' : st === 'locked' ? '🔒' : hasTest(t.id) ? '' : '·')}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </>
  )
}
