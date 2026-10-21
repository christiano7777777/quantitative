import { useEffect, useState } from 'react'

export type Loaded<T> = { state: 'loading' } | { state: 'missing' } | { state: 'ready'; value: T } | { state: 'error'; message: string }

/** Runs an async loader once per key. `null` from the loader means the file does not exist. */
export function useLoaded<T>(key: string, load: () => Promise<T | null>): Loaded<T> {
  const [res, setRes] = useState<{ key: string; loaded: Loaded<T> }>({ key, loaded: { state: 'loading' } })
  useEffect(() => {
    let live = true
    load().then(
      (value) => { if (live) setRes({ key, loaded: value === null ? { state: 'missing' } : { state: 'ready', value } }) },
      (e: unknown) => { if (live) setRes({ key, loaded: { state: 'error', message: (e as Error).message } }) },
    )
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return res.key === key ? res.loaded : { state: 'loading' }
}
