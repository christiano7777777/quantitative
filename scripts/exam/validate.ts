// The checks behind `npm run validate-exams`: JSON schema, marks arithmetic, formula rendering, and for coding
// questions the real thing: the reference solution is executed against every visible and hidden test.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Ajv from 'ajv'
import { checkCodingStatic, checkWritten, isStochastic, type Issue } from '../../src/exam/checks.ts'
import { examConfig } from '../../src/exam/config.ts'
import { FROM_REFERENCE } from '../../src/exam/types.ts'
import type { CodingExam, CodingQuestion, CodingTest, WrittenExam } from '../../src/exam/types.ts'
import type { Backend, RunRequest } from './backend.ts'

export interface Options {
  /** directory with <topic>.written.json, <topic>.coding.json, schema/ and exams.config.json */
  dir: string
  topicsFile: string
  /** only these topic ids; empty = all */
  topics: string[]
  /** extra seeds per stochastic test to prove the reference passes by design, not by luck of one seed */
  robust: number
  /** compute `expected` for tests marked "$FROM_REFERENCE" and write the file */
  fill: boolean
  backend: Backend | null
}

export interface FileReport { file: string; issues: Issue[]; notes: string[] }

const error = (where: string, message: string): Issue => ({ level: 'error', where, message })
const warning = (where: string, message: string): Issue => ({ level: 'warning', where, message })

// ---- JSON schema ----

type AjvCtor = new (o: object) => { compile(s: object): ((d: unknown) => boolean) & { errors?: { instancePath: string; message?: string; params: object }[] | null } }

function compileSchemas(dir: string) {
  const Ctor = ((Ajv as unknown as { default?: AjvCtor }).default ?? Ajv) as unknown as AjvCtor
  const ajv = new Ctor({ allErrors: true, strict: false })
  const read = (n: string) => JSON.parse(readFileSync(join(dir, 'schema', n), 'utf8'))
  return { written: ajv.compile(read('written.schema.json')), coding: ajv.compile(read('coding.schema.json')) }
}

function schemaIssues(where: string, validate: ReturnType<typeof compileSchemas>['written'], data: unknown): Issue[] {
  if (validate(data)) return []
  return (validate.errors ?? []).slice(0, 12).map((e) =>
    error(where, `${e.instancePath || '(root)'} ${e.message ?? 'is invalid'}${'additionalProperty' in e.params ? `: ${(e.params as { additionalProperty: string }).additionalProperty}` : ''}`))
}

// ---- coding runtime ----

const sig6 = (v: unknown): unknown => (typeof v === 'number' ? Number(v.toPrecision(6)) : Array.isArray(v) ? v.map(sig6) : v)

const caseOf = (t: CodingTest, expected: unknown = t.expected): RunRequest['cases'][number] => ({ id: t.id, input: t.input, seed: t.seed, compare: t.compare, expected })

/** the tolerance of the test's own comparison, as a numeric comparison of two expected-value lists (for the oracle check) */
const oracleCompare = (c: CodingTest['compare']): CodingTest['compare'] =>
  c.type === 'quantiles' || c.type === 'summary' ? { type: 'numeric', abs: c.abs, rel: c.rel } : c

