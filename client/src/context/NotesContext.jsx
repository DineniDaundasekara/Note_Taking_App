import { createContext, useContext, useState, useCallback, useRef } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const NotesContext = createContext(null)

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const searchTimeout = useRef(null)

  const fetchNotes = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        ...(params.search && { search: params.search }),
        ...(params.tag && { tag: params.tag }),
        archived: params.archived || 'false',
      }).toString()
      const res = await api.get(`/notes?${query}`)
      setNotes(res.data.notes)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [])

  const createNote = useCallback(async (data) => {
    const res = await api.post('/notes', data)
    setNotes(prev => [res.data.note, ...prev])
    return res.data.note
  }, [])

  const updateNote = useCallback(async (id, data) => {
    const res = await api.put(`/notes/${id}`, data)
    setNotes(prev => prev.map(n => n._id === id ? res.data.note : n))
    return res.data.note
  }, [])

  const deleteNote = useCallback(async (id) => {
    await api.delete(`/notes/${id}`)
    setNotes(prev => prev.filter(n => n._id !== id))
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
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchNotes({ search: query, tag: activeTag, archived: showArchived ? 'true' : 'false' })
    }, 350)
  }, [fetchNotes, activeTag, showArchived])

  const handleTagFilter = useCallback((tag) => {
    setActiveTag(tag)
    fetchNotes({ search: searchQuery, tag, archived: showArchived ? 'true' : 'false' })
  }, [fetchNotes, searchQuery, showArchived])

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))].sort()

  return (
    <NotesContext.Provider value={{
      notes, loading, searchQuery, activeTag, showArchived, allTags,
      fetchNotes, createNote, updateNote, deleteNote,
      addCollaborator, updateCollaborator, removeCollaborator,
      handleSearch, handleTagFilter, setShowArchived
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