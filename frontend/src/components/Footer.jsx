import React from 'react'
import { Github, Code } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t mt-auto">
            <div className="mx-auto px-4">
                <div className="flex justify-between items-center py-2">
                    <p className="mb-0 text-sm text-slate-500">Erstellt mit Flask, React und Tailwind CSS</p>
                    <div className="flex gap-3">
                        <a href="https://github.com/MaxEmdeWorks" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700" title="GitHub-Profil" aria-label="GitHub-Profil">
                            <Github className="w-5 h-5" aria-hidden="true" />
                        </a>
                        <a href="https://github.com/MaxEmdeWorks/react-dms" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700" title="Repository" aria-label="Repository">
                            <Code className="w-5 h-5" aria-hidden="true" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
