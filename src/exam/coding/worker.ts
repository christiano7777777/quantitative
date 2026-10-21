// Runs Python in a Web Worker so an infinite loop can never freeze the page: the page terminates this worker on timeout.
// Protocol (all messages are plain JSON):
//   page -> worker  { type: 'init', indexURL, harness }
//                   { type: 'run', id, helper, student, main, rngArg, caseJson }
//   worker -> page  { type: 'status', text } | { type: 'ready' } | { type: 'result', id, json } | { type: 'fatal', message }

interface PyodideLike {
  loadPackage(names: string[]): Promise<void>
  runPython(code: string): unknown
  globals: { get(name: string): (...args: unknown[]) => string }
}

let py: PyodideLike | null = null
const post = (m: object) => (self as unknown as Worker).postMessage(m)

self.onmessage = async (ev: MessageEvent) => {
  const m = ev.data as { type: string; [k: string]: unknown }
  try {
    if (m.type === 'init') {
      post({ type: 'status', text: 'Downloading Python (first time only, then cached)...' })
      const mod = await import(/* @vite-ignore */ `${m.indexURL as string}pyodide.mjs`)
      py = await mod.loadPyodide({ indexURL: m.indexURL })
      post({ type: 'status', text: 'Loading numpy and scipy...' })
      await py!.loadPackage(['numpy', 'scipy'])
      py!.runPython(m.harness as string)
      post({ type: 'ready' })
    } else if (m.type === 'run' && py) {
      const json = py.globals.get('run_case_json')(m.helper, m.student, m.main, m.rngArg ?? '', m.caseJson)
      post({ type: 'result', id: m.id, json })
    }
  } catch (e) {
    post({ type: 'fatal', message: (e as Error).message })
  }
}
