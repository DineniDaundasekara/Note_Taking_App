import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotes } from '../../context/NotesContext'
import {
  BookOpen, FileText, File, Archive, Tag, LogOut, Plus,
  Star, ChevronDown, ChevronRight,
  Clock, CheckCircle2, User
} from 'lucide-react'
import { useState } from 'react'

export default function Sidebar({ onNewNote, onClose }) {
  const { user, logout } = useAuth()
  const { allTags, activeTag, stats, updateFilters, activeFilter } = useNotes()
  const [tagsOpen, setTagsOpen] = useState(true)

  const navClick = (filter, tag = '') => {
    updateFilters(filter, tag)
    if (onClose) onClose()
  }

  const NavItem = ({ icon: Icon, label, active, onClick, count, color }) => (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-ink-800 text-parchment-100' : 'text-ink-400 hover:bg-ink-900 hover:text-ink-200'}`}>
      <Icon size={15} className={color} />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs bg-ink-700 text-ink-300 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </button>
  )

  const isAllNotes = !activeFilter.archived && !activeFilter.favorite && !activeFilter.priority && !activeFilter.status && !activeTag

  return (
    <aside className="w-64 h-full bg-ink-950 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-ink-800 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-parchment-400 rounded-xl flex items-center justify-center">
          <BookOpen size={16} className="text-ink-950" />
        </div>
        <span className="font-display text-lg text-parchment-100 font-semibold">Notara</span>
      </div>

      <div className="p-4">
        <button onClick={onNewNote}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-parchment-400 hover:bg-parchment-300 text-ink-950 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> New Note
        </button>
      </div>

      {stats && (
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: stats.total, color: 'text-parchment-300' },
            { label: 'Pinned', value: stats.pinned, color: 'text-parchment-400' },
          ].map(s => (
            <div key={s.label} className="bg-ink-900 rounded-lg px-2 py-2 text-center">
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-xs text-ink-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        <p className="px-3 pt-1 pb-1.5 text-xs font-semibold text-ink-600 uppercase tracking-wider">Library</p>
        <NavItem icon={FileText} label="All Notes" active={isAllNotes}
          onClick={() => navClick({ archived: false, favorite: false, priority: '', status: '' })} count={stats?.total} />
        <NavItem icon={Star} label="Favorites" active={activeFilter.favorite}
          onClick={() => navClick({ archived: false, favorite: true, priority: '', status: '' })} count={stats?.favorites} color="text-parchment-400" />
        <NavItem icon={Archive} label="Archived" active={activeFilter.archived}
          onClick={() => navClick({ archived: true, favorite: false, priority: '', status: '' })} />

        <p className="px-3 pt-3 pb-1.5 text-xs font-semibold text-ink-600 uppercase tracking-wider">Priority</p>
        {[
          { value: 'high', label: 'High', color: 'text-red-400' },
          { value: 'medium', label: 'Medium', color: 'text-parchment-400' },
          { value: 'low', label: 'Low', color: 'text-sage-400' },
        ].map(p => (
          <NavItem key={p.value}
            icon={() => <span className={`w-2 h-2 rounded-full bg-current ${p.color} flex-shrink-0`} />}
            label={p.label} color={p.color}
            active={activeFilter.priority === p.value}
            onClick={() => navClick({ archived: false, favorite: false, priority: activeFilter.priority === p.value ? '' : p.value, status: '' })}
            count={stats?.byPriority?.[p.value]} />
        ))}

        <p className="px-3 pt-3 pb-1.5 text-xs font-semibold text-ink-600 uppercase tracking-wider">Status</p>
        {[
          { value: 'active', label: 'Active', icon: FileText },
          { value: 'draft', label: 'Draft', icon: Clock },
          { value: 'completed', label: 'Completed', icon: CheckCircle2 },
        ].map(s => (
          <NavItem key={s.value} icon={s.icon} label={s.label}
            active={activeFilter.status === s.value}
            onClick={() => navClick({ archived: false, favorite: false, priority: '', status: activeFilter.status === s.value ? '' : s.value })} />
        ))}

        {allTags.length > 0 && (
          <>
            <button onClick={() => setTagsOpen(p => !p)}
              className="w-full flex items-center gap-1 px-3 pt-3 pb-1.5 text-xs font-semibold text-ink-600 uppercase tracking-wider hover:text-ink-400">
              {tagsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Tags
            </button>
            {tagsOpen && allTags.map(tag => (
              <NavItem key={tag} icon={Tag} label={tag}
                active={activeTag === tag}
                onClick={() => navClick({ archived: false, favorite: false, priority: '', status: '' }, tag)} />
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-ink-800">
        <div className="flex items-center gap-3">
          <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full bg-ink-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-parchment-100 truncate">{user?.name}</p>
            <p className="text-xs text-ink-500 truncate">{user?.email}</p>
          </div>
          <div className="flex gap-1">
            <Link to="/profile" className="p-1.5 text-ink-500 hover:text-ink-300 transition-colors rounded-lg hover:bg-ink-900" title="Profile">
              <User size={14} />
            </Link>
            <button onClick={logout} className="p-1.5 text-ink-500 hover:text-ink-300 transition-colors rounded-lg hover:bg-ink-900" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}