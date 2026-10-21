import { useEffect, useState } from 'react'
import { createPyodideRunner, type CodeRunner } from './runner'

let make: () => CodeRunner = createPyodideRunner
/** tests swap in a fake runner here */
export const setRunnerFactory = (f: (() => CodeRunner) | null) => { make = f ?? createPyodideRunner }

/** one runner per page; its worker is only started by the first Run, and killed when the page closes */
export function useRunner(): CodeRunner {
  const [runner] = useState(() => make())
  useEffect(() => () => runner.dispose(), [runner])
  return runner
}
