import { useEffect, useState } from 'react'
import { useNotes } from '../context/NotesContext'
import Sidebar from '../components/layout/Sidebar'
import NoteCard from '../components/notes/NoteCard'
import NewNoteModal from '../components/notes/NewNoteModal'
import { Search, Pin, Menu } from 'lucide-react'

export default function DashboardPage() {
  const { notes, loading, fetchNotes, handleSearch, searchQuery, showArchived, activeTag } = useNotes()
  const [showNew, setShowNew] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => { fetchNotes() }, [])

  const pinned   = notes.filter(n => n.isPinned && !n.isArchived)
  const unpinned = notes.filter(n => !n.isPinned)
  const pageTitle = showArchived ? 'Archived' : activeTag ? `#${activeTag}` : 'All Notes'

  return (
    <div className="flex h-screen bg-parchment-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shadow-panel">
        <Sidebar onNewNote={() => setShowNew(true)} />
      </div>

      {/* Mobile Sidebar */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute left-0 top-0 h-full animate-slide-in">
            <Sidebar onNewNote={() => { setShowNew(true); setShowMobileSidebar(false) }}
              onClose={() => setShowMobileSidebar(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-ink-100 bg-white/80 backdrop-blur-sm flex items-center gap-4">
          <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden btn-ghost p-2">
            <Menu size={18} />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" placeholder="Search notes…" className="input-field pl-9"
              value={searchQuery} onChange={e => handleSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-ink-500 hidden sm:block">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display text-2xl font-bold text-ink-950 mb-6">{pageTitle}</h1>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card h-40 animate-pulse">
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-ink-100 rounded w-3/4" />
                      <div className="h-3 bg-ink-100 rounded" />
                      <div className="h-3 bg-ink-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                <div className="w-16 h-16 bg-parchment-100 rounded-2xl flex items-center justify-center mb-4">
                  <Search size={28} className="text-ink-400" />
                </div>
                <h3 className="font-display text-xl font-semibold text-ink-700 mb-2">
                  {searchQuery ? 'No notes found' : 'No notes yet'}
                </h3>
                <p className="text-ink-500 text-sm max-w-xs">
                  {searchQuery ? `No results for "${searchQuery}".` : 'Create your first note to get started.'}
                </p>
                {!searchQuery && (
                  <button onClick={() => setShowNew(true)} className="btn-primary mt-5">Create note</button>
                )}
              </div>
            ) : (
              <>
                {pinned.length > 0 && (
                  <section className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Pin size={13} className="text-ink-400" />
                      <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">Pinned</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pinned.map(note => <NoteCard key={note._id} note={note} />)}
                    </div>
                  </section>
                )}
                {unpinned.length > 0 && (
                  <section>
                    {pinned.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">Other</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unpinned.map(note => <NoteCard key={note._id} note={note} />)}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {showNew && <NewNoteModal onClose={() => setShowNew(false)} />}
    </div>
  )
}