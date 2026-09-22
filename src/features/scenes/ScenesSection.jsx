/**
 * ScenesSection – the Scenes tab inside MANJI STUDIO (Phase 2).
 *
 * Lists a project's scenes (optionally filtered by chapter), lets the
 * creator add / edit / delete scenes, and reorder them. Scenes are the
 * junction where story, characters, storyboard, voice and animation connect
 * in later phases, so every field here is captured for that future pipeline.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, Clock, MapPin, ChevronUp, ChevronDown, Wand2, X, Clapperboard,
  UserPlus, Search,
} from 'lucide-react'
import { Spinner, Badge } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { scenesService } from './scenesService'
import { storyService } from '../../services/storyService'
import { charactersService } from '../characters/charactersService'

const EMPTY_FORM = {
  title: '', description: '', location: '', cast: [], dialogue: '',
  narration: '', camera_type: '', camera_notes: '', mood: '', duration: '', chapter: '',
}

const field =
  'w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm'

const CAMERA_TYPES = [
  { value: 'wide_shot', label: 'Wide Shot' },
  { value: 'medium_shot', label: 'Medium Shot' },
  { value: 'close_up', label: 'Close-Up' },
  { value: 'extreme_close_up', label: 'Extreme Close-Up' },
  { value: 'over_the_shoulder', label: 'Over-the-Shoulder' },
  { value: 'pov', label: 'POV' },
  { value: 'establishing_shot', label: 'Establishing Shot' },
  { value: 'tracking_shot', label: 'Tracking Shot' },
  { value: 'aerial', label: 'Aerial' },
]

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="h-4 w-1 rounded-full bg-gradient-to-b from-orange-500 to-orange-600" />
      <span className="text-xs font-semibold tracking-widest uppercase text-orange-400/90">{children}</span>
    </div>
  )
}

function CharacterChipPicker({ projectId, characters, selected, onChange }) {
  const [query, setQuery] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('supporting')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((c) => c.name.toLowerCase().includes(q))
  }, [characters, query])

  const selectedMap = useMemo(() => {
    const map = new Map()
    selected.forEach((id) => {
      const c = characters.find((ch) => ch.id === id)
      if (c) map.set(id, c)
    })
    return map
  }, [selected, characters])

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      const res = await charactersService.createCharacter(projectId, {
        name,
        role: newRole,
      })
      onChange([...selected, res.data.id])
      setNewName('')
      setNewRole('supporting')
      setShowPicker(false)
    } catch {
      toast.error('Failed to create character.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <label className="label">Characters</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((id) => {
          const c = selectedMap.get(id)
          if (!c) return null
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-300 text-xs border border-orange-500/30"
            >
              {c.name}
              <button
                type="button"
                onClick={() => onChange(selected.filter((x) => x !== id))}
                className="hover:text-white transition-colors"
                aria-label={`Remove ${c.name}`}
              >
                <X size={10} />
              </button>
            </span>
          )
        })}
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-white/20 text-white/60 hover:text-white hover:border-orange-500/40 text-xs transition-colors"
        >
          <UserPlus size={10} /> Add character
        </button>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-sm rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-orange-400" />
                <h4 className="text-white font-semibold text-sm">Characters</h4>
              </div>
              <button onClick={() => setShowPicker(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white" aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  className={`${field} pl-9`}
                  placeholder="Search characters…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="text-white/50 text-sm text-center py-6">
                    {characters.length === 0 ? 'No characters yet.' : 'No matches.'}
                  </p>
                )}
                {filtered.map((c) => {
                  const active = selected.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onChange(active ? selected.filter((x) => x !== c.id) : [...selected, c.id])}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${
                        active ? 'bg-orange-500/15 border border-orange-500/30' : 'hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.name} className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {c.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium truncate">{c.name}</div>
                        <div className="text-white/40 text-xs">{c.role_label || c.role}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="text-xs text-white/50 mb-2">Create a new character</p>
                <div className="flex gap-2">
                  <input
                    className={`${field} flex-1`}
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <select
                    className={`${field} w-28`}
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    {charactersService.ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="btn-primary w-full justify-center mt-2 text-sm"
                >
                  {creating ? 'Creating…' : 'Create & Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SceneForm({ projectId, initial, chapters, characters, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  function set(fieldName, value) {
    setForm((prev) => ({ ...prev, [fieldName]: value }))
    setErrors((prev) => ({ ...prev, [fieldName]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const localErrors = {}
    if (!form.title.trim()) localErrors.title = 'Give this scene a title.'
    const cast = Array.isArray(form.cast) ? form.cast : []
    onSubmit({
      ...form,
      title: form.title.trim(),
      cast,
      duration: form.duration ? Number(form.duration) : null,
      chapter: form.chapter || null,
    }, localErrors, setErrors)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <SectionLabel>Basics</SectionLabel>
        <div className="space-y-4">
          <div>
            <label className="label">Scene title <span className="text-orange-400">*</span></label>
            <input className={field} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. The Mysterious Laptop" autoFocus />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input className={field} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Kai's bedroom" />
            </div>
            <div>
              <label className="label">Mood</label>
              <input className={field} value={form.mood} onChange={(e) => set('mood', e.target.value)} placeholder="e.g. tense, dreamlike, comedic" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Camera type</label>
              <select className={`${field} bg-[var(--color-card)]`} value={form.camera_type} onChange={(e) => set('camera_type', e.target.value)}>
                <option value="">—</option>
                {CAMERA_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Duration</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  className={field}
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  placeholder="e.g. 45"
                />
                <span className="text-white/40 text-sm whitespace-nowrap">sec</span>
              </div>
            </div>
          </div>

          <CharacterChipPicker
            projectId={projectId}
            characters={characters}
            selected={form.cast || []}
            onChange={(cast) => set('cast', cast)}
          />

          {chapters.length > 0 && (
            <div>
              <label className="label">Chapter</label>
              <select className={`${field} bg-[var(--color-card)]`} value={form.chapter || ''} onChange={(e) => set('chapter', e.target.value)}>
                <option value="">No chapter (project-level)</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>Chapter {ch.chapter_number} — {ch.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionLabel>Narrative</SectionLabel>
        <div className="space-y-4">
          <div>
            <label className="label">Description</label>
            <textarea className={`${field} resize-none`} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What happens in this scene?" />
          </div>
          <div>
            <label className="label">Dialogue</label>
            <textarea className={`${field} resize-none`} rows={4} value={form.dialogue} onChange={(e) => set('dialogue', e.target.value)} placeholder="What is said in this scene?" />
          </div>
          <div>
            <label className="label">Narration</label>
            <textarea className={`${field} resize-none`} rows={4} value={form.narration} onChange={(e) => set('narration', e.target.value)} placeholder="What the narrator tells the audience." />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Production</SectionLabel>
        <div className="space-y-4">
          <div>
            <label className="label">Camera notes</label>
            <textarea className={`${field} resize-none`} rows={2} value={form.camera_notes} onChange={(e) => set('camera_notes', e.target.value)} placeholder="e.g. Wide shot, then slow push-in on the laptop." />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary text-sm px-6 justify-center">
          {saving ? <Spinner size="sm" /> : null}
          {initial.id ? 'Save Changes' : 'Add Scene'}
        </button>
      </div>
    </form>
  )
}

export default function ScenesSection({ project, onOpenStoryboard }) {
  const [scenes, setScenes] = useState([])
  const [chapters, setChapters] = useState([])
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [chapterFilter, setChapterFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [scenesRes, charsRes] = await Promise.all([
        scenesService.getScenes(project.id),
        charactersService.getCharacters(project.id),
      ])
      setScenes(scenesRes.data || [])
      setCharacters(charsRes.data || [])
    } catch {
      toast.error('Failed to load scenes.')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!project.story?.slug) { setChapters([]); return }
    let active = true
    storyService.getChapters(project.story.slug)
      .then((res) => { if (active) setChapters(res.data || []) })
      .catch(() => { if (active) setChapters([]) })
    return () => { active = false }
  }, [project.story?.slug])

  const filtered = useMemo(() => {
    if (!chapterFilter) return scenes
    return scenes.filter((s) => (s.chapter?.id || '') === chapterFilter)
  }, [scenes, chapterFilter])

  function openCreate() {
    setEditing({ ...EMPTY_FORM, id: null, cast: [] })
    setShowForm(true)
  }

  function openEdit(scene) {
    setEditing({
      id: scene.id,
      title: scene.title,
      description: scene.description || '',
      location: scene.location || '',
      cast: (scene.cast || []).map((c) => c.id),
      dialogue: scene.dialogue || '',
      narration: scene.narration || '',
      camera_type: scene.camera_type || '',
      camera_notes: scene.camera_notes || '',
      mood: scene.mood || '',
      duration: scene.duration ?? '',
      chapter: scene.chapter?.id || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(payload, localErrors, setErrors) {
    if (Object.keys(localErrors).length) { setErrors(localErrors); return }
    setSaving(true)
    try {
      if (editing?.id) {
        await scenesService.updateScene(editing.id, payload)
        toast.success('Scene updated.')
      } else {
        await scenesService.createScene(project.id, payload)
        toast.success('Scene added.')
      }
      setShowForm(false)
      setEditing(null)
      load()
    } catch (err) {
      const details = err?.response?.data?.error?.details
      if (details && typeof details === 'object') {
        Object.entries(details).forEach(([k, v]) =>
          setErrors((prev) => ({ ...prev, [k]: Array.isArray(v) ? v[0] : v })))
      } else {
        toast.error(err?.response?.data?.error?.message || 'Failed to save scene.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(scene) {
    if (!window.confirm(`Delete scene "${scene.title}"? This cannot be undone.`)) return
    try {
      await scenesService.deleteScene(scene.id)
      toast.success('Scene deleted.')
      load()
    } catch {
      toast.error('Failed to delete scene.')
    }
  }

  async function handleMove(index, direction) {
    const ordered = filtered.map((s) => s.id)
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= ordered.length) return
    ;[ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]]
    const current = filtered[index]
    const target = filtered[swapIndex]
    const next = scenes.map((s) => {
      if (s.id === current.id) return { ...s, order: target.order }
      if (s.id === target.id) return { ...s, order: current.order }
      return s
    })
    setScenes(next)
    try {
      await scenesService.reorderScenes(project.id, ordered)
    } catch {
      toast.error('Reorder failed to save.')
      load()
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div data-tour="scenes-section">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Scenes</h2>
          <p className="text-white/50 text-sm mt-1">
            Break your story into scenes — each one becomes a shot list, storyboard and animation later.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {chapters.length > 0 && (
            <select
              className="px-3 py-2 rounded-lg border border-white/20 bg-[var(--color-card)] text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
            >
              <option value="">All scenes</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>Chapter {ch.chapter_number} — {ch.title}</option>
              ))}
            </select>
          )}
          <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5 justify-center">
            <Plus size={16} /> Add Scene
          </button>
        </div>
      </div>

      {scenes.length === 0 ? (
        <div className="card p-10">
          <ManjiGuide
            expression="excited" size="lg" animated="bounce"
            title="No scenes yet"
            body="Scenes turn your story into shots. Add your first scene to begin the storyboard and animation pipeline."
          >
            <button onClick={openCreate} className="btn-primary inline-flex">
              <Plus size={16} className="mr-1" /> Add your first scene
            </button>
          </ManjiGuide>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-white/50 text-sm">No scenes in this chapter yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((scene, index) => (
            <div key={scene.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white/30 text-xs font-mono">#{scene.order}</span>
                    <h3 className="text-white font-semibold truncate">{scene.title}</h3>
                    {scene.chapter && <Badge>Ch. {scene.chapter.chapter_number}</Badge>}
                    {scene.mood && <Badge variant="primary">{scene.mood}</Badge>}
                    {scene.camera_type && (
                      <Badge variant="accent">
                        {CAMERA_TYPES.find((ct) => ct.value === scene.camera_type)?.label || scene.camera_type}
                      </Badge>
                    )}
                  </div>
                  {scene.description && (
                    <p className="text-white/60 text-sm mt-2 line-clamp-2">{scene.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-white/40">
                    {scene.location && (
                      <span className="inline-flex items-center gap-1"><MapPin size={12} /> {scene.location}</span>
                    )}
                    {scene.duration != null && (
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {scene.duration}s</span>
                    )}
                    {(scene.characters?.length > 0 || scene.cast?.length > 0) && (
                      <span className="inline-flex items-center gap-1"><Wand2 size={12} /> {(scene.characters || []).join(', ')}</span>
                    )}
                  </div>
                  {scene.camera_notes && (
                    <p className="text-white/40 text-xs mt-2 italic">🎥 {scene.camera_notes}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition-colors" title="Move up" aria-label={`Move ${scene.title} up`}>
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => handleMove(index, 1)} disabled={index === filtered.length - 1} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition-colors" title="Move down" aria-label={`Move ${scene.title} down`}>
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <button onClick={() => onOpenStoryboard?.()} className="p-1.5 rounded-lg bg-white/5 hover:bg-orange-500/15 text-white/60 hover:text-orange-400 transition-colors" title="Open in Storyboard" aria-label={`Storyboard for ${scene.title}`}>
                      <Clapperboard size={14} />
                    </button>
                    <button onClick={() => openEdit(scene)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Edit" aria-label={`Edit ${scene.title}`}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(scene)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Delete" aria-label={`Delete ${scene.title}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-2xl rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-500/15 text-orange-400"><Wand2 size={18} /></div>
                <div>
                  <h3 className="text-white font-semibold">{editing?.id ? 'Edit Scene' : 'Add Scene'}</h3>
                  <p className="text-white/40 text-xs">{project.title}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <SceneForm
                projectId={project.id}
                initial={editing}
                chapters={chapters}
                characters={characters}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
                saving={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
