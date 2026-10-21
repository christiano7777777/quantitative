// Runs student Python against test cases. The real runner (Pyodide in a Web Worker) is created lazily; the interface lets
// tests and the UI use a fake.

import { examConfig } from '../config'
import harnessSource from '../harness.py?raw'
import type { CodingTest } from '../types'

export interface CaseResult { id: string; passed: boolean; message: string; got?: unknown; stdout?: string }

export interface RunRequest {
  helper: string
  student: string
  main: string
  rngArg?: string
  timeLimitMs: number
  cases: Pick<CodingTest, 'id' | 'input' | 'seed' | 'compare' | 'expected'>[]
}

export interface CodeRunner {
  /** Runs the cases one by one; `onResult` fires after each so the UI can show progress. Never rejects for a failing test. */
  run(req: RunRequest, onResult?: (r: CaseResult, done: number, total: number) => void): Promise<CaseResult[]>
  /** loading text while Python starts, '' once ready */
  onStatus(cb: (text: string) => void): void
  dispose(): void
}

const INIT_TIMEOUT_MS = 180_000

export const pyodideIndexUrl = (v = examConfig.pyodideVersion) => `https://cdn.jsdelivr.net/pyodide/v${v}/full/`

export function createPyodideRunner(): CodeRunner {
  let worker: Worker | null = null
  let ready: Promise<Worker> | null = null
  let status: (t: string) => void = () => {}
  let seq = 0
  let abortInit: (() => void) | null = null

  const spawn = (): Promise<Worker> => {
    const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    worker = w
    return new Promise<Worker>((resolve, reject) => {
      abortInit = () => reject(new Error('The Python session was closed.'))
      const timer = setTimeout(() => { w.terminate(); reject(new Error('Python did not start within 3 minutes. Check your connection and try again.')) }, INIT_TIMEOUT_MS)
      w.addEventListener('message', function onMsg(ev: MessageEvent) {
        const m = ev.data as { type: string; text?: string; message?: string }
        if (m.type === 'status') status(m.text ?? '')
        else if (m.type === 'ready') { clearTimeout(timer); w.removeEventListener('message', onMsg); status(''); resolve(w) }
        else if (m.type === 'fatal') { clearTimeout(timer); w.terminate(); reject(new Error(`Python failed to start: ${m.message}`)) }
      })
      w.addEventListener('error', (e) => { clearTimeout(timer); reject(new Error(`Python worker error: ${e.message}`)) })
      w.postMessage({ type: 'init', indexURL: pyodideIndexUrl(), harness: harnessSource })
    })
  }
  const get = () => (ready ??= spawn().catch((e) => { ready = null; throw e }))

  const runOne = (w: Worker, req: RunRequest, c: RunRequest['cases'][number]) =>
    new Promise<CaseResult | 'timeout'>((resolve) => {
      const id = ++seq
      const timer = setTimeout(() => { w.removeEventListener('message', onMsg); resolve('timeout') }, req.timeLimitMs)
      function onMsg(ev: MessageEvent) {
        const m = ev.data as { type: string; id?: number; json?: string; message?: string }
        if (m.type === 'result' && m.id === id) { clearTimeout(timer); w.removeEventListener('message', onMsg); resolve(JSON.parse(m.json!) as CaseResult) }
        else if (m.type === 'fatal') { clearTimeout(timer); w.removeEventListener('message', onMsg); resolve({ id: c.id, passed: false, message: `Internal error: ${m.message}` }) }
      }
      w.addEventListener('message', onMsg)
      w.postMessage({ type: 'run', id, helper: req.helper, student: req.student, main: req.main, rngArg: req.rngArg ?? '', caseJson: JSON.stringify(c) })
    })

  return {
    onStatus(cb) { status = cb },
    async run(req, onResult) {
      const out: CaseResult[] = []
      for (const [i, c] of req.cases.entries()) {
        let w: Worker
        try { w = await get() } catch (e) {
          const r = { id: c.id, passed: false, message: (e as Error).message }
          out.push(r); onResult?.(r, i + 1, req.cases.length); continue
        }
        let r = await runOne(w, req, c)
        if (r === 'timeout') {
          // the only way to stop an infinite loop is to kill the worker; the next test starts a fresh one
          w.terminate(); worker = null; ready = null
          r = { id: c.id, passed: false, message: `Timed out after ${Math.round(req.timeLimitMs / 1000)} s (an infinite loop or a much too slow algorithm?)` }
        }
        r.id = c.id
        out.push(r); onResult?.(r, i + 1, req.cases.length)
      }
      return out
    },
    dispose() { abortInit?.(); abortInit = null; worker?.terminate(); worker = null; ready = null },
  }
}