async function checkCodingRuntime(q: CodingQuestion, backend: Backend, opts: Options, out: Issue[], notes: string[], topic: string): Promise<number> {
  const at = (...p: string[]) => `${topic}.coding ${[q.id, ...p].join('.')}`
  const main = q.functions.find((f) => f.main)?.name
  if (!main) return 0 // reported by the static check
  const all = [...q.visibleTests, ...q.hiddenTests]
  const limitMs = (q.timeLimitSeconds ?? examConfig.defaultTimeLimitSeconds) * 1000
  const budget = (n: number) => (n + 2) * limitMs + 30_000
  let filled = 0

  // 1. static safety check and function names
  const lint = await backend.lint([q.helperCode, q.skeleton, q.referenceSolution, q.oracleSolution ?? ''])
  const labels = ['helperCode', 'skeleton', 'referenceSolution', 'oracleSolution']
  let unsafe = false
  lint.forEach((l, i) => {
    for (const p of l.problems) { out.push(error(at(labels[i]), p)); unsafe = true }
  })
  if (unsafe) return 0
  for (const f of q.functions) {
    if (!lint[1].defs.includes(f.name)) out.push(error(at('skeleton'), `the skeleton does not define ${f.name}()`))
    if (!lint[2].defs.includes(f.name)) out.push(error(at('referenceSolution'), `the reference solution does not define ${f.name}()`))
  }
  if (q.oracleSolution && !lint[3].defs.includes('expected_value')) out.push(error(at('oracleSolution'), 'must define expected_value(**input)'))

  const base = { helper: q.helperCode, main, rngArg: q.rngArg }

  // 2. fill "$FROM_REFERENCE" expectations (oracle first, otherwise the reference solution)
  const pending = all.filter((t) => t.expected === FROM_REFERENCE)
  if (pending.length && opts.fill) {
    if (q.oracleSolution) {
      const res = await backend.output({ ...base, main: 'expected_value', rngArg: undefined, student: q.oracleSolution, cases: pending.map((t) => caseOf(t)) }, budget(pending.length))
      pending.forEach((t, i) => {
        if (res[i].ok) { t.expected = sig6(res[i].output); filled++ } else out.push(error(at(t.id), `oracle failed while filling expected: ${res[i].message}`))
      })
    } else {
      const res = await backend.output({ ...base, student: q.referenceSolution, cases: pending.map((t) => caseOf(t)) }, budget(pending.length))
      const ok = pending.filter((_, i) => res[i].ok)
      const sums = ok.length ? await backend.summarise(ok.map((t) => res[pending.indexOf(t)].output), ok.map((t) => t.compare)) : []
      pending.forEach((t, i) => { if (!res[i].ok) out.push(error(at(t.id), `reference failed while filling expected: ${res[i].message}`)) })
      ok.forEach((t, i) => { t.expected = sig6(sums[i]); filled++ })
    }
    notes.push(`${q.id}: filled ${filled} expected value(s) from the ${q.oracleSolution ? 'oracle' : 'reference solution'}`)
  } else if (pending.length) {
    out.push(error(at(), `${pending.length} test(s) still have expected "${FROM_REFERENCE}": run  npm run validate-exams -- --fill-expected`))
    return 0
  }

  // 3. the reference must pass every visible and hidden test
  const ref = await backend.run({ ...base, student: q.referenceSolution, cases: all.map((t) => caseOf(t)) }, budget(all.length))
  const failed = ref.filter((r) => !r.passed)
  for (const r of failed) out.push(error(at(r.id), `REFERENCE SOLUTION FAILS: ${r.message}`))
  notes.push(`${q.id}: reference passes ${ref.length - failed.length}/${ref.length} tests (${q.visibleTests.length} visible, ${q.hiddenTests.length} hidden)`)

  // 4. stochastic tests: other seeds must pass too, otherwise the tolerance is tuned to one seed
  const stoch = all.filter(isStochastic)
  if (opts.robust > 0 && stoch.length && !failed.length) {
    const seeds = Array.from({ length: opts.robust }, (_, k) => k + 1)
    const fails: string[] = []
    for (const k of seeds) {
      const res = await backend.run({ ...base, student: q.referenceSolution, cases: stoch.map((t) => ({ ...caseOf(t), seed: t.seed + 7919 * k })) }, budget(stoch.length))
      res.forEach((r) => { if (!r.passed) fails.push(`${r.id} seed+${7919 * k}: ${r.message}`) })
    }
    const total = seeds.length * stoch.length
    if (fails.length) out.push(error(at(), `reference fails ${fails.length}/${total} stochastic runs on other seeds, so the tolerance is too tight for the Monte Carlo noise (first: ${fails[0]})`))
    else notes.push(`${q.id}: reference passes all ${total} stochastic runs on ${seeds.length} other seeds`)
  }

  // 5. the skeleton must not earn marks by itself
  const skel = await backend.run({ ...base, student: q.skeleton, cases: all.map((t) => caseOf(t)) }, budget(all.length))
  const free = skel.filter((r) => r.passed).length
  if (free === all.length) out.push(error(at('skeleton'), 'the skeleton passes every test without any work'))
  else if (free > 0) out.push(warning(at('skeleton'), `the untouched skeleton already passes ${free}/${all.length} test(s)`))

  // 6. the oracle (an independent second computation of the expected values) must agree with `expected`
  if (q.oracleSolution && !failed.length) {
    const res = await backend.run({ ...base, main: 'expected_value', rngArg: undefined, student: q.oracleSolution, cases: all.map((t) => ({ ...caseOf(t), compare: oracleCompare(t.compare) })) }, budget(all.length))
    for (const r of res.filter((x) => !x.passed)) out.push(error(at(r.id), `oracle disagrees with the expected value: ${r.message}`))
    if (res.every((r) => r.passed)) notes.push(`${q.id}: oracle agrees with all ${res.length} expected values`)
  }
  return filled
}

