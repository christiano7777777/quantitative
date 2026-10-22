// Keeps one copy of the progress in a private GitHub Gist so a second browser can pick it up. There is no server of ours:
// the browser talks to api.github.com with a personal access token the user pastes into Settings (classic token, "gist" scope).
// Syncing merges, it never overwrites: every attempt from either side is kept.

export const GIST_FILE = 'quantitative-progress.json'
const API = 'https://api.github.com'

type Obj = Record<string, unknown>
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x)

/** union of two attempt lists, keyed by `keyOf`; on a clash `pick` chooses the entry to keep. Sorted by `sortBy`. */
function unionBy(a: unknown[], b: unknown[], keyOf: (x: Obj) => string, sortBy: (x: Obj) => string, pick: (x: Obj, y: Obj) => Obj): unknown[] {
  const out = new Map<string, Obj>()
  for (const x of [...a, ...b]) {
    if (!isObj(x)) continue
    const k = keyOf(x)
    const old = out.get(k)
    out.set(k, old ? pick(old, x) : x)
  }
  return [...out.values()].sort((p, q) => sortBy(p).localeCompare(sortBy(q)))
}

function mergeLists(a: unknown, b: unknown, keyOf: (x: Obj) => string, sortBy: (x: Obj) => string, pick: (x: Obj, y: Obj) => Obj): Obj {
  const out: Obj = {}
  const ma = isObj(a) ? a : {}
  const mb = isObj(b) ? b : {}
  for (const topic of new Set([...Object.keys(ma), ...Object.keys(mb)])) {
    const la = Array.isArray(ma[topic]) ? (ma[topic] as unknown[]) : []
    const lb = Array.isArray(mb[topic]) ? (mb[topic] as unknown[]) : []
    out[topic] = unionBy(la, lb, keyOf, sortBy, pick)
  }
  return out
}

const str = (x: unknown) => (typeof x === 'string' ? x : '')
const first = (x: Obj) => x
/** a marked exam attempt beats the same attempt unmarked; otherwise the later marking wins */
const preferMarked = (x: Obj, y: Obj) => (str(y.markedAt) > str(x.markedAt) ? y : x)

/** Combines two progress snapshots (the shape the Export button writes: skill-tree state plus an `exams` key). Pure. */
export function mergeSnapshots(local: Obj, remote: Obj): Obj {
  const attempts = mergeLists(local.attempts, remote.attempts, (x) => `${str(x.date)}|${str((x.spec as Obj | undefined)?.seed)}`, (x) => str(x.date), first)
  const merged: Obj = { ...local, version: 1, devMode: local.devMode === true, attempts }
  const le = isObj(local.exams) ? local.exams : null
  const re = isObj(remote.exams) ? remote.exams : null
  if (le || re) {
    merged.exams = {
      version: 1,
      written: mergeLists(le?.written, re?.written, (x) => str(x.id), (x) => str(x.submittedAt), preferMarked),
      coding: mergeLists(le?.coding, re?.coding, (x) => str(x.id), (x) => str(x.submittedAt), first),
      drafts: le?.drafts ?? { written: {}, coding: {} }, // drafts stay on the device that wrote them
    }
  }
  return merged
}

/** what goes into the gist: no drafts, no settings, no keys */
export function forUpload(snapshot: Obj): Obj {
  const exams = isObj(snapshot.exams) ? { ...snapshot.exams, drafts: { written: {}, coding: {} } } : undefined
  const { devMode: _devMode, ...rest } = snapshot
  return exams ? { ...rest, exams } : rest
}

// ---- GitHub API ----

export class SyncError extends Error {}

async function call(token: string, path: string, init?: RequestInit): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: `Bearer ${token}`, ...init?.headers },
    })
  } catch {
    throw new SyncError('could not reach GitHub (offline?)')
  }
  if (res.status === 401) throw new SyncError('GitHub rejected the token (401). Check it in Settings.')
  if (res.status === 403 || res.status === 404) throw new SyncError(`GitHub refused the request (${res.status}). The token needs the "gist" scope.`)
  if (!res.ok) throw new SyncError(`GitHub error ${res.status}`)
  return res.json()
}

interface GistFile { content?: string; truncated?: boolean; raw_url?: string }
interface Gist { id: string; files: Record<string, GistFile | undefined> }

async function contentOf(token: string, gist: Gist): Promise<string | null> {
  const f = gist.files[GIST_FILE]
  if (!f) return null
  if (f.truncated && f.raw_url) {
    const res = await fetch(f.raw_url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new SyncError(`GitHub error ${res.status}`)
    return res.text()
  }
  return f.content ?? null
}

/** the user's own progress gist, or null if none exists yet (looked up by file name, newest first) */
async function findGist(token: string): Promise<Gist | null> {
  const list = (await call(token, '/gists?per_page=100')) as Gist[]
  return list.find((g) => g.files[GIST_FILE]) ?? null
}

/**
 * Pull the remote copy (creating the gist on first use), merge it with `local`, push the result, and return the merged snapshot.
 * `gistId` is remembered by the caller so later syncs skip the search.
 */
export async function syncWithGist(token: string, gistId: string, local: Obj): Promise<{ merged: Obj; gistId: string; created: boolean }> {
  let gist: Gist | null = gistId ? ((await call(token, `/gists/${encodeURIComponent(gistId)}`)) as Gist) : await findGist(token)
  let remote: Obj = {}
  if (gist) {
    const text = await contentOf(token, gist)
    if (text) {
      try {
        const parsed: unknown = JSON.parse(text)
        if (!isObj(parsed)) throw new Error()
        remote = parsed
      } catch {
        throw new SyncError('the progress file in the gist is not valid JSON; nothing was changed')
      }
    }
  }
  const merged = mergeSnapshots(local, remote)
  const body = JSON.stringify(forUpload(merged), null, 1)
  if (gist) {
    await call(token, `/gists/${gist.id}`, { method: 'PATCH', body: JSON.stringify({ files: { [GIST_FILE]: { content: body } } }) })
    return { merged, gistId: gist.id, created: false }
  }
  gist = (await call(token, '/gists', {
    method: 'POST',
    body: JSON.stringify({ description: 'Quantitative app progress (private)', public: false, files: { [GIST_FILE]: { content: body } } }),
  })) as Gist
  return { merged, gistId: gist.id, created: true }
}
