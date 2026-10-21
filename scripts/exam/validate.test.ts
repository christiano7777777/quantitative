import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { CodingExam, WrittenExam } from '../../src/exam/types'
import { subprocessBackend } from './backend'
import { validateDir, type FileReport } from './validate'

vi.setConfig({ testTimeout: 240_000, hookTimeout: 60_000 })

const root = resolve(__dirname, '..', '..')
const topicsFile = join(root, 'src', 'data', 'topics.json')
const hasPython = spawnSync(process.env.EXAM_PYTHON ?? 'python', ['-c', 'import numpy, scipy']).status === 0

let tmp = ''
beforeAll(() => { tmp = mkdtempSync(join(tmpdir(), 'exam-validate-')) })
afterAll(() => { rmSync(tmp, { recursive: true, force: true }) })

const readJson = <T>(f: string) => JSON.parse(readFileSync(join(root, 'content', 'exams', f), 'utf8')) as T
let n = 0

/** copies the schemas to a scratch directory, puts the given files in it and validates just those */
async function run(files: Record<string, object>, robust = 0, python = true): Promise<FileReport[]> {
  const dir = join(tmp, `d${n++}`)
  cpSync(join(root, 'content', 'exams', 'schema'), join(dir, 'schema'), { recursive: true })
  for (const [name, data] of Object.entries(files)) writeFileSync(join(dir, name), JSON.stringify(data))
  return validateDir({ dir, topicsFile, topics: [], robust, fill: false, backend: python ? subprocessBackend : null })
}

const errors = (r: FileReport[], file: string) => r.find((x) => x.file === file)!.issues.filter((i) => i.level === 'error').map((i) => `${i.where}: ${i.message}`)

describe('written files', () => {
  const good = () => readJson<WrittenExam>('bay.written.json')

  it('accepts the Bayesian placeholder', async () => {
    expect(errors(await run({ 'bay.written.json': good() }, 0, false), 'bay.written.json')).toEqual([])
  })

  it('rejects scheme marks that do not add up to the part', async () => {
    const e = good(); e.questions[0].parts[0].markingScheme[0].marks = 2
    expect(errors(await run({ 'bay.written.json': e }, 0, false), 'bay.written.json').join('\n')).toMatch(/scheme steps add up to 6, but the part is worth 5/)
  })

  it('rejects part marks and total marks that do not add up', async () => {
    const e = good(); e.questions[0].parts[3].marks = 4; e.totalMarks = 25
    const msg = errors(await run({ 'bay.written.json': e }, 0, false), 'bay.written.json').join('\n')
    expect(msg).toMatch(/part marks add up to 19, but the question says 20/)
    expect(msg).toMatch(/question marks add up to 20, but totalMarks is 25/)
  })

  it('rejects a formula that KaTeX cannot render, naming it', async () => {
    const e = good(); e.questions[0].parts[1].modelAnswer += '\n$\\frac{1}{$ and $\\notacommand x$'
    const msg = errors(await run({ 'bay.written.json': e }, 0, false), 'bay.written.json').join('\n')
    expect(msg).toMatch(/q1\.b\.modelAnswer: formula does not render/)
    expect(msg).toMatch(/notacommand/)
  })

  it('rejects a schema violation (missing field, unknown field) and a wrong topic id', async () => {
    const e = good() as unknown as Record<string, unknown>
    delete e.instructions; e.surprise = 1
    const msg = errors(await run({ 'bay.written.json': e as unknown as object }, 0, false), 'bay.written.json').join('\n')
    expect(msg).toMatch(/instructions/)
    expect(msg).toMatch(/surprise/)
    const wrong = good(); wrong.topicId = 'inf'
    expect(errors(await run({ 'bay.written.json': wrong }, 0, false), 'bay.written.json').join('\n')).toMatch(/does not match the file name/)
  })

  it('rejects a file for a topic that does not exist', async () => {
    const e = good(); e.topicId = 'zzz'
    expect(errors(await run({ 'zzz.written.json': e }, 0, false), 'zzz.written.json').join('\n')).toMatch(/not a topic id/)
  })
})

