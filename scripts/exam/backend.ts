// Where the validator runs Python: a host subprocess (default) or real Pyodide under Node (--pyodide), the same
// runtime the student's browser uses. Both execute src/exam/harness.py, so the comparison logic is identical.

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CodingTest } from '../../src/exam/types.ts'

const here = dirname(fileURLToPath(import.meta.url))
const harnessDir = join(here, '..', '..', 'src', 'exam')

export interface CaseResult { id: string; passed: boolean; message: string; got: unknown; stdout: string }
export interface OutputResult { ok: boolean; output?: unknown; message?: string }
export interface LintResult { problems: string[]; defs: string[] }

export interface RunRequest {
  helper: string
  student: string
  main: string
  rngArg?: string
  cases: Pick<CodingTest, 'id' | 'input' | 'seed' | 'compare' | 'expected'>[]
}

export interface Backend {
  name: string
  lint(sources: string[]): Promise<LintResult[]>
  run(req: RunRequest, timeoutMs: number): Promise<CaseResult[]>
  output(req: RunRequest, timeoutMs: number): Promise<OutputResult[]>
  summarise(outputs: unknown[], compares: CodingTest['compare'][]): Promise<unknown[]>
  close(): Promise<void>
}

const MARK = '@@EXAM-JSON@@'

function call(req: object, timeoutMs: number): Record<string, unknown> {
  const python = process.env.EXAM_PYTHON ?? process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3')
  const r = spawnSync(python, ['-I', join(harnessDir, 'harness_cli.py')], {
    input: JSON.stringify(req), encoding: 'utf8', timeout: timeoutMs, maxBuffer: 256 * 1024 * 1024,
  })
  if (r.error) {
    const timedOut = (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT'
    throw new Error(timedOut ? `Python timed out after ${Math.round(timeoutMs / 1000)} s (infinite loop or too slow?)` : `could not start "${python}": ${r.error.message}`)
  }
  const i = r.stdout.lastIndexOf(MARK)
  if (r.status !== 0 || i < 0) throw new Error(`Python failed (exit ${r.status}): ${(r.stderr || r.stdout).trim().slice(-800)}`)
  return JSON.parse(r.stdout.slice(i + MARK.length))
}

export const subprocessBackend: Backend = {
  name: 'python subprocess',
  async lint(sources) { return call({ op: 'lint', sources }, 30_000).lint as LintResult[] },
  async run(req, timeoutMs) { return call({ op: 'run', ...req }, timeoutMs).results as CaseResult[] },
  async output(req, timeoutMs) { return call({ op: 'output', ...req }, timeoutMs).results as OutputResult[] },
  async summarise(outputs, compares) { return call({ op: 'summarise', outputs, compares }, 30_000).summary as unknown[] },
  async close() {},
}

/** Pyodide under Node: needs network the first time (numpy and scipy are downloaded and cached in node_modules/pyodide). */
export async function pyodideBackend(): Promise<Backend> {
  const { loadPyodide } = await import('pyodide')
  const py = await loadPyodide()
  await py.loadPackage(['numpy', 'scipy'])
  py.runPython(readFileSync(join(harnessDir, 'harness.py'), 'utf8'))
  const g = py.globals
  const json = (name: string, ...args: unknown[]): unknown => JSON.parse(g.get(name)(...args))
  // lint and summarise are small Python helpers defined here so the harness API stays one file
  py.runPython(`
import json as _json
def _lint_json(src_json):
    return _json.dumps([lint(s) for s in _json.loads(src_json)])
def _summarise_json(req_json):
    r = _json.loads(req_json)
    return _json.dumps([summarise(o, c) for o, c in zip(r['outputs'], r['compares'])])
`)
  return {
    name: 'pyodide',
    async lint(sources) { return json('_lint_json', JSON.stringify(sources)) as LintResult[] },
    async run(req) {
      return req.cases.map((c) => json('run_case_json', req.helper, req.student, req.main, req.rngArg ?? '', JSON.stringify(c)) as CaseResult)
    },
    async output(req) {
      return req.cases.map((c) => json('run_output_json', req.helper, req.student, req.main, req.rngArg ?? '', JSON.stringify(c)) as OutputResult)
    },
    async summarise(outputs, compares) { return json('_summarise_json', JSON.stringify({ outputs, compares })) as unknown[] },
    async close() {},
  }
}
