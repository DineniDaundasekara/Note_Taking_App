import { useState } from 'react'
import { useNotes } from '../../context/NotesContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { UserPlus, Crown, Pen, Eye, Trash2, Search, X, Users } from 'lucide-react'

export default function CollaboratorManager({ note, onClose }) {
  const { addCollaborator, updateCollaborator, removeCollaborator } = useNotes()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState('read')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const isOwner = note.owner._id === user._id

  const handleSearch = async (val) => {
    setEmail(val)
    if (val.length < 2) { setSearchResults([]); return }
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(val)}`)
      setSearchResults(data.users)
    } catch { }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await addCollaborator(note._id, email, permission)
      toast.success('Collaborator added!')
      setEmail(''); setSearchResults([])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add collaborator')
    } finally { setLoading(false) }
  }

  const handleUpdatePerm = async (userId, perm) => {
    try { await updateCollaborator(note._id, userId, perm); toast.success('Permission updated') }
    catch { toast.error('Failed') }
  }

  const handleRemove = async (userId, name) => {
    if (!confirm(`Remove ${name}?`)) return
    try { await removeCollaborator(note._id, userId); toast.success('Removed') }
    catch { toast.error('Failed') }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md animate-scale-in">

        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ink-100 rounded-xl flex items-center justify-center">
              <Users size={15} className="text-ink-700" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-ink-950">Collaborators</h2>
              <p className="text-xs text-ink-500 truncate max-w-[220px]">{note.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {isOwner && (
            <form onSubmit={handleAdd} className="space-y-3">
              <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wider">Add person</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input type="email" className="input-field pl-9"
                  placeholder="Search by name or email…"
                  value={email} onChange={e => handleSearch(e.target.value)} />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-ink-200 rounded-xl shadow-dropdown mt-1 z-10 overflow-hidden">
                    {searchResults.map(u => (
                      <button key={u._id} type="button"
                        onClick={() => { setEmail(u.email); setSearchResults([]) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-ink-50">
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-ink-900">{u.name}</p>
                          <p className="text-xs text-ink-500">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <select className="input-field flex-1" value={permission}
                  onChange={e => setPermission(e.target.value)}>
                  <option value="read">Can view</option>
                  <option value="write">Can edit</option>
                </select>
                <button type="submit" className="btn-primary" disabled={loading || !email}>
                  {loading
                    ? <div className="w-4 h-4 border-2 border-parchment-50 border-t-transparent rounded-full animate-spin" />
                    : <><UserPlus size={15} /> Add</>}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-ink-600 uppercase tracking-wider">People with access</p>

            {/* Owner */}
            <div className="flex items-center gap-3 p-2.5 bg-parchment-50 border border-parchment-200 rounded-xl">
              <img src={note.owner.avatar} alt={note.owner.name} className="w-8 h-8 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">
                  {note.owner.name} {note.owner._id === user._id && '(you)'}
                </p>
                <p className="text-xs text-ink-500 truncate">{note.owner.email}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-parchment-600 font-semibold">
                <Crown size={11} /> Owner
              </span>
            </div>

            {/* Collaborators */}
            {note.collaborators.length === 0 && (
              <p className="text-sm text-ink-400 italic text-center py-2">No collaborators yet</p>
            )}
            {note.collaborators.map(c => (
              <div key={c.user._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50 group">
                <img src={c.user.avatar} alt={c.user.name} className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {c.user.name} {c.user._id === user._id && '(you)'}
                  </p>
                  <p className="text-xs text-ink-500 truncate">{c.user.email}</p>
                </div>
                {isOwner ? (
                  <div className="flex items-center gap-1">
                    <select value={c.permission}
                      onChange={e => handleUpdatePerm(c.user._id, e.target.value)}
                      className="text-xs border border-ink-200 rounded-lg px-2 py-1 text-ink-700 bg-white focus:outline-none">
                      <option value="read">View</option>
                      <option value="write">Edit</option>
                    </select>
                    <button onClick={() => handleRemove(c.user._id, c.user.name)}
                      className="p-1.5 text-ink-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-ink-500">
                    {c.permission === 'write' ? <><Pen size={11} /> Edit</> : <><Eye size={11} /> View</>}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}