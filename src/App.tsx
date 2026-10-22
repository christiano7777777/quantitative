import { useEffect, useRef, useState } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './context'
import { Tree } from './pages/Tree'
import { TopicPage } from './pages/Topic'
import { TestPage } from './pages/Test'
import { ResultPage } from './pages/Result'
import { LecturePage } from './pages/Lecture'
import { ExamHubPage } from './pages/ExamHub'
import { WrittenAttemptPage, WrittenTakePage } from './pages/ExamWritten'
import { CodingAttemptPage, CodingTakePage } from './pages/ExamCoding'
import { CodingPreviewPage, ExamPreviewIndex, WrittenPreviewPage } from './pages/ExamPreview'
import { SettingsPage } from './pages/Settings'
import { validateState } from './exam/store'
import { syncWithGist } from './lib/sync'
import { applySavedProgress, checkCredentials, loggedInUser, setLoggedInUser } from './lib/testLogin'

function Header() {
  const { store, exams, dev, setDev, refresh, settings, updateSettings } = useApp()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [user, setUser] = useState(loggedInUser)
  const [form, setForm] = useState(false)

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('user') ?? '').trim()
    if (await checkCredentials(name, String(f.get('password') ?? ''))) {
      applySavedProgress(store)
      setLoggedInUser(name); setUser(name); setForm(false); setMsg(`Logged in as ${name}.`)
      refresh()
    } else setMsg('Wrong username or password.')
  }
  const logout = () => { setLoggedInUser(null); setUser(null); setMsg('Logged out.') }

  const [syncing, setSyncing] = useState(false)
  // pull, merge with this browser, push back. Both stores are checked before either is changed.
  const sync = async () => {
    if (!settings.githubToken) { setMsg('Add a GitHub token in Settings first.'); return }
    setSyncing(true)
    try {
      const local = { ...JSON.parse(store.exportJson()), exams: exams.exportState() }
      const r = await syncWithGist(settings.githubToken, settings.gistId, local)
      validateState(r.merged.exams)
      store.importJson(JSON.stringify(r.merged))
      exams.importState(r.merged.exams)
      if (r.gistId !== settings.gistId) updateSettings({ ...settings, gistId: r.gistId })
      setMsg(r.created ? 'Created a private gist and uploaded your progress.' : 'Synced with GitHub.')
      refresh()
    } catch (e) {
      setMsg(`Sync failed: ${(e as Error).message}`)
    }
    setSyncing(false)
  }
  const autoSynced = useRef(false)
  useEffect(() => {
    if (autoSynced.current || !settings.githubToken) return
    autoSynced.current = true
    void sync()
    // once per page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const download = () => {
    // one file for everything: skill-tree progress as before, plus the Big Exam attempts under "exams" (never the API key)
    const all = { ...JSON.parse(store.exportJson()), exams: exams.exportState() }
    const url = URL.createObjectURL(new Blob([JSON.stringify(all, null, 1)], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'quantitative-progress.json' })
    a.click()
    URL.revokeObjectURL(url)
  }
  const upload = async (f: File | undefined) => {
    if (!f) return
    try {
      const text = await f.text()
      const exam = (JSON.parse(text) as { exams?: unknown }).exams
      if (exam !== undefined) validateState(exam) // check before changing anything, so a bad file leaves both stores untouched
      store.importJson(text)
      if (exam !== undefined) exams.importState(exam)
      setMsg(exam !== undefined ? 'Imported progress and exam attempts.' : 'Imported.')
      refresh()
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
    if (file.current) file.current.value = ''
  }

  return (
    <header className="top">
      <Link to="/" className="brand">Quantitative</Link>
      <span className="grow" />
      {msg && <span className="muted small" role="status">{msg}</span>}
      <Link to="/settings" className="muted small">Settings</Link>
      {settings.githubToken && <button onClick={sync} disabled={syncing} title="Merge this browser's progress with your private GitHub gist">{syncing ? 'Syncing...' : 'Sync'}</button>}
      <button onClick={download}>Export progress</button>
      <button onClick={() => file.current?.click()}>Import progress</button>
      <input ref={file} type="file" accept="application/json" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {user ? (
        <>
          <span className="muted small">{user}</span>
          <button onClick={logout}>Log out</button>
        </>
      ) : form ? (
        <form className="login" onSubmit={login}>
          <input name="user" placeholder="username" aria-label="Username" autoComplete="username" required />
          <input name="password" type="password" placeholder="password" aria-label="Password" autoComplete="current-password" required />
          <button type="submit">Log in</button>
          <button type="button" onClick={() => setForm(false)}>Cancel</button>
        </form>
      ) : (
        <button onClick={() => setForm(true)} title="Test-only login">Log in</button>
      )}
      <label className="dev" title="Unlock every topic, for testing">
        <input type="checkbox" checked={dev} onChange={(e) => setDev(e.target.checked)} /> Dev mode
      </label>
    </header>
  )
}

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Header />
        <main className="wrap">
          <Routes>
            <Route path="/" element={<Tree />} />
            <Route path="/topic/:id" element={<TopicPage />} />
            <Route path="/topic/:id/test" element={<TestPage />} />
            <Route path="/topic/:id/attempt/:n" element={<ResultPage />} />
            <Route path="/topic/:id/lecture/:lec" element={<LecturePage />} />
            <Route path="/topic/:id/lecture/:lec/quiz" element={<TestPage />} />
            <Route path="/topic/:id/lecture/:lec/attempt/:n" element={<ResultPage />} />
            <Route path="/topic/:id/exam" element={<ExamHubPage />} />
            <Route path="/topic/:id/exam/written" element={<WrittenTakePage />} />
            <Route path="/topic/:id/exam/written/:aid" element={<WrittenAttemptPage />} />
            <Route path="/topic/:id/exam/coding" element={<CodingTakePage />} />
            <Route path="/topic/:id/exam/coding/:aid" element={<CodingAttemptPage />} />
            <Route path="/exam-preview" element={<ExamPreviewIndex />} />
            <Route path="/exam-preview/:id/coding" element={<CodingPreviewPage />} />
            <Route path="/exam-preview/:id/written" element={<WrittenPreviewPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<p>Not found. <Link to="/">Back to the tree</Link></p>} />
          </Routes>
        </main>
      </HashRouter>
    </AppProvider>
  )
}
