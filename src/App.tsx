import { useRef, useState } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './context'
import { Tree } from './pages/Tree'
import { TopicPage } from './pages/Topic'
import { TestPage } from './pages/Test'
import { ResultPage } from './pages/Result'
import { LecturePage } from './pages/Lecture'
import { applySavedProgress, checkCredentials, loggedInUser, setLoggedInUser } from './lib/testLogin'

function Header() {
  const { store, dev, setDev, refresh } = useApp()
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

  const download = () => {
    const url = URL.createObjectURL(new Blob([store.exportJson()], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'quantitative-progress.json' })
    a.click()
    URL.revokeObjectURL(url)
  }
  const upload = async (f: File | undefined) => {
    if (!f) return
    try {
      store.importJson(await f.text())
      setMsg('Imported.')
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
            <Route path="*" element={<p>Not found. <Link to="/">Back to the tree</Link></p>} />
          </Routes>
        </main>
      </HashRouter>
    </AppProvider>
  )
}
