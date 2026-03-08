import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNotes } from '../context/NotesContext'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import RichTextEditor from '../components/notes/RichTextEditor'
import CollaboratorManager from '../components/notes/CollaboratorManager'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import {
  ArrowLeft, Users, Pin, Archive, Tag as TagIcon, Check, Trash2, Palette,
  Star, AlertCircle, Calendar, CheckSquare, ChevronDown, Copy, Clock, Eye
} from 'lucide-react'

const COLORS = ['#ffffff', '#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#ffedd5']
const PRIORITIES = [
  { value: 'none', label: 'None', dot: 'bg-ink-300' },
  { value: 'low', label: 'Low', dot: 'bg-sage-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-parchment-400' },
  { value: 'high', label: 'High', dot: 'bg-red-500' },
]
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
]

export default function NotePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateNote, deleteNote, duplicateNote } = useNotes()
  const { user } = useAuth()

  const [note, setNote] = useState(null)
  const [access, setAccess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCollabs, setShowCollabs] = useState(false)
  const [showColorMenu, setShowColorMenu] = useState(false)
  const [showPriMenu, setShowPriMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [checklist, setChecklist] = useState([])
  const [checkInput, setCheckInput] = useState('')
  const [showChecklist, setShowChecklist] = useState(false)

  const saveRef = useRef(null)
  const isOwner = note?.owner._id === user._id
  const canEdit = access === 'owner' || access === 'write'
  const isOverdue = note?.dueDate && isPast(new Date(note.dueDate)) && note?.status !== 'completed'

  useEffect(() => { loadNote() }, [id])

  const loadNote = async () => {
    try {
      const { data } = await api.get(`/notes/${id}`)
      const n = data.note
      setNote(n); setAccess(data.access)
      setTitle(n.title)
      setDescription(n.description || '')
      setContent(n.content || '')
      setTags(n.tags || [])
      setChecklist(n.checklist || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Note not found')
      navigate('/dashboard')
    } finally { setLoading(false) }
  }

  const autoSave = useCallback((updates) => {
    if (!canEdit) return
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        const updated = await updateNote(id, updates)
        setNote(updated); setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } catch { }
      finally { setSaving(false) }
    }, 1000)
  }, [canEdit, id, updateNote])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    autoSave({ title: e.target.value, description, content, tags, checklist })
  }
  const handleDescChange = (e) => {
    setDescription(e.target.value)
    autoSave({ title, description: e.target.value, content, tags, checklist })
  }
  const handleContentChange = (html) => {
    setContent(html)
    autoSave({ title, description, content: html, tags, checklist })
  }

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim().toLowerCase().replace(/,/g, '')
      if (val && !tags.includes(val)) {
        const t = [...tags, val]; setTags(t)
        autoSave({ title, description, content, tags: t, checklist })
      }
      setTagInput('')
    }
  }
  const removeTag = (tag) => {
    const t = tags.filter(x => x !== tag); setTags(t)
    autoSave({ title, description, content, tags: t, checklist })
  }

  const addCheckItem = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const text = checkInput.trim()
      if (text) {
        const cl = [...checklist, { text, completed: false, order: checklist.length }]
        setChecklist(cl)
        autoSave({ title, description, content, tags, checklist: cl })
      }
      setCheckInput('')
    }
  }

  const toggleCheckItem = async (itemId) => {
    const item = checklist.find(i => i._id === itemId)
    if (!item) return
    try {
      await api.patch(`/notes/${id}/checklist/${itemId}`, { completed: !item.completed })
      setChecklist(cl => cl.map(i => i._id === itemId ? { ...i, completed: !i.completed } : i))
    } catch { }
  }

  const removeCheckItem = (itemId) => {
    const cl = checklist.filter(i => (i._id || i.text) !== itemId)
    setChecklist(cl)
    autoSave({ title, description, content, tags, checklist: cl })
  }

  const quickUpdate = async (updates) => {
    try {
      const updated = await updateNote(id, updates)
      setNote(updated); toast.success('Updated')
    } catch { toast.error('Failed') }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this note permanently?')) return
    try { await deleteNote(id); navigate('/dashboard'); toast.success('Deleted') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDuplicate = async () => {
    await duplicateNote(id)
    navigate('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen bg-parchment-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-ink-900 border-t-transparent animate-spin" />
    </div>
  )

  const checkDone = checklist.filter(i => i.completed).length
  const checkTotal = checklist.length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: note?.color || '#fdfaf5' }}>
      <header className="sticky top-0 z-20 border-b border-black/[0.08] bg-white/85 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2 flex-shrink-0">
            <ArrowLeft size={17} />
          </button>
          <div className="flex-1" />

          <div className="flex items-center gap-1.5 text-xs text-ink-400 min-w-[90px] justify-center">
            {saving ? (
              <><div className="w-3 h-3 border border-ink-400 border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : saved ? (
              <><Check size={13} className="text-sage-500" /> Saved</>
            ) : note ? (
              <span className="text-ink-300 flex items-center gap-1">
                <Clock size={11} />{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </span>
            ) : null}
          </div>

          {note?.viewCount > 0 && (
            <span className="text-xs text-ink-400 flex items-center gap-1 hidden sm:flex">
              <Eye size={11} /> {note.viewCount}
            </span>
          )}

          {isOwner && (
            <div className="relative">
              <button onClick={() => setShowColorMenu(p => !p)} className="btn-ghost p-2" title="Color">
                <Palette size={15} />
              </button>
              {showColorMenu && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-modal border border-ink-100 p-2.5 flex gap-2 z-30 animate-scale-in">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => { quickUpdate({ color: c }); setShowColorMenu(false) }}
                      className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${note?.color === c ? 'border-ink-900' : 'border-ink-200'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <button onClick={() => quickUpdate({ isPinned: !note.isPinned })}
              className={`btn-ghost p-2 ${note?.isPinned ? 'text-parchment-500' : ''}`} title="Pin">
              <Pin size={15} fill={note?.isPinned ? 'currentColor' : 'none'} />
            </button>
          )}

          <button onClick={() => quickUpdate({ isFavorite: !note.isFavorite })}
            className={`btn-ghost p-2 ${note?.isFavorite ? 'text-parchment-400' : ''}`} title="Favorite">
            <Star size={15} fill={note?.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button onClick={() => setShowCollabs(true)} className="btn-ghost p-2 relative" title="Collaborators">
            <Users size={15} />
            {note?.collaborators?.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-sage-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {note.collaborators.length}
              </span>
            )}
          </button>

          {isOwner && (
            <button onClick={handleDuplicate} className="btn-ghost p-2" title="Duplicate"><Copy size={15} /></button>
          )}
          {isOwner && (
            <button onClick={() => { quickUpdate({ isArchived: !note.isArchived }); navigate('/dashboard') }}
              className="btn-ghost p-2" title="Archive"><Archive size={15} /></button>
          )}
          {isOwner && (
            <button onClick={handleDelete} className="btn-ghost p-2 hover:text-red-500" title="Delete"><Trash2 size={15} /></button>
          )}

          {!isOwner && (
            <span className="text-xs px-2 py-1 bg-sage-100 text-sage-700 rounded-full font-medium">
              {access === 'write' ? '✏️ Can edit' : '👁️ View only'}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 space-y-4">
        {isOverdue && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
            <AlertCircle size={15} />
            This note was due {format(new Date(note.dueDate), 'MMM d, yyyy')} and is overdue
          </div>
        )}

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority */}
          <div className="relative">
            <button onClick={() => { if (canEdit) setShowPriMenu(p => !p) }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${canEdit ? 'hover:bg-ink-50 cursor-pointer' : 'cursor-default'} border-ink-200 bg-white`}>
              <div className={`w-2 h-2 rounded-full ${PRIORITIES.find(p => p.value === note?.priority)?.dot || 'bg-ink-300'}`} />
              {PRIORITIES.find(p => p.value === note?.priority)?.label || 'None'}
              {canEdit && <ChevronDown size={11} />}
            </button>
            {showPriMenu && canEdit && (
              <div className="absolute top-8 left-0 bg-white rounded-xl shadow-dropdown border border-ink-100 py-1.5 z-20 w-36 animate-scale-in">
                {PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => { quickUpdate({ priority: p.value }); setShowPriMenu(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-ink-50 ${note?.priority === p.value ? 'font-semibold' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${p.dot}`} />{p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="relative">
            <button onClick={() => { if (canEdit) setShowStatusMenu(p => !p) }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${canEdit ? 'hover:bg-ink-50 cursor-pointer' : 'cursor-default'} border-ink-200 bg-white`}>
              {note?.status || 'active'}
              {canEdit && <ChevronDown size={11} />}
            </button>
            {showStatusMenu && canEdit && (
              <div className="absolute top-8 left-0 bg-white rounded-xl shadow-dropdown border border-ink-100 py-1.5 z-20 w-36 animate-scale-in">
                {STATUSES.map(s => (
                  <button key={s.value} onClick={() => { quickUpdate({ status: s.value }); setShowStatusMenu(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-ink-50 ${note?.status === s.value ? 'font-semibold' : ''}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due date */}
          {canEdit ? (
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-ink-200 bg-white text-xs font-medium cursor-pointer hover:bg-ink-50 transition-colors">
              <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-ink-500'} />
              <span className={isOverdue ? 'text-red-600' : 'text-ink-600'}>
                {note?.dueDate ? format(new Date(note.dueDate), 'MMM d, yyyy') : 'Set due date'}
              </span>
              <input type="date" className="sr-only"
                value={note?.dueDate ? new Date(note.dueDate).toISOString().split('T')[0] : ''}
                onChange={e => quickUpdate({ dueDate: e.target.value || null })} />
            </label>
          ) : note?.dueDate && (
            <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white text-xs font-medium ${isOverdue ? 'text-red-600 border-red-200 bg-red-50' : 'text-ink-600 border-ink-200'}`}>
              <Calendar size={12} />{format(new Date(note.dueDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>

        {/* Title */}
        <textarea value={title} onChange={handleTitleChange} disabled={!canEdit}
          placeholder="Untitled" rows={1}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
          className="w-full bg-transparent font-display text-3xl sm:text-4xl font-bold text-ink-950 placeholder:text-ink-300 focus:outline-none resize-none border-none leading-snug" />

        {/* Description */}
        {(canEdit || description) && (
          <textarea value={description} onChange={handleDescChange} disabled={!canEdit}
            placeholder={canEdit ? 'Add a short description…' : ''} rows={2}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            className="w-full bg-transparent text-ink-500 text-base placeholder:text-ink-300 focus:outline-none resize-none border-none leading-relaxed"
            maxLength={500} />
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-ink-100 text-ink-700 rounded-full text-xs font-medium">
              <TagIcon size={10} />{tag}
              {canEdit && <button onClick={() => removeTag(tag)} className="text-ink-400 hover:text-red-500 ml-0.5 transition-colors">×</button>}
            </span>
          ))}
          {canEdit && (
            <input type="text" placeholder="+ tag" value={tagInput}
              onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              className="bg-transparent text-xs text-ink-500 placeholder:text-ink-300 focus:outline-none w-20" />
          )}
        </div>

        {/* Collaborators preview */}
        {note?.collaborators?.length > 0 && (
          <div className="flex items-center gap-2 py-3 border-y border-ink-100">
            <div className="flex -space-x-1.5">
              <img src={note.owner.avatar} alt={note.owner.name} className="w-6 h-6 rounded-full border-2 border-white" title={note.owner.name} />
              {note.collaborators.slice(0, 4).map(c => (
                <img key={c.user._id} src={c.user.avatar} alt={c.user.name} className="w-6 h-6 rounded-full border-2 border-white" title={c.user.name} />
              ))}
            </div>
            <span className="text-xs text-ink-400">{note.collaborators.length + 1} people</span>
            {note.lastEditedBy && <span className="text-xs text-ink-400 ml-auto">Edited by {note.lastEditedBy.name}</span>}
          </div>
        )}

        {/* Checklist */}
        <div className="card overflow-hidden">
          <button onClick={() => setShowChecklist(p => !p)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors border-b border-ink-100">
            <CheckSquare size={15} className="text-sage-600" />
            Checklist
            {checkTotal > 0 && <span className="text-xs text-ink-400">({checkDone}/{checkTotal})</span>}
            {checkTotal > 0 && (
              <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden mx-2">
                <div className="h-full bg-sage-500 rounded-full transition-all" style={{ width: `${checkDone / checkTotal * 100}%` }} />
              </div>
            )}
            <ChevronDown size={14} className={`ml-auto transition-transform ${showChecklist ? 'rotate-180' : ''}`} />
          </button>

          {showChecklist && (
            <div className="p-4 space-y-2">
              {checklist.map((item, idx) => (
                <div key={item._id || idx} className="flex items-center gap-2.5 group">
                  <input type="checkbox" checked={item.completed}
                    onChange={() => item._id ? toggleCheckItem(item._id) : null}
                    className="w-4 h-4 accent-sage-500 cursor-pointer flex-shrink-0" />
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-ink-400' : 'text-ink-800'}`}>{item.text}</span>
                  {canEdit && (
                    <button onClick={() => removeCheckItem(item._id || item.text)}
                      className="text-ink-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              {canEdit && (
                <input type="text" placeholder="Add item and press Enter…" value={checkInput}
                  onChange={e => setCheckInput(e.target.value)} onKeyDown={addCheckItem}
                  className="w-full bg-transparent text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none pt-1 border-t border-ink-100 mt-2" />
              )}
              {checklist.length === 0 && !canEdit && (
                <p className="text-sm text-ink-400 italic text-center py-2">No checklist items</p>
              )}
            </div>
          )}
        </div>

        {/* Rich text editor */}
        <div className="card overflow-hidden min-h-[400px]">
          <RichTextEditor content={content} onChange={handleContentChange}
            editable={canEdit} placeholder="Start writing your note…" />
        </div>
      </div>

      {showCollabs && note && (
        <CollaboratorManager note={note} onClose={() => { setShowCollabs(false); loadNote() }} />
      )}
    </div>
  )
}