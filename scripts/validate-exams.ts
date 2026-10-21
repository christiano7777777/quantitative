// npm run validate-exams [-- options]
//
//   --topic bay[,inf]     only these topics
//   --robust N            reference must also pass N other seeds on stochastic tests (default 8, 0 = off)
//   --fill-expected       compute expected values for tests marked "$FROM_REFERENCE" and write them into the file
//   --pyodide             run the Python checks in Pyodide under Node (the browser's runtime) instead of host Python
//   --no-python           schema and marks checks only
//   --quiet               errors and the summary only
//
// Exit code 1 if any file has an error (a failing reference solution is an error).

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pyodideBackend, subprocessBackend, type Backend } from './exam/backend.ts'
import { validateDir } from './exam/validate.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (n: string) => args.includes(n)
const value = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined }

const paint = (code: number, s: string) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s)
const red = (s: string) => paint(31, s), yellow = (s: string) => paint(33, s), green = (s: string) => paint(32, s), dim = (s: string) => paint(2, s)

async function main() {
  const robustArg = value('--robust')
  const robust = robustArg === undefined ? 8 : Number(robustArg)
  if (!Number.isInteger(robust) || robust < 0) throw new Error('--robust needs a whole number >= 0')
  let backend: Backend | null = null
  if (!flag('--no-python')) backend = flag('--pyodide') ? await pyodideBackend() : subprocessBackend

  const reports = await validateDir({
    dir: join(root, 'content', 'exams'),
    topicsFile: join(root, 'src', 'data', 'topics.json'),
    topics: (value('--topic') ?? '').split(',').filter(Boolean),
    robust, fill: flag('--fill-expected'), backend,
  })
  await backend?.close()

  let errors = 0, warnings = 0
  for (const r of reports) {
    const e = r.issues.filter((i) => i.level === 'error'), w = r.issues.filter((i) => i.level === 'warning')
    errors += e.length; warnings += w.length
    console.log(`${e.length ? red('FAIL') : green(' ok ')} ${r.file}${w.length ? yellow(`  (${w.length} warning${w.length > 1 ? 's' : ''})`) : ''}`)
    if (!flag('--quiet')) for (const n of r.notes) console.log(dim(`       ${n}`))
    for (const i of e) console.log(red(`   error   ${i.where}: ${i.message}`))
    if (!flag('--quiet')) for (const i of w) console.log(yellow(`   warning ${i.where}: ${i.message}`))
  }
  console.log(`\n${reports.length} file(s), ${errors} error(s), ${warnings} warning(s)` + (backend ? dim(`  [python: ${backend.name}]`) : dim('  [python checks skipped]')))
  if (!reports.length) { console.log(red('no exam files found in content/exams/')); process.exit(1) }
  process.exit(errors ? 1 : 0)
}

main().catch((e) => { console.error(red(`validate-exams crashed: ${(e as Error).message}`)); process.exit(2) })
