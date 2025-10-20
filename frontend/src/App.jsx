import React, { useEffect, useMemo, useState } from 'react'
import { Archive, RotateCw, Trash2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

export default function App() {
  const [docs, setDocs] = useState([])
  const [filter, setFilter] = useState('')
  const [status, setStatus] = useState('all')
  const [form, setForm] = useState({ title: '', tags: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/documents?status=${status}&filter=${encodeURIComponent(filter)}`)
      const data = await res.json()
      setDocs(data)
    } catch (e) {
      setError('Failed to load documents: ' + e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [filter, status])

  async function createDoc(e) {
    e.preventDefault()
    if (!form.title.trim())
      return
    try {
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, tags: form.tags })
      })
      const created = await res.json()
      setForm({ title: '', tags: '' })
      setDocs(d => [created, ...d])
    } catch (e) {
      console.error(e)
    }
  }

  async function toggleArchive(id, nextStatus) {
    try {
      const res = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      const updated = await res.json()
      setDocs(ds => {
        const mapped = ds.map(d => d.id === updated.id ? updated : d)
        if (status !== 'all' && updated.status !== status) {
          return mapped.filter(d => d.id !== updated.id)
        }
        return mapped
      })
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteDocument(id) {
    try {
      const res = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok && res.status !== 204)
        throw new Error('Delete failed');
    } catch (e) {
      console.error(e);
      setError('Löschen fehlgeschlagen.');
    } finally {
      load();
    }
  }

  const filtered = useMemo(() => docs, [docs])

  return (
    <div className="layout">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">react-dms</h1>
      </header>

      <section className="grid md:grid-cols-[420px,1fr] lg:grid-cols-[480px,1fr] gap-3">
        <aside className="card h-fit">
          <div className="mb-3">
            <input
              className="input"
              placeholder="Search..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm">Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <form onSubmit={createDoc} className="card mt-3">
            <h2 className="font-medium mb-2">New document</h2>
            <input className="input mb-2" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="input mb-3" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            <button className="btn btn-primary" type="submit">Create</button>
          </form>
        </aside>

        <main className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Documents</h2>
            {loading && <span className="text-sm">Loading...</span>}
          </div>
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <ul className="list">
            {filtered.map(doc => (
              <li key={doc.id} className="list-item">
                <div>
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-sm opacity-70 mt-1">
                    <span className={`badge`}>{doc.status}</span>
                    {doc.tags && doc.tags.split(',').map((t, i) => {
                      const tag = t.trim();
                      return tag ? <span key={i} className={`badge`}>{tag}</span> : null
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === 'active' ? (
                    <button className="btn btn-action" onClick={() => toggleArchive(doc.id, 'archived')} aria-label="Archive">
                      <Archive className="w-4 h-4" />
                      <span className="hidden sm:inline">Archive</span>
                    </button>
                  ) : (
                    <button className="btn btn-action" onClick={() => toggleArchive(doc.id, 'active')} aria-label="Restore">
                      <RotateCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Restore</span>
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => deleteDocument(doc.id)} aria-label="Delete">
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </li>
            ))}
            {!filtered.length && !loading && <li className="py-3 text-slate-500">No documents</li>}
          </ul>
        </main>
      </section>
    </div>
  )
}
