/**
 * AudioSection – the Voice Studio tab inside MANJI STUDIO (Phase 9).
 *
 * Records and organises the project's audio: dialogue takes, voice-overs,
 * music and sound effects. Every clip can be attached to a real Scene and,
 * for voice, to a real Character (picked from the cast — never free text) so
 * the data stays structured for casting and the animation/audio pipeline.
 * Clips within a scene are placed on a timeline by start offset.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Upload, Mic, RefreshCw, Clock, Music } from 'lucide-react'
import { Spinner, Badge } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { scenesService } from '../scenes/scenesService'
import { charactersService } from '../characters/charactersService'
import { audioService, audioKinds, kindLabel, formatSeconds } from './audioService'

const field =
  'w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm'

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="h-4 w-1 rounded-full bg-gradient-to-b from-orange-500 to-orange-600" />
      <span className="text-xs font-semibold tracking-widest uppercase text-orange-400/90">{children}</span>
    </div>
  )
}

const EMPTY_FORM = {
  id: null,
  title: '',
  kind: 'dialogue',
  description: '',
  sceneId: '',
  characterId: '',
  dialogue_line: '',
  order: '',
  start_seconds: '',
  file: null,
}

export default function AudioSection({ project }) {
  const [recordings, setRecordings] = useState([])
  const [scenes, setScenes] = useState([])
  const [characters, setCharacters] = useState([])
  const [sceneId, setSceneId] = useState('')
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await audioService.list(project.id)
      setRecordings(list || [])
    } catch {
      toast.error('Failed to load audio.')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  const loadOptions = useCallback(async () => {
    try {
      const [sceneRes, charRes] = await Promise.all([
        scenesService.getScenes(project.id),
        charactersService.getCharacters(project.id),
      ])
      const sceneList = sceneRes.data || []
      setScenes(sceneList)
      setCharacters(charRes.data || [])
      setSceneId((prev) => (prev && sceneList.some((s) => s.id === prev) ? prev : (sceneList[0]?.id || '')))
    } catch {
      // Options are non-critical.
    }
  }, [project.id])

  const loadTimeline = useCallback(async () => {
    if (!sceneId) { setTimeline([]); return }
    setLoadingTimeline(true)
    try {
      const rows = await audioService.timeline(project.id, sceneId)
      setTimeline(rows || [])
    } catch {
      setTimeline([])
    } finally {
      setLoadingTimeline(false)
    }
  }, [project.id, sceneId])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadOptions() }, [loadOptions])
  useEffect(() => { loadTimeline() }, [loadTimeline])

  const activeScene = useMemo(() => scenes.find((s) => s.id === sceneId) || null, [scenes, sceneId])

  function openCreate() {
    setEditing({ ...EMPTY_FORM, sceneId })
    setShowForm(true)
  }

  function openEdit(rec) {
    setEditing({
      id: rec.id,
      title: rec.title || '',
      kind: rec.kind || 'dialogue',
      description: rec.description || '',
      sceneId: rec.scene || '',
      characterId: rec.character || '',
      dialogue_line: rec.dialogue_line || '',
      order: rec.order ?? '',
      start_seconds: rec.start_seconds ?? '',
      file: null,
    })
    setShowForm(true)
  }

  function toFormData() {
    const fd = new FormData()
    fd.append('title', editing.title.trim())
    fd.append('kind', editing.kind)
    fd.append('description', editing.description.trim())
    if (editing.sceneId) fd.append('scene', editing.sceneId)
    if (editing.characterId) fd.append('character', editing.characterId)
    if (editing.dialogue_line.trim()) fd.append('dialogue_line', editing.dialogue_line.trim())
    if (editing.order !== '' && editing.order !== null) fd.append('order', Number(editing.order))
    if (editing.start_seconds !== '' && editing.start_seconds !== null) {
      fd.append('start_seconds', Number(editing.start_seconds))
    }
    if (editing.file) fd.append('file', editing.file)
    return fd
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!editing?.id && !editing?.file) { toast.error('Choose an audio file to upload.'); return }
    setSaving(true)
    try {
      if (editing.id) {
        await audioService.update(editing.id, toFormData())
        toast.success('Recording updated.')
      } else {
        await audioService.upload(project.id, toFormData())
        toast.success('Recording added to the voice studio.')
      }
      setShowForm(false)
      setEditing(null)
      load()
      loadTimeline()
    } catch (err) {
      const message = err?.response?.data?.error?.fields
        ? Object.values(err.response.data.error.fields).flat().join(' ')
        : (err?.response?.data?.error?.message || 'Failed to save recording.')
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(rec) {
    if (!window.confirm(`Delete "${rec.title || 'this recording'}"? This cannot be undone.`)) return
    try {
      await audioService.remove(rec.id)
      toast.success('Recording deleted.')
      load()
      loadTimeline()
    } catch {
      toast.error('Failed to delete recording.')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div data-tour="audio-section">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Voice Studio</h2>
          <p className="text-white/50 text-sm mt-1">
            Dialogue takes, voice-overs, music and sound effects for {project.title}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { load(); loadOptions(); loadTimeline() }}
            className="btn-ghost text-sm px-3 py-2.5 justify-center"
            title="Refresh"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5 justify-center">
            <Plus size={16} /> Add recording
          </button>
        </div>
      </div>

      {/* Scene timeline selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-white/40 text-xs uppercase tracking-wide">Timeline</span>
        <select
          className="px-3 py-2 rounded-lg border border-white/20 bg-[var(--color-card)] text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={sceneId}
          onChange={(e) => setSceneId(e.target.value)}
          data-tour="audio-scene-select"
        >
          {scenes.length === 0 && <option value="">No scenes yet</option>}
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              #{scene.order} {scene.title}
            </option>
          ))}
        </select>
      </div>

      {recordings.length === 0 ? (
        <div className="card p-10">
          <ManjiGuide
            expression="excited" size="lg" animated="bounce"
            title="No recordings yet"
            body="Record dialogue, voice-overs, music or sound effects, attach them to a scene and a character, and lay them out on the timeline."
          >
            <button onClick={openCreate} className="btn-primary inline-flex">
              <Mic size={16} className="mr-1" /> Add your first recording
            </button>
          </ManjiGuide>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* All recordings */}
          <div className="space-y-3">
            <SectionLabel>All clips</SectionLabel>
            {recordings.map((rec) => (
              <div key={rec.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent">{kindLabel(rec.kind)}</Badge>
                      {rec.character_name && <Badge>{rec.character_name}</Badge>}
                      {rec.scene_title && <Badge>{rec.scene_title}</Badge>}
                    </div>
                    <h3 className="text-white font-semibold mt-2 truncate" title={rec.title}>{rec.title}</h3>
                    {rec.dialogue_line && (
                      <p className="text-white/50 text-sm mt-1 italic">“{rec.dialogue_line}”</p>
                    )}
                    {rec.description && (
                      <p className="text-white/40 text-xs mt-1 line-clamp-2">{rec.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(rec)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(rec)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {rec.url && <audio src={rec.url} controls className="w-full mt-3" />}
                <div className="flex items-center gap-3 mt-2 text-white/30 text-[11px]">
                  <span className="flex items-center gap-1"><Clock size={11} /> {formatSeconds(rec.duration)}</span>
                  {rec.start_seconds != null && rec.start_seconds > 0 && (
                    <span>starts at {formatSeconds(rec.start_seconds)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Scene timeline */}
          <div className="space-y-3">
            <SectionLabel>
              Timeline {activeScene ? `— ${activeScene.title}` : ''}
            </SectionLabel>
            {scenes.length === 0 || !sceneId ? (
              <div className="card p-6">
                <ManjiGuide expression="curious" size="md" message="Add scenes in the Scenes tab to lay your clips out on a scene timeline." />
              </div>
            ) : loadingTimeline ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : timeline.length === 0 ? (
              <div className="card p-6">
                <ManjiGuide expression="thinking" size="md" message={`"${activeScene?.title || 'This scene'}" has no clips yet. Add one and set its scene to place it here.`} />
              </div>
            ) : (
              <div className="space-y-2">
                {timeline.map((row) => (
                  <div key={row.id} className="card p-3 flex items-center gap-3">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-orange-400 font-mono text-sm font-semibold">{formatSeconds(row.start_seconds)}</div>
                      <div className="text-white/30 text-[10px] uppercase tracking-wide">start</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="accent">{kindLabel(row.kind)}</Badge>
                        {row.character_name && <Badge>{row.character_name}</Badge>}
                      </div>
                      <div className="text-white text-sm font-medium mt-1 truncate">{row.title}</div>
                      {row.dialogue_line && (
                        <div className="text-white/40 text-xs italic truncate">“{row.dialogue_line}”</div>
                      )}
                    </div>
                    {row.url && <audio src={row.url} controls preload="none" className="w-40 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && editing && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true"
          onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-2xl my-8 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-500/15 text-orange-400"><Mic size={18} /></div>
                <div>
                  <h3 className="text-white font-semibold">{editing.id ? 'Edit recording' : 'Add recording'}</h3>
                  <p className="text-white/40 text-xs">{project.title}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {!editing.id && (
              <div>
                <SectionLabel>Audio file</SectionLabel>
                <label className={`relative w-full rounded-xl border-2 border-dashed border-white/20 hover:border-orange-500/50 transition-colors cursor-pointer flex items-center justify-center bg-white/5 p-6 ${editing.file ? 'border-orange-500/50' : ''}`}>
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setEditing({ ...editing, file: f, title: editing.title || f.name })
                  }} />
                  <div className="text-center">
                    {editing.file ? (
                      <>
                        <Music size={24} className="text-orange-400 mx-auto mb-2" />
                        <p className="text-white/70 text-sm">{editing.file.name}</p>
                        <p className="text-white/40 text-xs mt-1">Click to change</p>
                      </>
                    ) : (
                      <>
                        <Upload size={24} className="text-white/30 mx-auto mb-2" />
                        <p className="text-white/50 text-sm">Upload an audio clip</p>
                        <p className="text-white/30 text-xs mt-1">WAV, MP3, OGG &amp; more</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}

            <div>
              <SectionLabel>Metadata</SectionLabel>
              <div className="space-y-4">
                <div>
                  <label className="label">Title</label>
                  <input className={field} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Kai — line 1 {take 2}" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kind</label>
                    <select className={`${field} bg-[var(--color-card)]`} value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
                      {audioKinds.map((k) => (
                        <option key={k.value} value={k.value}>{k.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Character</label>
                    <select className={`${field} bg-[var(--color-card)]`} value={editing.characterId} onChange={(e) => setEditing({ ...editing, characterId: e.target.value })}>
                      <option value="">No character</option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {characters.length === 0 && (
                      <p className="text-white/30 text-[11px] mt-1">Add characters first to link voices to the cast.</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Scene</label>
                    <select className={`${field} bg-[var(--color-card)]`} value={editing.sceneId} onChange={(e) => setEditing({ ...editing, sceneId: e.target.value })}>
                      <option value="">No scene</option>
                      {scenes.map((s) => (
                        <option key={s.id} value={s.id}>#{s.order} {s.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Start (seconds)</label>
                    <input type="number" min="0" step="0.1" className={field} value={editing.start_seconds} onChange={(e) => setEditing({ ...editing, start_seconds: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="label">Spoken line / dialogue</label>
                  <textarea className={`${field} resize-none`} rows={2} value={editing.dialogue_line} onChange={(e) => setEditing({ ...editing, dialogue_line: e.target.value })} placeholder="The line this clip reads, e.g. “Do you trust me?”" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className={`${field} resize-none`} rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Delivery notes, usage, mood…" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm px-6 justify-center">
                {saving ? <Spinner size="sm" /> : null}
                {editing.id ? 'Save changes' : 'Add recording'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
