import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNotes } from '../context/NotesContext'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import RichTextEditor from '../components/notes/RichTextEditor'
import CollaboratorManager from '../components/notes/CollaboratorManager'
import { ArrowLeft, Users, Pin, Archive, Tag as TagIcon, Check, Trash2, Palette } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const COLORS = ['#ffffff','#fef9c3','#dcfce7','#dbeafe','#fce7f3','#f3e8ff','#ffedd5']

export default function NotePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateNote, deleteNote } = useNotes()
  const { user } = useAuth()

  const [note, setNote] = useState(null)
  const [access, setAccess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCollabs, setShowCollabs] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])

  const saveTimeout = useRef(null)
  const isOwner = note?.owner._id === user._id
  const canEdit = access === 'owner' || access === 'write'

  useEffect(() => { loadNote() }, [id])

  const loadNote = async () => {
    try {
      const res = await api.get(`/notes/${id}`)
      const n = res.data.note
      setNote(n); setAccess(res.data.access)
      setTitle(n.title); setContent(n.content || ''); setTags(n.tags || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Note not found')
      navigate('/dashboard')
    } finally { setLoading(false) }
  }

  const autoSave = useCallback((updates) => {
    if (!canEdit) return
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      try {
        const updated = await updateNote(id, updates)
        setNote(updated); setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch {}
      finally { setSaving(false) }
    }, 1200)
  }, [canEdit, id, updateNote])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    autoSave({ title: e.target.value, content, tags })
  }

  const handleContentChange = (html) => {
    setContent(html)
    autoSave({ title, content: html, tags })
  }

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim().toLowerCase().replace(/,/g, '')
      if (val && !tags.includes(val)) {
        const newTags = [...tags, val]
        setTags(newTags)
        autoSave({ title, content, tags: newTags })
      }
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    const newTags = tags.filter(t => t !== tag)
    setTags(newTags)
    autoSave({ title, content, tags: newTags })
  }

  const handlePin = async () => {
    try { const u = await updateNote(id, { isPinned: !note.isPinned }); setNote(u); toast.success(note.isPinned ? 'Unpinned' : 'Pinned') }
    catch { toast.error('Failed') }
  }

  const handleArchive = async () => {
    try { await updateNote(id, { isArchived: !note.isArchived }); toast.success('Archived'); navigate('/dashboard') }
    catch { toast.error('Failed') }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this note permanently?')) return
    try { await deleteNote(id); toast.success('Note deleted'); navigate('/dashboard') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete') }
  }

  const handleColorChange = async (color) => {
    setShowColorPicker(false)
    try { const u = await updateNote(id, { color }); setNote(u) } catch {}
  }

  if (loading) return (
    <div className="min-h-screen bg-parchment-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-ink-900 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: note?.color || '#fdfaf5' }}>
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
          <div className="flex-1" />

          <div className="flex items-center gap-1 text-xs text-ink-400 min-w-[80px] justify-center">
            {saving ? (
              <><div className="w-3 h-3 border border-ink-400 border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : saved ? (
              <><Check size={13} className="text-sage-500" /> Saved</>
            ) : note ? (
              <span className="text-ink-300">{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
            ) : null}
          </div>

          {canEdit && isOwner && (
            <div className="relative">
              <button onClick={() => setShowColorPicker(p => !p)} className="btn-ghost p-2" title="Note color">
                <Palette size={16} />
              </button>
              {showColorPicker && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-modal border border-ink-100 p-2.5 flex gap-2 z-30 animate-scale-in">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => handleColorChange(c)}
                      className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${note?.color === c ? 'border-ink-900' : 'border-ink-200'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {canEdit && isOwner && (
            <button onClick={handlePin} className={`btn-ghost p-2 ${note?.isPinned ? 'text-parchment-500' : ''}`} title="Pin">
              <Pin size={16} fill={note?.isPinned ? 'currentColor' : 'none'} />
            </button>
          )}

          <button onClick={() => setShowCollabs(true)} className="btn-ghost p-2 relative" title="Collaborators">
            <Users size={16} />
            {note?.collaborators?.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-sage-500 text-white text-xs rounded-full flex items-center justify-center">
                {note.collaborators.length}
              </span>
            )}
          </button>

          {isOwner && (
            <>
              <button onClick={handleArchive} className="btn-ghost p-2" title="Archive"><Archive size={16} /></button>
              <button onClick={handleDelete} className="btn-ghost p-2 hover:text-red-500" title="Delete"><Trash2 size={16} /></button>
            </>
          )}

          {!isOwner && (
            <span className="text-xs px-2 py-1 bg-sage-100 text-sage-700 rounded-full font-medium">
              {access === 'write' ? 'Can edit' : 'View only'}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8">
        <input
          type="text" value={title} onChange={handleTitleChange}
          placeholder="Untitled" disabled={!canEdit}
          className="w-full bg-transparent font-display text-3xl sm:text-4xl font-bold text-ink-950 mb-4
                     placeholder:text-ink-300 focus:outline-none resize-none border-none"
        />

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-ink-100 text-ink-700 rounded-full text-xs font-medium">
              <TagIcon size={10} />{tag}
              {canEdit && (
                <button onClick={() => removeTag(tag)} className="text-ink-400 hover:text-ink-700 ml-0.5">×</button>
              )}
            </span>
          ))}
          {canEdit && (
            <input type="text" placeholder="+ Add tag" value={tagInput}
              onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              className="bg-transparent text-xs text-ink-500 placeholder:text-ink-300 focus:outline-none min-w-[80px] w-24" />
          )}
        </div>

        {note?.collaborators?.length > 0 && (
          <div className="flex items-center gap-2 mb-6 pb-6 border-b border-ink-100">
            <div className="flex -space-x-2">
              <img src={note.owner.avatar} alt={note.owner.name}
                className="w-6 h-6 rounded-full border-2 border-white" title={note.owner.name} />
              {note.collaborators.slice(0, 4).map(c => (
                <img key={c.user._id} src={c.user.avatar} alt={c.user.name}
                  className="w-6 h-6 rounded-full border-2 border-white" title={c.user.name} />
              ))}
            </div>
            <span className="text-xs text-ink-400">{note.collaborators.length + 1} people have access</span>
            {note.lastEditedBy && (
              <span className="text-xs text-ink-400 ml-auto">Last edited by {note.lastEditedBy.name}</span>
            )}
          </div>
        )}

        <div className="card overflow-hidden min-h-[500px]">
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