import { useState } from 'react'
import { useNotes } from '../../context/NotesContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { X, Plus, Tag as TagIcon } from 'lucide-react'

const COLORS = [
  { hex: '#ffffff', label: 'White' }, { hex: '#fef9c3', label: 'Yellow' },
  { hex: '#dcfce7', label: 'Green' }, { hex: '#dbeafe', label: 'Blue' },
  { hex: '#fce7f3', label: 'Pink' },  { hex: '#f3e8ff', label: 'Purple' },
  { hex: '#ffedd5', label: 'Orange' },
]

export default function NewNoteModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [color, setColor] = useState('#ffffff')
  const [loading, setLoading] = useState(false)
  const { createNote } = useNotes()
  const navigate = useNavigate()

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim().toLowerCase().replace(/,/g, '')
      if (val && !tags.includes(val)) setTags(p => [...p, val])
      setTagInput('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      const note = await createNote({ title: title.trim(), tags, color })
      toast.success('Note created!')
      onClose()
      navigate(`/notes/${note._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create note')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <h2 className="font-display font-semibold text-ink-950 text-lg">New Note</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5 uppercase tracking-wider">Title *</label>
            <input autoFocus type="text" className="input-field text-lg font-display" placeholder="Note title…"
              value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5 uppercase tracking-wider">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-ink-100 text-ink-700 rounded-full text-xs">
                  <TagIcon size={10} />{tag}
                  <button type="button" onClick={() => setTags(t => t.filter(x => x !== tag))}
                    className="text-ink-400 hover:text-ink-700">×</button>
                </span>
              ))}
            </div>
            <input type="text" className="input-field" placeholder="Add tag and press Enter…"
              value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-2 uppercase tracking-wider">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c.hex} type="button" onClick={() => setColor(c.hex)} title={c.label}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c.hex ? 'border-ink-900 scale-110' : 'border-ink-200'}`}
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading
                ? <div className="w-4 h-4 border-2 border-parchment-50 border-t-transparent rounded-full animate-spin" />
                : <><Plus size={15} /> Create Note</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}