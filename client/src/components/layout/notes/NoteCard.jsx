import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotes } from '../../context/NotesContext'
import { formatDistanceToNow } from 'date-fns'
import { Pin, Users, Tag, Archive, Trash2, MoreHorizontal } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

const NOTE_COLORS = {
  '#ffffff': 'bg-white', '#fef9c3': 'bg-yellow-50', '#dcfce7': 'bg-green-50',
  '#dbeafe': 'bg-blue-50', '#fce7f3': 'bg-pink-50', '#f3e8ff': 'bg-purple-50', '#ffedd5': 'bg-orange-50',
}

export default function NoteCard({ note }) {
  const { user } = useAuth()
  const { updateNote, deleteNote } = useNotes()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const isOwner = note.owner._id === user._id

  useEffect(() => {
    const handle = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handlePin = async (e) => {
    e.stopPropagation()
    try { await updateNote(note._id, { isPinned: !note.isPinned }); toast.success(note.isPinned ? 'Unpinned' : 'Pinned') }
    catch { toast.error('Failed') }
  }

  const handleArchive = async (e) => {
    e.stopPropagation()
    try { await updateNote(note._id, { isArchived: !note.isArchived }); toast.success(note.isArchived ? 'Unarchived' : 'Archived') }
    catch { toast.error('Failed') }
    setShowMenu(false)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm('Delete this note? This cannot be undone.')) return
    try { await deleteNote(note._id); toast.success('Note deleted') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete') }
    setShowMenu(false)
  }

  const bgClass = NOTE_COLORS[note.color] || 'bg-white'
  const preview = note.contentText?.slice(0, 120) || ''

  return (
    <div onClick={() => navigate(`/notes/${note._id}`)}
      className={`card card-hover cursor-pointer animate-fade-in group ${bgClass}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-ink-900 text-base leading-tight line-clamp-2 flex-1">
            {note.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isOwner && (
              <button onClick={handlePin}
                className={`p-1 rounded transition-colors ${note.isPinned ? 'text-parchment-500' : 'text-ink-300 opacity-0 group-hover:opacity-100 hover:text-ink-600'}`}>
                <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
              </button>
            )}
            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button onClick={e => { e.stopPropagation(); setShowMenu(p => !p) }}
                  className="p-1 rounded text-ink-300 opacity-0 group-hover:opacity-100 hover:text-ink-600 hover:bg-ink-100 transition-colors">
                  <MoreHorizontal size={15} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-7 w-40 bg-white rounded-lg shadow-modal border border-ink-100 z-20 py-1 animate-scale-in">
                    <button onClick={handleArchive}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                      <Archive size={14} /> {note.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {preview && <p className="text-ink-500 text-sm leading-relaxed line-clamp-3 mb-3">{preview}</p>}

        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-ink-100 text-ink-600 rounded-full text-xs">
                <Tag size={10} />{tag}
              </span>
            ))}
            {note.tags.length > 3 && <span className="text-xs text-ink-400">+{note.tags.length - 3}</span>}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-ink-100">
          <span className="text-xs text-ink-400">
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-2">
            {note.collaborators?.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-ink-400">
                <Users size={12} />{note.collaborators.length}
              </div>
            )}
            {!isOwner && (
              <span className="text-xs px-1.5 py-0.5 bg-sage-100 text-sage-700 rounded font-medium">Shared</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}