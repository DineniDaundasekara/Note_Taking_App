import { useEffect, useState } from 'react'
import { useNotes } from '../context/NotesContext'
import Sidebar from '../components/layout/Sidebar'
import NoteCard from '../components/notes/NoteCard'
import NewNoteModal from '../components/notes/NewNoteModal'
import { Search, Pin, Menu, Grid3X3, List, SortAsc, ChevronDown, Plus } from 'lucide-react'

const SORT_OPTIONS = [
  { value: '-updatedAt', label: 'Last modified' },
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'title', label: 'Title A–Z' },
  { value: '-title', label: 'Title Z–A' },
  { value: '-priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
]

export default function DashboardPage() {
  const { notes, loading, fetchNotes, fetchStats, handleSearch, searchQuery,
    activeFilter, activeTag, viewMode, setViewMode, sortBy, handleSort } = useNotes()
  const [showNew, setShowNew] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)

  useEffect(() => {
    fetchNotes({ search: searchQuery, tag: activeTag, ...activeFilter, sort: sortBy })
    fetchStats()
  }, [])

  const isArchivedView = !!activeFilter.archived
  
  // Robust internal filtering to ensure UI matches active filters immediately
  const filteredNotes = notes.filter(n => {
    // 1. Archive status must match view
    if (!!n.isArchived !== isArchivedView) return false
    
    // 2. Favorite filter
    if (activeFilter.favorite && !n.isFavorite) return false
    
    // 3. Priority filter
    if (activeFilter.priority && n.priority !== activeFilter.priority) return false
    
    // 4. Status filter
    if (activeFilter.status && n.status !== activeFilter.status) return false
    
    // 5. Tag filter
    if (activeTag && !n.tags?.includes(activeTag)) return false
    
    return true
  })

  const pinned = filteredNotes.filter(n => n.isPinned)
  const unpinned = filteredNotes.filter(n => !n.isPinned)
  const currentSort = SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Last modified'

  let pageTitle = 'All Notes'
  if (activeFilter.archived) pageTitle = 'Archived'
  else if (activeFilter.favorite) pageTitle = 'Favorites'
  else if (activeFilter.priority) pageTitle = `${activeFilter.priority.charAt(0).toUpperCase() + activeFilter.priority.slice(1)} Priority`
  else if (activeFilter.status) pageTitle = activeFilter.status.charAt(0).toUpperCase() + activeFilter.status.slice(1)
  else if (activeTag) pageTitle = `#${activeTag}`

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'flex flex-col gap-2'

  return (
    <div className="flex h-screen bg-parchment-50 overflow-hidden">
      <div className="hidden lg:block h-full flex-shrink-0 shadow-panel">
        <Sidebar onNewNote={() => setShowNew(true)} />
      </div>

      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute left-0 top-0 h-full animate-slide-in">
            <Sidebar onNewNote={() => { setShowNew(true); setShowMobileSidebar(false) }}
              onClose={() => setShowMobileSidebar(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="px-4 sm:px-6 py-3.5 border-b border-ink-100 bg-white/80 backdrop-blur-sm flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden btn-ghost p-2">
            <Menu size={18} />
          </button>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" placeholder="Search notes…" className="input-field pl-9 py-2"
              value={searchQuery} onChange={e => handleSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <button onClick={() => setShowSortMenu(p => !p)} className="btn-ghost py-2 text-xs gap-1.5 hidden sm:flex">
                <SortAsc size={14} />{currentSort}<ChevronDown size={12} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-dropdown border border-ink-100 py-1.5 z-20 animate-scale-in">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { handleSort(o.value); setShowSortMenu(false) }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${sortBy === o.value ? 'bg-ink-50 text-ink-900 font-medium' : 'text-ink-600 hover:bg-ink-50'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex border border-ink-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-ink-900 text-parchment-50' : 'text-ink-500 hover:bg-ink-50'}`}><Grid3X3 size={14} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-ink-900 text-parchment-50' : 'text-ink-500 hover:bg-ink-50'}`}><List size={14} /></button>
            </div>
            <span className="text-xs text-ink-400 hidden md:block">{notes.length} notes</span>
            <button onClick={() => setShowNew(true)} className="btn-primary py-2 text-sm"><Plus size={14} /> New</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6" onClick={() => setShowSortMenu(false)}>
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-2xl font-bold text-ink-950 mb-6">{pageTitle}</h1>
            {loading ? (
              <div className={gridClass}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card h-44 animate-pulse p-4 space-y-3">
                    <div className="h-4 bg-ink-100 rounded w-3/4" />
                    <div className="h-3 bg-ink-100 rounded" />
                    <div className="h-3 bg-ink-100 rounded w-5/6" />
                  </div>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in">
                <div className="w-20 h-20 bg-parchment-100 rounded-3xl flex items-center justify-center mb-5">
                  <Search size={32} className="text-ink-300" />
                </div>
                <h3 className="font-display text-xl font-semibold text-ink-700 mb-2">
                  {searchQuery ? 'No notes match your search' : 'No notes here yet'}
                </h3>
                <p className="text-ink-400 text-sm max-w-xs">
                  {searchQuery ? 'Try different keywords.' : 'Create your first note to get started.'}
                </p>
                {!searchQuery && (
                  <button onClick={() => setShowNew(true)} className="btn-primary mt-6"><Plus size={16} /> Create note</button>
                )}
              </div>
            ) : (
              <>
                {pinned.length > 0 && (
                  <section className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Pin size={13} className="text-parchment-400" fill="currentColor" />
                      <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Pinned</span>
                    </div>
                    <div className={gridClass}>
                      {pinned.map(note => <NoteCard key={note._id} note={note} viewMode={viewMode} />)}
                    </div>
                  </section>
                )}
                {unpinned.length > 0 && (
                  <section>
                    {pinned.length > 0 && <div className="flex items-center gap-2 mb-3"><span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Other notes</span></div>}
                    <div className={gridClass}>
                      {unpinned.map(note => <NoteCard key={note._id} note={note} viewMode={viewMode} />)}
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