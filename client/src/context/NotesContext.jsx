import { createContext, useContext, useState, useCallback, useRef } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const NotesContext = createContext(null)

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [activeFilter, setActiveFilter] = useState({ archived: false, favorite: false, priority: '', status: '' })
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('-updatedAt')
  const searchRef = useRef(null)

  const fetchNotes = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.tag) q.set('tag', params.tag)
      if (params.priority) q.set('priority', params.priority)
      if (params.status) q.set('status', params.status)
      q.set('archived', params.archived ? 'true' : 'false')
      q.set('favorite', params.favorite ? 'true' : 'false')
      q.set('sort', params.sort || sortBy)

      const { data } = await api.get(`/notes?${q}`)
      setNotes(data.notes)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notes')
    } finally { setLoading(false) }
  }, [sortBy])

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/notes/stats')
      setStats(data)
    } catch { }
  }, [])

  const createNote = useCallback(async (data) => {
    const res = await api.post('/notes', data)
    setNotes(prev => [res.data.note, ...prev])
    await fetchStats()
    return res.data.note
  }, [fetchStats])

  const updateNote = useCallback(async (id, data) => {
    const res = await api.put(`/notes/${id}`, data)
    setNotes(prev => prev.map(n => n._id === id ? res.data.note : n))
    return res.data.note
  }, [])

  const deleteNote = useCallback(async (id) => {
    await api.delete(`/notes/${id}`)
    setNotes(prev => prev.filter(n => n._id !== id))
    await fetchStats()
  }, [fetchStats])

  const duplicateNote = useCallback(async (id) => {
    const res = await api.post(`/notes/${id}/duplicate`)
    setNotes(prev => [res.data.note, ...prev])
    toast.success('Note duplicated!')
    return res.data.note
  }, [])

  const addCollaborator = useCallback(async (noteId, email, permission) => {
    const res = await api.post(`/notes/${noteId}/collaborators`, { email, permission })
    setNotes(prev => prev.map(n => n._id === noteId ? res.data.note : n))
    return res.data.note
  }, [])

  const updateCollaborator = useCallback(async (noteId, userId, permission) => {
    const res = await api.put(`/notes/${noteId}/collaborators/${userId}`, { permission })
    setNotes(prev => prev.map(n => n._id === noteId ? res.data.note : n))
    return res.data.note
  }, [])

  const removeCollaborator = useCallback(async (noteId, userId) => {
    const res = await api.delete(`/notes/${noteId}/collaborators/${userId}`)
    setNotes(prev => prev.map(n => n._id === noteId ? res.data.note : n))
    return res.data.note
  }, [])

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      fetchNotes({ search: query, tag: activeTag, ...activeFilter, sort: sortBy })
    }, 350)
  }, [fetchNotes, activeTag, activeFilter, sortBy])

  const applyFilter = useCallback((filter) => {
    const next = { ...activeFilter, ...filter }
    setActiveFilter(next)
    fetchNotes({ search: searchQuery, tag: activeTag, ...next, sort: sortBy })
  }, [fetchNotes, searchQuery, activeTag, activeFilter, sortBy])

  const handleTagFilter = useCallback((tag) => {
    setActiveTag(tag)
    fetchNotes({ search: searchQuery, tag, ...activeFilter, sort: sortBy })
  }, [fetchNotes, searchQuery, activeFilter, sortBy])

  const updateFilters = useCallback((filter, tag = '') => {
    setActiveFilter(filter)
    setActiveTag(tag)
    fetchNotes({ search: searchQuery, tag, ...filter, sort: sortBy })
  }, [fetchNotes, searchQuery, sortBy])

  const handleSort = useCallback((sort) => {
    setSortBy(sort)
    fetchNotes({ search: searchQuery, tag: activeTag, ...activeFilter, sort })
  }, [fetchNotes, searchQuery, activeTag, activeFilter])

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))].sort()

  return (
    <NotesContext.Provider value={{
      notes, stats, loading, searchQuery, activeTag, activeFilter, viewMode, sortBy, allTags,
      setViewMode, fetchNotes, fetchStats, createNote, updateNote, deleteNote, duplicateNote,
      addCollaborator, updateCollaborator, removeCollaborator,
      handleSearch, handleTagFilter, applyFilter, handleSort, updateFilters
    }}>
      {children}
    </NotesContext.Provider>
  )
}

export const useNotes = () => {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes must be used within NotesProvider')
  return ctx
}