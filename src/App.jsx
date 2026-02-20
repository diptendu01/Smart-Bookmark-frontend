import { useEffect, useMemo, useState } from 'react'

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/bookmarks`;

const initialForm = { title: '', url: '' }

export default function App() {
  const [bookmarks, setBookmarks] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isEditing = useMemo(() => editingId !== null, [editingId])

  async function loadBookmarks() {
    setLoading(true)
    try {
      const response = await fetch(API_BASE)
      if (!response.ok) {
        throw new Error('Failed to load bookmarks')
      }
      const data = await response.json()
      setBookmarks(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookmarks()
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim() || !form.url.trim()) {
      setError('Title and URL are required')
      return
    }

    const method = isEditing ? 'PUT' : 'POST'
    const endpoint = isEditing ? `${API_BASE}/${editingId}` : API_BASE

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim(), url: form.url.trim() })
      })

      if (!response.ok) {
        const problem = await response.json().catch(() => ({}))
        throw new Error(problem.error || Object.values(problem)[0] || 'Save failed')
      }

      await loadBookmarks()
      resetForm()
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  function startEdit(bookmark) {
    setEditingId(bookmark.id)
    setForm({ title: bookmark.title, url: bookmark.url })
    setError('')
  }

  async function handleDelete(id) {
    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Delete failed')
      }
      await loadBookmarks()
      if (editingId === id) {
        resetForm()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="container">
      <h1>Smart Bookmark Manager</h1>

      <form onSubmit={handleSubmit} className="bookmark-form">
        <input
          name="title"
          value={form.title}
          onChange={updateField}
          placeholder="Bookmark title"
          maxLength={100}
        />
        <input
          name="url"
          value={form.url}
          onChange={updateField}
          placeholder="https://example.com"
        />
        <div className="actions">
          <button type="submit">{isEditing ? 'Update' : 'Add'} Bookmark</button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading bookmarks...</p>
      ) : bookmarks.length === 0 ? (
        <p>No bookmarks yet. Add your first one.</p>
      ) : (
        <ul className="bookmark-list">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              <div>
                <h3>{bookmark.title}</h3>
                <a href={bookmark.url} target="_blank" rel="noreferrer">
                  {bookmark.url}
                </a>
              </div>
              <div className="actions">
                <button type="button" onClick={() => startEdit(bookmark)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(bookmark.id)} className="danger">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
