/**
 * ChapterManagePage.jsx
 *
 * Manage chapters for a story: list, create, edit, reorder, delete.
 * Route: /create/:slug/chapters
 */

import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Plus, Edit3, Trash2, GripVertical,
  FileText, Clock, Eye, Save, Send, RotateCcw,
  Sparkles,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../context/AuthContext'
import { storyService } from '../../services/storyService'
import { Spinner, Button } from '../../components/ui'
import ManjiAiPanel from '../../components/ai/ManjiAiPanel'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ChapterRow({ chapter, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Delete "${chapter.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await storyService.deleteChapter(chapter.id)
      toast.success('Chapter deleted.')
      onDelete(chapter.id)
    } catch {
      toast.error('Failed to delete chapter.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors border border-white/5 group">
      <GripVertical size={16} className="text-white/20 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white/40 text-xs font-mono w-8 flex-shrink-0">#{chapter.chapter_number}</span>
          <p className="text-white font-medium truncate">{chapter.title}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 text-white/40 text-xs">
          {chapter.word_count > 0 && (
            <span className="flex items-center gap-1"><FileText size={12} /> {chapter.word_count.toLocaleString()} words</span>
          )}
          <span className="flex items-center gap-1"><Clock size={12} /> {chapter.reading_time} min read</span>
          <span className="flex items-center gap-1"><Eye size={12} /> {chapter.views_count}</span>
          <span>{fmtDate(chapter.published_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(chapter)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          title="Edit chapter"
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          title="Delete chapter"
        >
          {deleting ? <Spinner size="sm" /> : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create / Edit chapter form
// ---------------------------------------------------------------------------
function ChapterForm({ chapter, storySlug, onClose, onSaved, content, onContentChange }) {
  const [title, setTitle] = useState(chapter?.title || '')
  const [status, setStatus] = useState(chapter?.status || 'draft')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e, forcedStatus) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Chapter title is required.')
      return
    }

    setSaving(true)
    const payload = {
      title: title.trim(),
      content,
      status: forcedStatus || status,
    }
    // Editing keeps its number; creating lets the backend auto-assign the next one.
    if (chapter) payload.chapter_number = chapter.chapter_number

    try {
      if (chapter) {
        await storyService.updateChapter(chapter.id, payload)
        toast.success(forcedStatus === 'published' ? 'Chapter published.' : 'Chapter updated.')
      } else {
        const res = await storyService.createChapter(storySlug, payload)
        toast.success(forcedStatus === 'published' ? 'Chapter created and published.' : 'Chapter saved as draft.')
        onSaved(res.data)
      }
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to save chapter.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-dark rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {chapter ? 'Edit Chapter' : 'New Chapter'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, 'published')} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Chapter Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Beginning"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Write your chapter content here..."
              rows={16}
              className="input-field resize-none font-mono text-sm leading-relaxed"
            />
            <p className="text-white/30 text-xs mt-1">{content.split(/\s+/).filter(Boolean).length} words</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSubmit(e, 'draft')}
              className="btn-secondary"
            >
              {saving ? <Spinner size="sm" /> : null}
              Save as Draft
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : <Save size={16} />}
              {saving ? 'Saving…' : chapter ? 'Save & Publish' : 'Create & Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ChapterManagePage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  const [draftContent, setDraftContent] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [showAiMobile, setShowAiMobile] = useState(false)

  const isCreator = user?.role === 'creator' || user?.role === 'admin'

  useEffect(() => {
    if (!isCreator) {
      navigate('/create')
      return
    }
    loadData()
  }, [slug, isCreator, navigate])

  async function loadData() {
    setLoading(true)
    try {
      const [storyRes, chaptersRes] = await Promise.all([
        storyService.getStory(slug),
        storyService.getChapters(slug),
      ])
      setStory(storyRes.data)
      setChapters(chaptersRes.data || [])
    } catch {
      toast.error('Failed to load chapters.')
      navigate('/create')
    } finally {
      setLoading(false)
    }
  }

  function handleChapterSaved(newChapter) {
    setChapters((prev) => {
      const exists = prev.find((c) => c.id === newChapter.id)
      if (exists) {
        return prev.map((c) => (c.id === newChapter.id ? newChapter : c))
      }
      return [...prev, newChapter].sort((a, b) => a.chapter_number - b.chapter_number)
    })
    setShowForm(false)
    setEditingChapter(null)
  }

  function handleChapterDeleted(chapterId) {
    setChapters((prev) => prev.filter((c) => c.id !== chapterId))
  }

  async function handleEditChapter(chapter) {
    // The list serializer doesn't include chapter content, so fetch the full
    // chapter detail before opening the editor (otherwise content would be
    // wiped on save).
    try {
      const res = await storyService.getChapter(chapter.id)
      setDraftContent(res.data.content || '')
      setEditingChapter(res.data)
      setShowForm(true)
    } catch {
      toast.error('Failed to load chapter.')
    }
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingChapter(null)
    setDraftContent('')
  }

  function handleNewChapter() {
    setEditingChapter(null)
    setDraftContent('')
    setShowForm(true)
  }

  // Insert AI-generated text into the open draft, or open a new chapter with
  // it when no editor is open.
  function handleAiInsert(text) {
    if (!text) return
    if (!showForm) {
      setDraftContent(text)
      setEditingChapter(null)
      setShowForm(true)
      setShowAiMobile(false)
      return
    }
    setDraftContent((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  async function handlePublish() {
    if (!story) return
    const hasPublishedChapter = chapters.some((c) => c.status === 'published')
    if (!hasPublishedChapter) {
      toast.error('Publish at least one chapter before publishing the story.')
      return
    }
    if (!window.confirm(`Publish "${story.title}"? It will be visible to all readers.`)) return
    setPublishing(true)
    try {
      const res = await storyService.publishStory(story.slug)
      setStory((prev) => ({ ...prev, status: res.data.status }))
      toast.success('Story published! 🎉')
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to publish story.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleUnpublish() {
    if (!story) return
    if (!window.confirm(`Unpublish "${story.title}"? Readers will no longer see it.`)) return
    setPublishing(true)
    try {
      const res = await storyService.unpublishStory(story.slug)
      setStory((prev) => ({ ...prev, status: res.data.status }))
      toast.success('Story unpublished.')
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to unpublish story.')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-32">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!story) return null

  const isAuthor = user?.id === story.author?.id || user?.id === story.author?.id

  return (
    <MainLayout>
      <div className="page-container py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/create"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{story.title}</h1>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  story.status === 'published' || story.status === 'completed'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                {story.status}
              </span>
            </div>
            <p className="text-white/50 text-sm mt-1">
              {chapters.length} chapters · {chapters.filter((c) => c.status === 'published').length} published
            </p>
          </div>
        </div>
        {isAuthor && (
          <div className="flex items-center gap-3">
            {story.status === 'published' ? (
              <button onClick={handleUnpublish} disabled={publishing} className="btn-secondary gap-2">
                {publishing ? <Spinner size="sm" /> : <RotateCcw size={16} />}
                Unpublish
              </button>
            ) : (
              <button onClick={handlePublish} disabled={publishing} className="btn-primary gap-2">
                {publishing ? <Spinner size="sm" /> : <Send size={16} />}
                Publish Story
              </button>
            )}
            <button onClick={handleNewChapter} className="btn-secondary gap-2">
              <Plus size={18} />
              Add Chapter
            </button>
          </div>
        )}
      </div>

        {/* Chapter list + Manji AI panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {chapters.length === 0 ? (
              <div className="text-center py-20 glass-dark rounded-2xl border border-white/5">
                <FileText size={40} className="text-white/20 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No chapters yet</h3>
                <p className="text-white/40 text-sm mb-6">Create your first chapter to get started.</p>
                {isAuthor && (
                  <button
                    onClick={handleNewChapter}
                    className="btn-primary gap-2 inline-flex"
                  >
                    <Plus size={16} />
                    Create First Chapter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map((ch) => (
                  <ChapterRow
                    key={ch.id}
                    chapter={ch}
                    onEdit={handleEditChapter}
                    onDelete={handleChapterDeleted}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop AI assistant */}
          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-20">
              <ManjiAiPanel
                story={story}
                activeChapterId={editingChapter?.id}
                onInsert={handleAiInsert}
              />
            </div>
          </div>
        </div>

        {/* Chapter form modal */}
        {showForm && (
          <ChapterForm
            chapter={editingChapter}
            storySlug={slug}
            onClose={handleCloseForm}
            onSaved={handleChapterSaved}
            content={draftContent}
            onContentChange={setDraftContent}
          />
        )}

        {/* Mobile AI assistant */}
        <button
          onClick={() => setShowAiMobile(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 p-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-2xl shadow-black/50 hover:opacity-90 transition-opacity"
          title="Ask Manji AI"
        >
          <Sparkles size={20} />
        </button>
        {showAiMobile && (
          <div className="fixed inset-0 z-50 lg:hidden flex items-end">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowAiMobile(false)}
            />
            <div className="relative w-full h-[82vh] flex flex-col">
              <ManjiAiPanel
                story={story}
                activeChapterId={editingChapter?.id}
                onInsert={handleAiInsert}
                onClose={() => setShowAiMobile(false)}
                className="h-full rounded-b-none rounded-t-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
