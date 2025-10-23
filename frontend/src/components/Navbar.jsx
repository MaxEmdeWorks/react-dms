import React from 'react'

export default function Navbar() {
    return (
        <nav className="w-full bg-slate-50 border-b border-slate-200">
            <div className="mx-auto px-3 py-3 flex items-center">
                <a href="/" className="text-xl font-bold border-r pr-4 mr-4">📄 React DMS</a>
                <div className="ml-auto" />
            </div>
        </nav>
    )
}
