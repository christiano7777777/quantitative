import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context'
import { DEFAULT_MODEL } from '../exam/store'

export function SettingsPage() {
  const { settings, updateSettings } = useApp()
  const [key, setKey] = useState(settings.anthropicKey)
  const [model, setModel] = useState(settings.model)
  const [msg, setMsg] = useState('')

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings({ anthropicKey: key.trim(), model: model.trim() || DEFAULT_MODEL })
    setMsg(key.trim() ? 'Saved. One-click API marking is on.' : 'Saved. No key stored, so marking uses copy and paste.')
  }
  const clear = () => { setKey(''); updateSettings({ anthropicKey: '', model: model.trim() || DEFAULT_MODEL }); setMsg('Key removed from this browser.') }

  return (
    <>
      <p><Link to="/">← Skill tree</Link></p>
      <h1>Settings</h1>
      <section className="card">
        <h2>Anthropic API key (optional)</h2>
        <p className="errbox" role="note">
          <b>The key is stored in plain text in this browser's localStorage.</b> Anyone who can open this browser profile, and any script running on this
          page's origin, can read it. Requests go from your browser straight to api.anthropic.com. Use a key with a spending limit, never on a shared
          computer, and remove it when you are done. It is <b>not</b> included when you export your progress.
        </p>
        <p className="muted small">Without a key the Big Exam marks by copy and paste: it builds a prompt for you to give to Claude and reads the JSON reply back.</p>
        <form onSubmit={save} className="settings-form">
          <label>API key <input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..." /></label>
          <label>Model <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={DEFAULT_MODEL} className="mono" /></label>
          <p><button type="submit" className="primary">Save</button> <button type="button" onClick={clear}>Remove key</button> {msg && <span role="status" className="small">{msg}</span>}</p>
        </form>
      </section>
    </>
  )
}
