import React, { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function DocumentViewer({ docId, onBack }) {
    const [files, setFiles] = useState([])
    const [selected, setSelected] = useState(null)
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [previewUrl, setPreviewUrl] = useState(null)

    useEffect(() => {
        if (!docId)
            return
        setError('')
        setPreviewUrl(null)
        setSelected(null)
        loadFiles()
    }, [docId])

    function loadFiles() {
        setError('')
        fetch(`${API_URL}/api/documents/${docId}/files`)
            .then(r => r.json())
            .then(data => setFiles(data))
            .catch(e => setError('Failed to load files'))
    }

    useEffect(() => {
        // load preview when selected file changes
        if (!selected) return
        fetch(`${API_URL}/api/documents/${docId}/files/${selected.id}`)
            .then(r => r.json())
            .then(j => {
                if (j.url) {
                    setPreviewUrl(j.url)
                } else {
                    setPreviewUrl(`${API_URL}/api/documents/${docId}/files/${selected.id}`)
                }
            }).catch(() => setError('Failed to load preview'))
    }, [selected])

    async function openFileInNewTab(f) {
        try {
            const res = await fetch(`${API_URL}/api/documents/${docId}/files/${f.id}`)
            // try to parse JSON response
            const text = await res.text()
            try {
                const j = JSON.parse(text)
                if (j.url) {
                    window.open(j.url, '_blank')
                    return
                }
            } catch (e) {
                console.log('Not JSON response, probably binary data: ', e)
            }
            // fallback: open the file endpoint directly
            window.open(`${API_URL}/api/documents/${docId}/files/${f.id}`, '_blank')
        } catch (err) {
            setError('Failed to open file')
        }
    }

    async function uploadFile(e) {
        const file = e.target.files[0]
        if (!file)
            return
        setUploading(true); setUploadError('')
        try {
            const form = new FormData()
            form.append('file', file)
            const res = await fetch(`${API_URL}/api/documents/${docId}/files`, { method: 'POST', body: form })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'upload failed' }))
                throw new Error(err.error || 'upload failed')
            }
            await res.json()
            loadFiles()
        } catch (err) {
            setUploadError(err.message)
        } finally {
            setUploading(false)
        }
    }

    async function deleteFile(fileId) {
        if (!window.confirm('Anhang wirklich löschen?')) return
        try {
            const res = await fetch(`${API_URL}/api/documents/${docId}/files/${fileId}`, { method: 'DELETE' })
            if (!res.ok && res.status !== 204) throw new Error('Delete failed')
            // refresh list
            if (selected && selected.id === fileId) setSelected(null)
            loadFiles()
        } catch (err) {
            setError('Löschen fehlgeschlagen')
        }
    }

    return (
        <div className="grid grid-cols-[minmax(320px,420px)_1fr] gap-4">
            <div>
                <div className="viewer-header">
                    <div className="flex items-center gap-2">
                        {onBack && <button className="inline-flex items-center gap-2 rounded-md text-sm px-2.5 py-1.5 border hover:bg-slate-50" onClick={onBack}>Back</button>}
                        <h3 className="font-medium">Files</h3>
                    </div>
                </div>
                {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
                <div className="mb-3">
                    <label className="text-sm block mb-1">Upload file</label>
                    <input type="file" className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm" onChange={uploadFile} disabled={uploading} />
                    {uploadError && <div className="text-sm text-red-600 mt-2">{uploadError}</div>}
                </div>

                <ul className="divide-y divide-slate-100">
                    {files.map(f => (
                        <li key={f.id} className={`py-3 flex items-center justify-between hover:bg-slate-50 ${selected && selected.id === f.id ? 'bg-sky-50 border-l-4 border-sky-200' : ''}`} onClick={() => setSelected(f)}>
                            <div>
                                <div className="font-medium">{f.filename}</div>
                                <div className="text-sm text-slate-600">v{f.version} • {Math.round((f.size || 0) / 1024)} KB</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="inline-flex items-center gap-2 rounded-md text-sm px-2.5 py-1.5 border hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); openFileInNewTab(f); }}>
                                    Open
                                </button>
                                <button className="inline-flex items-center gap-2 rounded-md text-sm px-2.5 py-1.5 text-red-600 border border-red-100 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); deleteFile(f.id); }}>
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-white border border-slate-100 rounded-md p-4 flex items-center justify-center min-w-0">
                {selected ? (
                    previewUrl ? (
                        selected.content_type && selected.content_type.startsWith('image/') ? (
                            <img src={previewUrl} alt={selected.filename} className="max-w-full max-h-[60vh] object-contain" />
                        ) : selected.content_type === 'application/pdf' ? (
                            <iframe src={previewUrl} title={selected.filename} className="w-full h-[60vh] border" />
                        ) : (
                            <div className="p-4">No preview available. <button className="btn btn-primary ml-2" onClick={() => openFileInNewTab(selected)}>Download</button></div>
                        )
                    ) : (
                        <div className="p-4 text-slate-500">Loading preview...</div>
                    )
                ) : (
                    <div className="p-4 text-slate-500">Select a file to preview</div>
                )}
            </div>
        </div>
    )
}
