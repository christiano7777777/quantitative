import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { buildGraph, type Graph } from './lib/graph'
import { createLocalProgress, type ProgressStore } from './lib/progress'
import { topics } from './data'

interface Value {
  graph: Graph
  store: ProgressStore
  passed: Set<string>
  dev: boolean
  setDev(on: boolean): void
  /** call after any store change so the UI re-reads it */
  refresh(): void
}

const Ctx = createContext<Value>(null as never)
export const useApp = () => useContext(Ctx)

function safeStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null // blocked storage: the app still works, progress just won't persist
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const graph = useMemo(() => buildGraph(topics), [])
  const store = useMemo(() => createLocalProgress(safeStorage()), [])
  const [, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)
  const value: Value = {
    graph, store, passed: store.passedIds(), dev: store.devMode(), refresh,
    setDev(on) { store.setDevMode(on); refresh() },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
