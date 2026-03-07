import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotes } from '../../context/NotesContext'
import { formatDistanceToNow, isPast, format } from 'date-fns'
import { Pin, Users, Tag, Archive, Trash2, MoreHorizontal, Star, Copy, AlertCircle, Calendar, CheckSquare } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

const BG = {
  '#ffffff': 'bg-white', '#fef9c3': 'bg-yellow-50', '#dcfce7': 'bg-green-50',
  '#dbeafe': 'bg-blue-50', '#fce7f3': 'bg-pink-50', '#f3e8ff': 'bg-purple-50', '#ffedd5': 'bg-orange-50'
}
const PRIORITY_COLOR = {
  high: 'text-red-600 bg-red-50', medium: 'text-parchment-600 bg-parchment-50',
  low: 'text-sage-600 bg-sage-50', none: ''
}
const PRIORITY_DOT = {
  high: 'bg-red-500', medium: 'bg-parchment-400', low: 'bg-sage-500', none: 'bg-ink-300'
}
const STATUS_COLOR = {
  active: 'text-sage-700 bg-sage-50', draft: 'text-ink-500 bg-ink-100', completed: 'text-blue-700 bg-blue-50'
}

export default function NoteCard({ note, viewMode = 'grid' }) {
  const { user } = useAuth()
  const { updateNote, deleteNote, duplicateNote } = useNotes()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const isOwner = note.owner._id === user._id
  const isOverdue = note.dueDate && isPast(new Date(note.dueDate)) && note.status !== 'completed'
  const checklistDone = note.checklist?.filter(i => i.completed).length || 0
  const checklistTotal = note.checklist?.length || 0

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = async (e, field, val) => {
    e.stopPropagation()
    try {
      await updateNote(note._id, { [field]: val })
      toast.success(
        field === 'isPinned' ? (val ? 'Pinned' : 'Unpinned') :
          field === 'isFavorite' ? (val ? 'Added to favorites' : 'Removed from favorites') : 'Done'
      )
    } catch { toast.error('Failed') }
  }

  const handleArchive = async (e) => {
    e.stopPropagation()
    try { await updateNote(note._id, { isArchived: !note.isArchived }); toast.success(note.isArchived ? 'Unarchived' : 'Archived') }
    catch { toast.error('Failed') }
    setShowMenu(false)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm('Delete this note permanently?')) return
    try { await deleteNote(note._id); toast.success('Note deleted') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setShowMenu(false)
  }

  const handleDuplicate = async (e) => {
    e.stopPropagation()
    await duplicateNote(note._id)
    setShowMenu(false)
  }

  const bgClass = BG[note.color] || 'bg-white'

  // ── List view ──────────────────────────────────────────────────────────────
  if (viewMode === 'list') return (
    <div onClick={() => navigate(`/notes/${note._id}`)}
      className={`card card-hover animate-fade-in ${bgClass} flex items-center gap-4 px-4 py-3`}>
      {note.priority !== 'none' && (
        <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${PRIORITY_DOT[note.priority]}`} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-ink-900 truncate">{note.title}</h3>
          {note.isPinned && <Pin size={12} className="text-parchment-500 flex-shrink-0" fill="currentColor" />}
          {note.isFavorite && <Star size={12} className="text-parchment-400 flex-shrink-0" fill="currentColor" />}
        </div>
        {note.description && <p className="text-xs text-ink-500 truncate mt-0.5">{note.description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {note.dueDate && (
          <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-ink-400'}`}>
            <Calendar size={11} />{format(new Date(note.dueDate), 'MMM d')}
          </span>
        )}
        {note.tags?.slice(0, 2).map(t => (
          <span key={t} className="badge bg-ink-100 text-ink-600 hidden sm:flex"><Tag size={9} />{t}</span>
        ))}
        <span className="text-xs text-ink-400">
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  )

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div onClick={() => navigate(`/notes/${note._id}`)}
      className={`card card-hover animate-fade-in group flex flex-col ${bgClass}`}>
      <div className="p-4 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {note.priority !== 'none' && (
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[note.priority]}`} />
            )}
            <h3 className="font-display font-semibold text-ink-900 text-base leading-tight line-clamp-2 flex-1">
              {note.title}
            </h3>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {isOwner && (
              <button onClick={e => toggle(e, 'isPinned', !note.isPinned)}
                className={`p-1 rounded transition-colors ${note.isPinned ? 'text-parchment-500' : 'text-ink-300 opacity-0 group-hover:opacity-100 hover:text-ink-600'}`}>
                <Pin size={13} fill={note.isPinned ? 'currentColor' : 'none'} />
              </button>
            )}
            <button onClick={e => toggle(e, 'isFavorite', !note.isFavorite)}
              className={`p-1 rounded transition-colors ${note.isFavorite ? 'text-parchment-400' : 'text-ink-300 opacity-0 group-hover:opacity-100 hover:text-ink-600'}`}>
              <Star size={13} fill={note.isFavorite ? 'currentColor' : 'none'} />
            </button>
            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button onClick={e => { e.stopPropagation(); setShowMenu(p => !p) }}
                  className="p-1 rounded text-ink-300 opacity-0 group-hover:opacity-100 hover:text-ink-600 hover:bg-ink-100 transition-colors">
                  <MoreHorizontal size={14} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-7 w-44 bg-white rounded-xl shadow-dropdown border border-ink-100 z-30 py-1.5 animate-scale-in">
                    <button onClick={handleDuplicate} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                      <Copy size={13} /> Duplicate
                    </button>
                    <button onClick={handleArchive} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                      <Archive size={13} /> {note.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <div className="border-t border-ink-100 my-1" />
                    <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {note.description && (
          <p className="text-ink-500 text-xs leading-relaxed line-clamp-2 mb-2">{note.description}</p>
        )}

        {/* Content preview (only if no description) */}
        {!note.description && note.contentText && (
          <p className="text-ink-500 text-sm leading-relaxed line-clamp-3 mb-3">
            {note.contentText.slice(0, 100)}
          </p>
        )}

        {/* Checklist progress */}
        {checklistTotal > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ink-400 flex items-center gap-1">
                <CheckSquare size={11} /> {checklistDone}/{checklistTotal}
              </span>
              <span className="text-xs text-ink-400">
                {Math.round(checklistDone / checklistTotal * 100)}%
              </span>
            </div>
            <div className="h-1 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-sage-500 rounded-full transition-all"
                style={{ width: `${checklistDone / checklistTotal * 100}%` }} />
            </div>
          </div>
        )}

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-ink-100 text-ink-600 rounded-full text-xs">
                <Tag size={9} />{tag}
              </span>
            ))}
            {note.tags.length > 3 && <span className="text-xs text-ink-400">+{note.tags.length - 3}</span>}
          </div>
        )}

        <div className="flex-1" />

        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {note.priority !== 'none' && (
            <span className={`badge ${PRIORITY_COLOR[note.priority]}`}>{note.priority}</span>
          )}
          {note.status !== 'active' && (
            <span className={`badge ${STATUS_COLOR[note.status]}`}>{note.status}</span>
          )}
          {isOverdue && (
            <span className="badge bg-red-100 text-red-600 flex items-center gap-1">
              <AlertCircle size={10} /> overdue
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
          <div className="flex items-center gap-2">
            {note.dueDate ? (
              <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-ink-400'}`}>
                <Calendar size={11} />{format(new Date(note.dueDate), 'MMM d')}
              </span>
            ) : (
              <span className="text-xs text-ink-400">
                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {note.collaborators?.length > 0 && (
              <span className="text-xs text-ink-400 flex items-center gap-1">
                <Users size={11} />{note.collaborators.length}
              </span>
            )}
            {!isOwner && <span className="badge bg-sage-100 text-sage-700">Shared</span>}
          </div>
        </div>

      </div>
    </div>
  )
}