// ---- files ----

export async function validateDir(opts: Options): Promise<FileReport[]> {
  const reports: FileReport[] = []
  const schemas = compileSchemas(opts.dir)
  const topics = JSON.parse(readFileSync(opts.topicsFile, 'utf8')) as { id: string; examPhase?: number | null; examWeights?: { written: number; coding: number } }[]
  const topicIds = new Set(topics.map((t) => t.id))
  const files = readdirSync(opts.dir).filter((f) => /\.json$/.test(f) && f !== 'exams.config.json').sort()

  for (const f of files) {
    const m = /^([a-z0-9]+)\.(written|coding)\.json$/.exec(f)
    const issues: Issue[] = [], notes: string[] = []
    const rep: FileReport = { file: f, issues, notes }
    reports.push(rep)
    if (!m) { issues.push(error(f, 'file name must be <topic-id>.written.json or <topic-id>.coding.json')); continue }
    const [, topic, kind] = m
    if (opts.topics.length && !opts.topics.includes(topic)) { reports.pop(); continue }
    if (!topicIds.has(topic)) issues.push(error(f, `"${topic}" is not a topic id in src/data/topics.json`))
    const t = topics.find((x) => x.id === topic)
    if (t && (t.examPhase ?? null) === null) issues.push(warning(f, 'this topic has examPhase null, so the exam will not show in the app'))

    let data: unknown
    try { data = JSON.parse(readFileSync(join(opts.dir, f), 'utf8')) } catch (e) { issues.push(error(f, `not valid JSON: ${(e as Error).message}`)); continue }

    if (kind === 'written') {
      issues.push(...schemaIssues(f, schemas.written, data))
      if (!issues.some((i) => i.level === 'error')) issues.push(...checkWritten(data as WrittenExam, topic))
      if (t?.examWeights && t.examWeights.written === 0) issues.push(warning(f, 'examWeights give the written part weight 0'))
    } else {
      issues.push(...schemaIssues(f, schemas.coding, data))
      if (issues.some((i) => i.level === 'error')) continue
      const exam = data as CodingExam
      issues.push(...checkCodingStatic(exam, topic))
      if (t?.examWeights && t.examWeights.coding === 0) issues.push(warning(f, 'examWeights give the coding part weight 0, so this file is never used'))
      if (!opts.backend) { notes.push('Python checks skipped'); continue }
      let filled = 0
      for (const q of exam.questions) {
        try { filled += await checkCodingRuntime(q, opts.backend, opts, issues, notes, topic) } catch (e) { issues.push(error(`${topic}.coding ${q.id}`, (e as Error).message)) }
      }
      if (filled) writeFileSync(join(opts.dir, f), JSON.stringify(exam, null, 2) + '\n')
    }
  }

  // cross-checks with the topic list and the phase config
  const cfgPath = join(opts.dir, 'exams.config.json')
  const have = new Set(files.map((x) => x.replace(/\.json$/, '')))
  if (existsSync(cfgPath) && !opts.topics.length) {
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf8')) as { enabledPhases: number[] }
    const extra: Issue[] = []
    for (const t of topics) {
      if (t.examPhase == null || !cfg.enabledPhases.includes(t.examPhase)) continue
      const needCoding = (t.examWeights?.coding ?? 1) > 0
      if (!have.has(`${t.id}.written`)) extra.push(warning('exams.config.json', `phase ${t.examPhase} is enabled but ${t.id}.written.json is missing (the app shows "coming soon")`))
      if (needCoding && !have.has(`${t.id}.coding`)) extra.push(warning('exams.config.json', `phase ${t.examPhase} is enabled but ${t.id}.coding.json is missing (the app shows "coming soon")`))
    }
    if (extra.length) reports.push({ file: 'exams.config.json', issues: extra, notes: [] })
  }
  return reports
}
