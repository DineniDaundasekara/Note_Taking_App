import { useState } from 'react'
import { useNotes } from '../../context/NotesContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { X, Plus, Tag as TagIcon } from 'lucide-react'

const COLORS = [
  { hex: '#ffffff', label: 'White' }, { hex: '#fef9c3', label: 'Yellow' },
  { hex: '#dcfce7', label: 'Green' }, { hex: '#dbeafe', label: 'Blue' },
  { hex: '#fce7f3', label: 'Pink' }, { hex: '#f3e8ff', label: 'Purple' },
  { hex: '#ffedd5', label: 'Orange' },
]
const PRIORITIES = [
  { value: 'none', label: 'No priority', color: 'bg-ink-300' },
  { value: 'low', label: 'Low', color: 'bg-sage-500' },
  { value: 'medium', label: 'Medium', color: 'bg-parchment-400' },
  { value: 'high', label: 'High', color: 'bg-red-500' },
]
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
]

export default function NewNoteModal({ onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', tagInput: '', tags: [],
    color: '#ffffff', priority: 'none', status: 'active',
    dueDate: '', isPinned: false, checklistInput: '', checklist: []
  })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('basic')
  const { createNote } = useNotes()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const setVal = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = form.tagInput.trim().toLowerCase().replace(/,/g, '')
      if (val && !form.tags.includes(val)) setVal('tags', [...form.tags, val])
      setVal('tagInput', '')
    }
  }

  const addChecklist = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const text = form.checklistInput.trim()
      if (text) setVal('checklist', [...form.checklist, { text, completed: false }])
      setVal('checklistInput', '')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      const note = await createNote({
        title: form.title.trim(),
        description: form.description.trim(),
        tags: form.tags,
        color: form.color,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        isPinned: form.isPinned,
        checklist: form.checklist.map((item, i) => ({ ...item, order: i }))
      })
      toast.success('Note created!')
      onClose()
      navigate(`/notes/${note._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create note')
    } finally { setLoading(false) }
  }

  const TabBtn = ({ id, label }) => (
    <button type="button" onClick={() => setTab(id)}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === id ? 'bg-ink-900 text-parchment-50' : 'text-ink-600 hover:bg-ink-100'}`}>
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg animate-scale-in max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <h2 className="font-display font-semibold text-ink-950 text-lg">New Note</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          <TabBtn id="basic" label="Basic" />
          <TabBtn id="details" label="Details" />
          <TabBtn id="checklist" label={`Checklist${form.checklist.length > 0 ? ` (${form.checklist.length})` : ''}`} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {tab === 'basic' && <>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Title *</label>
                <input autoFocus type="text" className="input-field font-display text-base"
                  placeholder="Note title…" value={form.title} onChange={set('title')} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea className="input-field resize-none" rows={3}
                  placeholder="Short summary of this note (optional, max 500 chars)…"
                  value={form.description} onChange={set('description')} maxLength={500} />
                {form.description && (
                  <p className="text-xs text-ink-400 mt-1 text-right">{form.description.length}/500</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-ink-100 text-ink-700 rounded-full text-xs">
                      <TagIcon size={10} />{tag}
                      <button type="button" onClick={() => setVal('tags', form.tags.filter(t => t !== tag))}
                        className="text-ink-400 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <input type="text" className="input-field"
                  placeholder="Type a tag and press Enter or comma…"
                  value={form.tagInput} onChange={set('tagInput')} onKeyDown={addTag} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-2 uppercase tracking-wider">Card color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c.hex} type="button" title={c.label} onClick={() => setVal('color', c.hex)}
                      className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${form.color === c.hex ? 'border-ink-900 scale-110' : 'border-ink-200'}`}
                      style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </div>
            </>}

            {tab === 'details' && <>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-2 uppercase tracking-wider">Priority</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p.value} type="button" onClick={() => setVal('priority', p.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${form.priority === p.value ? 'border-ink-900 bg-ink-50' : 'border-ink-100 hover:border-ink-300'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-2 uppercase tracking-wider">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map(s => (
                    <button key={s.value} type="button" onClick={() => setVal('status', s.value)}
                      className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${form.status === s.value ? 'border-ink-900 bg-ink-50' : 'border-ink-100 hover:border-ink-300'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Due Date</label>
                <input type="date" className="input-field" value={form.dueDate} onChange={set('dueDate')}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="flex items-center gap-3 p-3 bg-parchment-50 rounded-xl border border-parchment-200">
                <input type="checkbox" id="pinned" checked={form.isPinned}
                  onChange={e => setVal('isPinned', e.target.checked)}
                  className="w-4 h-4 accent-ink-900 cursor-pointer" />
                <label htmlFor="pinned" className="text-sm font-medium text-ink-800 cursor-pointer">
                  Pin this note to the top
                </label>
              </div>
            </>}

            {tab === 'checklist' && <>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Add checklist items</label>
                <input type="text" className="input-field"
                  placeholder="Type an item and press Enter…"
                  value={form.checklistInput} onChange={set('checklistInput')} onKeyDown={addChecklist} />
              </div>
              {form.checklist.length > 0 ? (
                <ul className="space-y-2">
                  {form.checklist.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 p-2.5 bg-ink-50 rounded-lg">
                      <input type="checkbox" checked={item.completed}
                        onChange={() => setVal('checklist', form.checklist.map((x, j) => j === i ? { ...x, completed: !x.completed } : x))}
                        className="w-4 h-4 accent-sage-500 cursor-pointer" />
                      <span className={`flex-1 text-sm ${item.completed ? 'line-through text-ink-400' : 'text-ink-800'}`}>
                        {item.text}
                      </span>
                      <button type="button"
                        onClick={() => setVal('checklist', form.checklist.filter((_, j) => j !== i))}
                        className="text-ink-300 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-400 italic text-center py-4">
                  No items yet. Type above and press Enter.
                </p>
              )}
            </>}

          </div>

          <div className="px-5 py-4 border-t border-ink-100 flex gap-3">
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