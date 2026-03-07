import { useAuth } from '../../context/AuthContext'
import { useNotes } from '../../context/NotesContext'
import { BookOpen, FileText, Archive, Tag, LogOut, Plus } from 'lucide-react'

export default function Sidebar({ onNewNote, onClose }) {
  const { user, logout } = useAuth()
  const { allTags, activeTag, handleTagFilter, showArchived, setShowArchived, fetchNotes, searchQuery } = useNotes()

  const handleNavClick = (archived, tag = '') => {
    setShowArchived(archived)
    handleTagFilter(tag)
    if (onClose) onClose()
  }

  return (
    <aside className="w-64 h-full bg-ink-950 flex flex-col">
      <div className="p-5 border-b border-ink-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-parchment-400 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-ink-950" />
          </div>
          <span className="font-display text-lg text-parchment-100 font-semibold">Notara</span>
        </div>
      </div>

      <div className="p-4">
        <button onClick={onNewNote}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-parchment-400 hover:bg-parchment-300 text-ink-950 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          New Note
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-xs font-medium text-ink-500 uppercase tracking-wider">Library</p>

        <button onClick={() => handleNavClick(false)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            !showArchived && !activeTag ? 'bg-ink-800 text-parchment-100' : 'text-ink-400 hover:bg-ink-900 hover:text-ink-200'
          }`}>
          <FileText size={15} /> All Notes
        </button>

        <button onClick={() => handleNavClick(true)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            showArchived ? 'bg-ink-800 text-parchment-100' : 'text-ink-400 hover:bg-ink-900 hover:text-ink-200'
          }`}>
          <Archive size={15} /> Archived
        </button>

        {allTags.length > 0 && (
          <>
            <p className="px-3 pt-4 pb-1 text-xs font-medium text-ink-500 uppercase tracking-wider">Tags</p>
            {allTags.map(tag => (
              <button key={tag} onClick={() => handleNavClick(false, tag)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTag === tag ? 'bg-ink-800 text-parchment-100' : 'text-ink-400 hover:bg-ink-900 hover:text-ink-200'
                }`}>
                <Tag size={14} />
                <span className="truncate">{tag}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-ink-800">
        <div className="flex items-center gap-3">
          <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full object-cover bg-ink-700" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-parchment-100 truncate">{user?.name}</p>
            <p className="text-xs text-ink-500 truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-ink-500 hover:text-ink-300 transition-colors" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}