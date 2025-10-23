import React, { useEffect, useMemo, useState } from 'react'
import { Archive, RotateCw, Trash2 } from 'lucide-react'
import { FileUpload, DocumentViewer, Navbar, Footer } from './components'

const API_URL = import.meta.env.VITE_API_URL

export default function App() {
  const [docs, setDocs] = useState([])
  const [filter, setFilter] = useState('')
  const [status, setStatus] = useState('all')
  const [form, setForm] = useState({ title: '', tags: '' })
  const [initialFile, setInitialFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDoc, setSelectedDoc] = useState(null)

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
    if (!form.title.trim()) return
    try {
      // create document
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, tags: form.tags })
      })
      const created = await res.json()
      // if there's an initial file, upload it
      if (initialFile) {
        const formData = new FormData()
        formData.append('file', initialFile)
        await fetch(`${API_URL}/api/documents/${created.id}/files`, {
          method: 'POST',
          body: formData
        })
      }
      setForm({ title: '', tags: '' })
      setInitialFile(null)
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
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <div className="flex-1 w-full flex">
        <div className="mx-auto px-6 pt-8 pb-6 flex flex-col w-full h-[calc(100vh-6rem)] overflow-hidden">
          <section className="grid md:grid-cols-[500px,1fr] lg:grid-cols-[520px,1fr] xl:grid-cols-[560px,1fr] gap-3 h-full">
            <aside className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full overflow-auto">
              <div className="mb-3">
                <input
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
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

              <form onSubmit={createDoc} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-3">
                <h2 className="font-medium mb-2">New document</h2>
                <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm mb-2" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm mb-3" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                <div className="mb-3">
                  <label className="text-sm block mb-1">Attach file (optional)</label>
                  <input type="file" className="input" onChange={e => setInitialFile(e.target.files[0] || null)} />
                </div>
                <button className="inline-flex items-center gap-2 rounded-md text-sm px-3 py-2 bg-sky-600 text-white hover:bg-sky-700" type="submit">Create</button>
              </form>
            </aside>

            <main className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full flex flex-col overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h2 className="font-medium">{selectedDoc ? selectedDoc.title : 'Documents'}</h2>
                </div>
                {loading && <span className="text-sm">Loading...</span>}
              </div>

              {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

              {selectedDoc ? (
                <DocumentViewer docId={selectedDoc.id} onBack={() => setSelectedDoc(null)} onDeleted={() => { setSelectedDoc(null); load(); }} />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map(doc => (
                    <li key={doc.id} className="py-4 flex items-center justify-between hover:bg-slate-50" onClick={() => setSelectedDoc(doc)}>
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm opacity-70 mt-1">
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full border mr-2 bg-slate-100 text-slate-700 border-slate-200">{doc.status}</span>
                          {doc.tags && doc.tags.split(',').map((t, i) => {
                            const tag = t.trim();
                            return tag ? <span key={i} className="inline-block text-xs px-2 py-0.5 rounded-full border mr-2 bg-slate-100 text-slate-700 border-slate-200">{tag}</span> : null
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {doc.status === 'active' ? (
                            <button className="inline-flex items-center gap-2 rounded-md text-sm px-2.5 py-1.5 border hover:bg-slate-50 text-slate-700" onClick={(e) => { e.stopPropagation(); toggleArchive(doc.id, 'archived') }} aria-label="Archive">
                              <Archive className="w-4 h-4" />
                              <span className="hidden sm:inline">Archive</span>
                            </button>
                          ) : (
                            <button className="inline-flex items-center gap-2 rounded-md text-sm px-2.5 py-1.5 border hover:bg-slate-50 text-slate-700" onClick={(e) => { e.stopPropagation(); toggleArchive(doc.id, 'active') }} aria-label="Restore">
                              <RotateCw className="w-4 h-4" />
                              <span className="hidden sm:inline">Restore</span>
                            </button>
                          )}
                          <button className="inline-flex items-center gap-2 rounded-md text-sm px-2.5 py-1.5 text-red-600 border border-red-100 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id) }} aria-label="Delete">
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {!filtered.length && !loading && <li className="py-3 text-slate-500">No documents</li>}
                </ul>
              )}
            </main>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
