/**
 * StorySection – the Story tab inside MANJI STUDIO (Phase 2).
 *
 * Shows the project's linked story with its chapters, or helps the creator
 * create / link one. Writing and chapter management live in the existing
 * Creator Studio pages; this section keeps the project context around it.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookOpen, Plus, Pencil, Link2, Unlink, ArrowRight } from 'lucide-react'
import { Spinner, Badge, Input } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { projectsService, projectTypeLabel } from './projectsService'
import { storyService } from '../../services/storyService'

export default function StorySection({ project }) {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [storyId, setStoryId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await projectsService.getProjectStory(project.id)
      setPayload(res.data)
    } catch {
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => { load() }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Give your story a title.'); return }
    setSaving(true)
    try {
      const res = await projectsService.createStory(project.id, {
        title: title.trim(),
        description: description.trim(),
      })
      toast.success('Story created and linked.')
      setShowCreate(false)
      setTitle('')
      setDescription('')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create story.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLink(e) {
    e.preventDefault()
    if (!storyId.trim()) { toast.error('Enter a story ID.'); return }
    setSaving(true)
    try {
      await projectsService.linkStory(project.id, storyId.trim())
      toast.success('Story linked.')
      setShowLink(false)
      setStoryId('')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to link story.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnlink() {
    if (!window.confirm('Unlink this story from the project? The story itself is not deleted.')) return
    try {
      await projectsService.unlinkStory(project.id)
      toast.success('Story unlinked.')
      load()
    } catch {
      toast.error('Failed to unlink story.')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  const story = payload?.story

  return (
    <div data-tour="story-section">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Story</h2>
          <p className="text-white/50 text-sm mt-1">
            The written heart of the project — chapters break the story into scenes.
          </p>
        </div>
        {story && (
          <div className="flex items-center gap-2">
            <Link to={`/create/${story.slug}/edit`} className="btn-primary text-sm px-4 py-2.5 justify-center">
              <Pencil size={15} /> Edit Story
            </Link>
            <Link to={`/create/${story.slug}/chapters`} className="btn-secondary text-sm px-4 py-2.5 justify-center">
              <BookOpen size={15} /> Chapters
            </Link>
            <button onClick={handleUnlink} className="btn-ghost text-sm text-white/50 hover:text-white" title="Unlink story" aria-label="Unlink story">
              <Unlink size={15} />
            </button>
          </div>
        )}
      </div>

      {!story ? (
        <div className="card p-10">
          <ManjiGuide
            expression="thinking" size="lg" animated="nod"
            title="No story yet"
            body={`This is a ${projectTypeLabel(project.project_type)} project. Write your story here, or link an existing one, then break it into chapters and scenes.`}
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex">
                <Plus size={16} className="mr-1" /> Write a story
              </button>
              <button onClick={() => setShowLink(true)} className="btn-secondary inline-flex">
                <Link2 size={16} className="mr-1" /> Link existing story
              </button>
            </div>
          </ManjiGuide>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">{story.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="primary">{story.content_type}</Badge>
                  <Badge>{story.status}</Badge>
                </div>
                {story.description && (
                  <p className="text-white/60 text-sm mt-3 leading-relaxed">{story.description}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-white/40">
                  <span>{payload.progress?.total_chapters ?? 0} chapters</span>
                  <span>{payload.progress?.total_words ?? 0} words</span>
                  <span>{payload.progress?.published_chapters ?? 0} published</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white/90">Chapters</h4>
              <Link to={`/create/${story.slug}/chapters`} className="text-orange-400 text-xs hover:underline inline-flex items-center gap-1">
                Manage chapters <ArrowRight size={12} />
              </Link>
            </div>
            <ChapterList storySlug={story.slug} />
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-lg rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <h3 className="text-white font-semibold">Write a story for this project</h3>
              <p className="text-white/40 text-xs mt-1">Chapters and scenes build on this story.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Input id="story-title" label="Title" required placeholder="e.g. The World Beyond" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div>
                <label htmlFor="story-desc" className="label">Description</label>
                <textarea
                  id="story-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm resize-none"
                  placeholder="What is this story about?"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm px-6 justify-center">
                  {saving ? <Spinner size="sm" /> : null} Create Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLink && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <h3 className="text-white font-semibold">Link an existing story</h3>
              <p className="text-white/40 text-xs mt-1">Paste the story's UUID below.</p>
            </div>
            <form onSubmit={handleLink} className="p-6 space-y-4">
              <Input id="link-story-id" label="Story ID" required placeholder="Paste story UUID" value={storyId} onChange={(e) => setStoryId(e.target.value)} />
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowLink(false)} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm px-6 justify-center">
                  {saving ? <Spinner size="sm" /> : null} Link Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ChapterList({ storySlug }) {
  const [chapters, setChapters] = useState(null)
  useEffect(() => {
    let active = true
    storyService.getChapters(storySlug)
      .then((res) => { if (active) setChapters(res.data || []) })
      .catch(() => { if (active) setChapters([]) })
    return () => { active = false }
  }, [storySlug])

  if (chapters === null) return <div className="flex justify-center py-8"><Spinner /></div>
  if (chapters.length === 0) return <p className="text-white/50 text-sm">No chapters yet. Add your first chapter from the chapter manager.</p>
  return (
    <ol className="space-y-2">
      {chapters.map((ch) => (
        <li key={ch.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 font-mono text-xs font-semibold flex-shrink-0">
            {ch.chapter_number}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-white font-medium text-sm truncate">{ch.title}</div>
            <div className="text-white/40 text-xs">{ch.word_count} words · {ch.status}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}