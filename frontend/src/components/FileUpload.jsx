import React, { useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function FileUpload({ docId, onUploaded }) {
    const inputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    async function uploadFile() {
        const file = inputRef.current.files[0]
        if (!file)
            return
        setUploading(true); setError('')
        try {
            const form = new FormData()
            form.append('file', file)
            const res = await fetch(`${API_URL}/api/documents/${docId}/files`, {
                method: 'POST',
                body: form
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'upload failed' }))
                throw new Error(err.error || 'upload failed')
            }
            const data = await res.json()
            onUploaded && onUploaded(data)
            inputRef.current.value = null
        } catch (e) {
            setError(e.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
            <button className="inline-flex items-center gap-2 rounded-md text-sm px-3 py-2 bg-sky-600 text-white hover:bg-sky-700" onClick={uploadFile} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
            {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
    )
}
