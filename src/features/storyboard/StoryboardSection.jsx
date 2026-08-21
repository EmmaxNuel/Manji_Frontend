/**
 * StoryboardSection – the Storyboard tab inside MANJI STUDIO (Phase 6).
 *
 * Turns each scene into a shot list: creators add panels (shots) with
 * thumbnail, camera setup (shot size, movement, aspect ratio), timing and
 * on-screen text. The board is grouped by scene and ordered like a shooting
 * script. Animation (Phase 8) and audio (Phase 9) read these panels as their
 * input.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Film, X, ImagePlus,
} from 'lucide-react'
import { Spinner, Badge } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { scenesService } from '../scenes/scenesService'
import {
  storyboardService, shotTypes, cameraMovements, aspectRatios,
  shotLabel, movementLabel,
} from './storyboardService'

const field =
  'w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm'

const EMPTY_FORM = {
  id: null, sceneId: '', shot: 'medium', camera_movement: 'static',
  aspect_ratio: '16:9', duration: '', dialogue: '', narration: '', notes: '',
  image: null, imagePreview: '',
}

export default function StoryboardSection({ project }) {
  const [groups, setGroups] = useState([])
  const [scenes, setScenes] = useState([])
  const [sceneId, setSceneId] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await scenesService.getScenes(project.id)
      const list = res.data || []
      setScenes(list)
      setSceneId((prev) => (prev && list.some((s) => s.id === prev) ? prev : (list[0]?.id || '')))
    } catch {
      toast.error('Failed to load scenes.')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  const loadBoard = useCallback(async () => {
    if (!sceneId) { setGroups([]); return }
    try {
      const groups = await storyboardService.list(project.id, { scene: sceneId })
      setGroups(groups || [])
    } catch {
      toast.error('Failed to load storyboard.')
    }
  }, [project.id, sceneId])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadBoard() }, [loadBoard])

  const activeGroup = useMemo(
    () => groups.find((g) => g.scene.id === sceneId) || null,
    [groups, sceneId],
  )
  const panels = activeGroup?.panels || []

  function openCreate() {
    setEditing({ ...EMPTY_FORM, sceneId })
    setShowForm(true)
  }

  function openEdit(panel) {
    setEditing({
      id: panel.id,
      sceneId,
      shot: panel.shot || 'medium',
      camera_movement: panel.camera_movement || 'static',
      aspect_ratio: panel.aspect_ratio || '16:9',
      duration: panel.duration ?? '',
      dialogue: panel.dialogue || '',
      narration: panel.narration || '',
      notes: panel.notes || '',
      image: null,
      imagePreview: panel.image_url || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!editing?.sceneId) { toast.error('Choose a scene first.'); return }
    setSaving(true)
    const payload = {
      scene_id: editing.sceneId,
      shot: editing.shot,
      camera_movement: editing.camera_movement,
      aspect_ratio: editing.aspect_ratio,
      duration: editing.duration ? Number(editing.duration) : null,
      dialogue: editing.dialogue,
      narration: editing.narration,
      notes: editing.notes,
    }
    try {
      if (editing.id) {
        await storyboardService.update(editing.id, payload)
        toast.success('Panel updated.')
      } else {
        const form = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) form.append(k, v)
        })
        if (editing.image) form.append('image', editing.image)
        await storyboardService.create(project.id, form)
        toast.success('Panel added.')
      }
      setShowForm(false)
      setEditing(null)
      loadBoard()
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to save panel.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(panel) {
    if (!window.confirm(`Delete shot ${panel.order}? This cannot be undone.`)) return
    try {
      await storyboardService.remove(panel.id)
      toast.success('Panel deleted.')
      loadBoard()
    } catch {
      toast.error('Failed to delete panel.')
    }
  }

  async function handleMove(index, direction) {
    const ordered = panels.map((p) => p.id)
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= ordered.length) return
    const next = [...panels]
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    const reordered = ordered.map((id) => id)
    ;[reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]]
    setGroups((prev) => prev.map((g) => (g.scene.id === sceneId ? { ...g, panels: next } : g)))
    try {
      await storyboardService.reorder(project.id, sceneId, reordered)
      loadBoard()
    } catch {
      toast.error('Reorder failed to save.')
      loadBoard()
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !editing) return
    setUploading(true)
    try {
      const url = URL.createObjectURL(file)
      setEditing({ ...editing, image: file, imagePreview: url })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div data-tour="storyboard-section">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Storyboard</h2>
          <p className="text-white/50 text-sm mt-1">
            Break each scene into shots — the visual script for animation and audio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 rounded-lg border border-white/20 bg-[var(--color-card)] text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={sceneId}
            onChange={(e) => setSceneId(e.target.value)}
          >
            {scenes.length === 0 && <option value="">No scenes yet</option>}
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                #{scene.order} {scene.title}
              </option>
            ))}
          </select>
          <button onClick={openCreate} disabled={!scenes.length} className="btn-primary text-sm px-4 py-2.5 justify-center" data-tour="storyboard-add-panel">
            <Plus size={16} /> Add shot
          </button>
        </div>
      </div>

      {scenes.length === 0 ? (
        <div className="card p-10">
          <ManjiGuide
            expression="curious" size="lg"
            message="Add scenes in the Scenes tab first — each scene becomes a row of shots on this board."
          />
        </div>
      ) : panels.length === 0 ? (
        <div className="card p-10">
          <ManjiGuide
            expression="excited" size="lg" animated="bounce"
            message={`"${activeGroup?.scene.title || 'This scene'}" has no shots yet. Add the first shot to start visualising it.`}
          >
            <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5 justify-center">
              <Film size={16} /> Add the first shot
            </button>
          </ManjiGuide>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {panels.map((panel, index) => (
            <div key={panel.id} className="card overflow-hidden group relative">
              <div className="relative bg-black/60 aspect-video flex items-center justify-center overflow-hidden">
                {panel.image_url ? (
                  <img src={panel.image_url} alt={`Shot ${panel.order}`} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="text-white/30 flex flex-col items-center gap-2">
                    <Film size={28} />
                    <span className="text-xs">No thumbnail</span>
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-md">
                  #{panel.order}
                </span>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 rounded-md bg-black/50 hover:bg-black/80 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === panels.length - 1}
                    className="p-1.5 rounded-md bg-black/50 hover:bg-black/80 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="accent">{shotLabel(panel.shot)}</Badge>
                  <Badge>{movementLabel(panel.camera_movement)}</Badge>
                  {panel.duration && <Badge>{panel.duration}s</Badge>}
                </div>
                {panel.dialogue && (
                  <p className="text-white/70 text-xs mt-2 italic line-clamp-2">“{panel.dialogue}”</p>
                )}
                {panel.notes && <p className="text-white/40 text-xs mt-1 line-clamp-2">{panel.notes}</p>}
                <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => openEdit(panel)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(panel)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel form */}
      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{editing.id ? 'Edit shot' : 'Add shot'}</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="label">Thumbnail</label>
              <div className="flex items-center gap-3">
                {editing.imagePreview ? (
                  <img src={editing.imagePreview} alt="Preview" className="w-24 h-16 object-cover rounded-lg border border-white/20" />
                ) : (
                  <div className="w-24 h-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/40">
                    <ImagePlus size={20} />
                  </div>
                )}
                <label className="btn-ghost text-sm px-3 py-2 cursor-pointer">
                  {editing.imagePreview ? 'Change image' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Shot type</label>
                <select
                  className={`${field} bg-[var(--color-card)]`}
                  value={editing.shot}
                  onChange={(e) => setEditing({ ...editing, shot: e.target.value })}
                >
                  {shotTypes.map((shot) => (
                    <option key={shot.value} value={shot.value}>{shot.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Camera movement</label>
                <select
                  className={`${field} bg-[var(--color-card)]`}
                  value={editing.camera_movement}
                  onChange={(e) => setEditing({ ...editing, camera_movement: e.target.value })}
                >
                  {cameraMovements.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Aspect ratio</label>
                <select
                  className={`${field} bg-[var(--color-card)]`}
                  value={editing.aspect_ratio}
                  onChange={(e) => setEditing({ ...editing, aspect_ratio: e.target.value })}
                >
                  {aspectRatios.map((ratio) => (
                    <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Duration (seconds)</label>
                <input
                  className={field}
                  type="number"
                  min="0"
                  value={editing.duration}
                  onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                  placeholder="e.g. 3"
                />
              </div>
            </div>

            <div>
              <label className="label">On-screen dialogue</label>
              <textarea
                className={`${field} resize-none`}
                rows={2}
                value={editing.dialogue}
                onChange={(e) => setEditing({ ...editing, dialogue: e.target.value })}
                placeholder="What's said in this shot"
              />
            </div>
            <div>
              <label className="label">Narration / caption</label>
              <textarea
                className={`${field} resize-none`}
                rows={2}
                value={editing.narration}
                onChange={(e) => setEditing({ ...editing, narration: e.target.value })}
                placeholder="Narration or caption text"
              />
            </div>
            <div>
              <label className="label">Director notes</label>
              <textarea
                className={`${field} resize-none`}
                rows={2}
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                placeholder="How to shoot this — staging, blocking, camera height…"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2.5 justify-center">
                Cancel
              </button>
              <button type="submit" disabled={saving || uploading} className="btn-primary text-sm px-4 py-2.5 justify-center">
                {saving || uploading ? <Spinner size="sm" /> : 'Save shot'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}