describe.skipIf(!hasPython)('coding files (runs Python)', () => {
  const good = () => readJson<CodingExam>('bay.coding.json')

  it('accepts the Bayesian placeholder: reference passes every visible and hidden test, also on other seeds', async () => {
    const r = await run({ 'bay.coding.json': good() }, 2)
    expect(errors(r, 'bay.coding.json')).toEqual([])
    expect(r[0].notes.join('\n')).toMatch(/reference passes 5\/5 tests/)
    expect(r[0].notes.join('\n')).toMatch(/oracle agrees/)
  })

  it('FAILS when the reference solution is wrong (off-by-one burn-in changes the output length)', async () => {
    const e = good(); e.questions[0].referenceSolution = e.questions[0].referenceSolution.replace('draws[BURN_IN:]', 'draws[BURN_IN + 1:]')
    expect(errors(await run({ 'bay.coding.json': e }), 'bay.coding.json').join('\n')).toMatch(/REFERENCE SOLUTION FAILS: expected 18000 values, got 17999/)
  })

  it('FAILS when the reference solution has a statistical bug (wrong prior sign)', async () => {
    const e = good(); e.questions[0].referenceSolution = e.questions[0].referenceSolution.replace('logprior = -0.5', 'logprior = 0.5')
    expect(errors(await run({ 'bay.coding.json': e }), 'bay.coding.json').join('\n')).toMatch(/REFERENCE SOLUTION FAILS: quantiles/)
  })

  it('FAILS when the reference crashes or forgets to return', async () => {
    const e = good(); e.questions[0].referenceSolution = e.questions[0].referenceSolution.replace('    return draws[BURN_IN:]', '    draws[BURN_IN:]')
    expect(errors(await run({ 'bay.coding.json': e }), 'bay.coding.json').join('\n')).toMatch(/returned None/)
  })

  it('FAILS when a stochastic tolerance is too tight for the Monte Carlo noise (other seeds fail)', async () => {
    const e = good()
    for (const t of [...e.questions[0].visibleTests, ...e.questions[0].hiddenTests]) if (t.compare.type === 'quantiles') t.compare.abs = 0.0005
    const msg = errors(await run({ 'bay.coding.json': e }, 4), 'bay.coding.json').join('\n')
    expect(msg).toMatch(/tolerance|REFERENCE SOLUTION FAILS/)
  })

  it('FAILS when the oracle disagrees with an expected value', async () => {
    const e = good(); (e.questions[0].hiddenTests[0].expected as number[])[1] += 0.1
    const msg = errors(await run({ 'bay.coding.json': e }), 'bay.coding.json').join('\n')
    expect(msg).toMatch(/h1/)
  })

  it('FAILS on forbidden imports and calls in a reference solution, without running them', async () => {
    const e = good(); e.questions[0].referenceSolution = 'import os\n' + e.questions[0].referenceSolution + '\nopen("x")\n'
    const msg = errors(await run({ 'bay.coding.json': e }), 'bay.coding.json').join('\n')
    expect(msg).toMatch(/import of 'os' is not allowed/)
    expect(msg).toMatch(/use of 'open' is not allowed/)
  })

  it('FAILS on an infinite loop in the reference (timeout) instead of hanging', async () => {
    const e = good(); const q = e.questions[0]
    q.timeLimitSeconds = 1
    q.referenceSolution = q.referenceSolution.replace('    p = P0', '    while True:\n        pass\n    p = P0')
    const t0 = Date.now()
    const msg = errors(await run({ 'bay.coding.json': e }), 'bay.coding.json').join('\n')
    expect(msg).toMatch(/timed out/)
    expect(Date.now() - t0).toBeLessThan(90_000)
  }, 120_000)

  it('FAILS when the skeleton already passes every test, and when expected is missing', async () => {
    const e = good(); e.questions[0].skeleton = e.questions[0].referenceSolution
    expect(errors(await run({ 'bay.coding.json': e }), 'bay.coding.json').join('\n')).toMatch(/identical to the reference/)
    const f = good(); f.questions[0].visibleTests[0].expected = '$FROM_REFERENCE'
    expect(errors(await run({ 'bay.coding.json': f }), 'bay.coding.json').join('\n')).toMatch(/--fill-expected/)
  })

  it('rejects marks that do not add up and a missing main function', async () => {
    const e = good(); e.totalMarks = 12; e.questions[0].functions.forEach((f) => { delete f.main })
    const msg = errors(await run({ 'bay.coding.json': e }, 0, false), 'bay.coding.json').join('\n')
    expect(msg).toMatch(/totalMarks is 12/)
    expect(msg).toMatch(/exactly one function must have main/)
  })
})

describe('the real content directory', () => {
  it.skipIf(!hasPython)('validates with no errors', async () => {
    const r = await validateDir({ dir: join(root, 'content', 'exams'), topicsFile, topics: [], robust: 1, fill: false, backend: subprocessBackend })
    const bad = r.flatMap((x) => x.issues.filter((i) => i.level === 'error').map((i) => `${x.file}: ${i.message}`))
    expect(bad).toEqual([])
  }, 300_000)
})
