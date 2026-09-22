/**
 * AnimationSection – the Animation tab inside MANJI STUDIO (Phase 8).
 *
 * Two views: a list of animation projects for this project, and the
 * timeline editor. Drawing happens locally on a canvas; only the finished
 * frame data is sent to Django on explicit save.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, ChevronLeft, Save, Play, Pause, Eye, EyeOff,
  Layers, Film, Copy, Undo2, Redo2, Eraser, Paintbrush, Minus, X,
} from 'lucide-react'
import { Spinner, Badge } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { scenesService } from '../scenes/scenesService'
import { animationService } from './animationService'

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

/* ─── Drawing Canvas ───────────────────────────────────────────────────── */

const CANVAS_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#94a3b8',
]

function DrawingCanvas({ width, height, frameData, activeLayerId, tool, brushSize, brushColor, onionSkinData, onDrawEnd }) {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const isDrawing = useRef(false)
  const currentStroke = useRef([])

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    // Onion skin (previous frame, ghosted)
    if (onionSkinData && activeLayerId) {
      ctx.globalAlpha = 0.2
      const layerData = onionSkinData[activeLayerId]
      if (layerData?.strokes) {
        layerData.strokes.forEach((stroke) => drawStroke(ctx, stroke))
      }
      ctx.globalAlpha = 1.0
    }

    // Draw all visible layers
    const layerIds = frameData ? Object.keys(frameData) : []
    for (const lid of layerIds) {
      const layerData = frameData[lid]
      if (!layerData?.strokes) continue
      layerData.strokes.forEach((stroke) => drawStroke(ctx, stroke))
    }

    // Draw current in-progress stroke
    if (currentStroke.current.length > 0) {
      drawStroke(ctx, { tool, color: brushColor, size: brushSize, points: currentStroke.current })
    }
  }, [width, height, frameData, activeLayerId, tool, brushColor, brushSize, onionSkinData])

  useEffect(() => { renderCanvas() }, [renderCanvas])

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handleDown(e) {
    isDrawing.current = true
    currentStroke.current = [getPos(e)]
  }

  function handleMove(e) {
    if (!isDrawing.current) return
    currentStroke.current.push(getPos(e))
    renderCanvas()
  }

  function handleUp() {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (currentStroke.current.length < 1) return
    const stroke = { tool, color: tool === 'eraser' ? '#ffffff' : brushColor, size: tool === 'eraser' ? brushSize * 3 : brushSize, points: [...currentStroke.current] }
    currentStroke.current = []
    onDrawEnd(stroke)
  }

  return (
    <div className="relative bg-[#1a1a2e] rounded-lg overflow-hidden border border-white/10" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
      />
    </div>
  )
}

function drawStroke(ctx, stroke) {
  if (!stroke.points || stroke.points.length < 1) return
  ctx.save()
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#1a1a2e' : stroke.color
  ctx.lineWidth = stroke.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
  ctx.beginPath()
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
  }
  ctx.stroke()
  ctx.restore()
}

/* ─── Editor View ──────────────────────────────────────────────────────── */

function AnimationEditor({ animation: anim, onBack, scenes }) {
  const [layers, setLayers] = useState([])
  const [frames, setFrames] = useState([])
  const [activeFrameIdx, setActiveFrameIdx] = useState(0)
  const [activeLayerId, setActiveLayerId] = useState('')
  const [frameData, setFrameData] = useState({})
  const [tool, setTool] = useState('brush')
  const [brushColor, setBrushColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(4)
  const [onionSkin, setOnionSkin] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const playRef = useRef(null)
  const playIdxRef = useRef(0)

  const activeFrame = frames[activeFrameIdx]
  const activeLayer = layers.find((l) => l.id === activeLayerId)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const detail = await animationService.get(anim.id)
      const data = detail.data || anim
      setLayers(data.layers || [])
      setFrames(data.frames || [])
      setActiveFrameIdx(0)
      if (data.layers?.length) setActiveLayerId(data.layers[0].id)
      // Restore frame data from backend
      const fd = {}
      ;(data.frames || []).forEach((f) => { fd[f.index] = f.layers || {} })
      setFrameData(fd)
      setDirty(false)
    } catch {
      toast.error('Failed to load animation.')
    } finally {
      setLoading(false)
    }
  }, [anim.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (activeFrame && layers.length && !activeLayerId) {
      setActiveLayerId(layers[0].id)
    }
  }, [activeFrame, layers, activeLayerId])

  const currentOnionSkin = onionSkin && activeFrameIdx > 0
    ? frameData[activeFrameIdx - 1]
    : null

  function handleDrawEnd(stroke) {
    setFrameData((prev) => {
      const fi = activeFrame?.index ?? activeFrameIdx
      const frame = prev[fi] || {}
      const layerId = activeLayerId || 'default'
      const layerStrokes = frame[layerId]?.strokes || []
      return {
        ...prev,
        [fi]: {
          ...frame,
          [layerId]: { strokes: [...layerStrokes, stroke] },
        },
      }
    })
    setDirty(true)
  }

  async function handleSave() {
    if (!activeFrame) return
    setSaving(true)
    try {
      const layersJson = frameData[activeFrame.index] || {}
      await animationService.updateFrame(activeFrame.id, { layers: layersJson })
      setDirty(false)
      toast.success('Frame saved.')
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddFrame() {
    try {
      const nextIdx = activeFrame ? activeFrame.index + 1 : frames.length
      await animationService.createFrame(anim.id, { index: nextIdx })
      await load()
      setActiveFrameIdx((prev) => prev + 1)
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to add frame.')
    }
  }

  async function handleDuplicateFrame() {
    if (!activeFrame) return
    try {
      const nextIdx = activeFrame.index + 1
      await animationService.createFrame(anim.id, { index: nextIdx, duplicate_from: activeFrame.id })
      await load()
      setActiveFrameIdx((prev) => prev + 1)
    } catch (err) {
      toast.error('Failed to duplicate frame.')
    }
  }

  async function handleDeleteFrame() {
    if (!activeFrame) return
    if (!window.confirm(`Delete frame ${activeFrame.index + 1}? This cannot be undone.`)) return
    try {
      await animationService.removeFrame(activeFrame.id)
      await load()
    } catch {
      toast.error('Failed to delete frame.')
    }
  }

  async function handleAddLayer() {
    try {
      await animationService.createLayer(anim.id, { name: `Layer ${layers.length + 1}`, kind: 'character' })
      await load()
    } catch {
      toast.error('Failed to add layer.')
    }
  }

  async function handleToggleLayer(layer) {
    try {
      await animationService.updateLayer(layer.id, { visible: !layer.visible })
      setLayers((prev) => prev.map((l) => l.id === layer.id ? { ...l, visible: !l.visible } : l))
    } catch {
      toast.error('Failed to update layer.')
    }
  }

  async function handleDeleteLayer(layer) {
    if (!window.confirm(`Delete layer "${layer.name}"? This cannot be undone.`)) return
    try {
      await animationService.removeLayer(layer.id)
      await load()
    } catch {
      toast.error('Failed to delete layer.')
    }
  }

  // Playback
  function togglePlayback() {
    if (isPlaying) {
      clearInterval(playRef.current)
      setIsPlaying(false)
      return
    }
    playIdxRef.current = activeFrameIdx
    playRef.current = setInterval(() => {
      playIdxRef.current += 1
      if (playIdxRef.current >= frames.length) playIdxRef.current = 0
      setActiveFrameIdx(playIdxRef.current)
    }, 1000 / (anim.fps || 12))
    setIsPlaying(true)
  }

  useEffect(() => () => { if (playRef.current) clearInterval(playRef.current) }, [])

  // Undo: remove last stroke from current layer/frame
  function handleUndo() {
    const fi = activeFrame?.index
    if (fi === undefined || fi === null) return
    setFrameData((prev) => {
      const frame = { ...prev[fi] }
      const layerId = activeLayerId || 'default'
      const layer = frame[layerId]
      if (!layer?.strokes?.length) return prev
      return {
        ...prev,
        [fi]: { ...frame, [layerId]: { strokes: layer.strokes.slice(0, -1) } },
      }
    })
    setDirty(true)
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors" title="Back to list">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-white">{anim.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="accent">{anim.fps} fps</Badge>
              <Badge>{anim.width}×{anim.height}</Badge>
              {anim.scene && <Badge>Scene: {anim.scene.title}</Badge>}
              {dirty && <Badge variant="warning">Unsaved</Badge>}
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !dirty} className="btn-primary text-sm px-4 py-2.5 justify-center">
          {saving ? <Spinner size="sm" /> : <Save size={14} />} Save frame
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        {/* Canvas + Tools */}
        <div className="space-y-3">
          {/* Drawing tools */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-white/20 bg-white/5">
              <button onClick={() => setTool('brush')} className={`px-3 py-2 text-sm transition-colors ${tool === 'brush' ? 'text-orange-400 bg-orange-500/15' : 'text-white/60 hover:text-white'}`} title="Brush">
                <Paintbrush size={15} />
              </button>
              <button onClick={() => setTool('eraser')} className={`px-3 py-2 text-sm transition-colors ${tool === 'eraser' ? 'text-orange-400 bg-orange-500/15' : 'text-white/60 hover:text-white'}`} title="Eraser">
                <Eraser size={15} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {CANVAS_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setBrushColor(c); setTool('brush') }}
                  className={`w-6 h-6 rounded-full border-2 transition-colors ${brushColor === c ? 'border-orange-500 scale-110' : 'border-white/20 hover:border-white/50'}`}
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-white/50 text-xs">Size:</span>
              <input type="range" min="1" max="30" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-20 accent-orange-500" />
              <span className="text-white/60 text-xs w-6 text-right">{brushSize}</span>
            </div>
            <button onClick={handleUndo} className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors ml-2" title="Undo last stroke">
              <Undo2 size={14} />
            </button>
            <label className="flex items-center gap-1.5 text-white/60 text-xs ml-2 cursor-pointer select-none">
              <input type="checkbox" checked={onionSkin} onChange={(e) => setOnionSkin(e.target.checked)} className="accent-orange-500 w-3.5 h-3.5" />
              Onion skin
            </label>
          </div>
          {/* Canvas */}
          <DrawingCanvas
            width={anim.width}
            height={anim.height}
            frameData={frameData[activeFrame?.index] || {}}
            activeLayerId={activeLayerId}
            tool={tool}
            brushSize={brushSize}
            brushColor={brushColor}
            onionSkinData={currentOnionSkin}
            onDrawEnd={handleDrawEnd}
          />
        </div>

        {/* Layer panel */}
        <div className="space-y-3">
          <div className="card p-3">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Layers</SectionLabel>
              <button onClick={handleAddLayer} className="p-1.5 rounded-lg bg-white/5 hover:bg-orange-500/15 text-white/60 hover:text-orange-400 transition-colors" title="Add layer">
                <Plus size={14} />
              </button>
            </div>
            {layers.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-4">No layers yet. Add one to start drawing.</p>
            ) : (
              <div className="space-y-1">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      activeLayerId === layer.id ? 'bg-orange-500/15 border border-orange-500/30' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeLayerId === layer.id ? 'bg-orange-500' : 'bg-white/30'}`} />
                    <span className="text-white/80 text-xs truncate flex-1">{layer.name}</span>
                    <Badge variant="default">{animationService.LAYER_KINDS.find((k) => k.value === layer.kind)?.label || layer.kind}</Badge>
                    <button onClick={(e) => { e.stopPropagation(); handleToggleLayer(layer) }} className="text-white/50 hover:text-white transition-colors" title={layer.visible ? 'Hide' : 'Show'}>
                      {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteLayer(layer) }} className="text-red-400/60 hover:text-red-400 transition-colors" title="Delete layer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline + Playback */}
      <div className="card p-3 mt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={togglePlayback} className="p-2.5 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition-colors" title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <span className="text-white/50 text-xs">
              Frame {activeFrameIdx + 1} / {frames.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleAddFrame} className="btn-ghost text-xs px-3 py-1.5 justify-center"><Plus size={12} /> Add frame</button>
            <button onClick={handleDuplicateFrame} disabled={!activeFrame} className="btn-ghost text-xs px-3 py-1.5 justify-center"><Copy size={12} /> Duplicate</button>
            <button onClick={handleDeleteFrame} disabled={!activeFrame} className="btn-ghost text-xs px-3 py-1.5 justify-center text-red-400 hover:bg-red-500/10"><Trash2 size={12} /> Delete</button>
          </div>
        </div>
        {/* Frame strip */}
        <div className="mt-3 overflow-x-auto pb-1">
          {frames.length === 0 ? (
            <p className="text-white/40 text-xs text-center py-4">No frames yet. Add your first frame to begin animating.</p>
          ) : (
            <div className="flex gap-2">
              {frames.map((frame, i) => (
                <button
                  key={frame.id}
                  onClick={() => setActiveFrameIdx(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-mono transition-colors ${
                    i === activeFrameIdx
                      ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/30'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── List View ────────────────────────────────────────────────────────── */

export default function AnimationSection({ project }) {
  const [animations, setAnimations] = useState([])
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedAnim, setSelectedAnim] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editingAnim, setEditingAnim] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await animationService.list(project.id)
      setAnimations(res.data || [])
    } catch {
      toast.error('Failed to load animations.')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    scenesService.getScenes(project.id)
      .then((res) => setScenes(res.data || []))
      .catch(() => {})
  }, [project.id])

  function openCreate() {
    setEditing({ title: '', scene: '', fps: 12 })
    setShowForm(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: editing.title.trim() || project.title,
      fps: editing.fps || 12,
      scene: editing.scene || undefined,
    }
    try {
      const res = await animationService.create(project.id, payload)
      toast.success('Animation created.')
      setShowForm(false)
      setSelectedAnim(res.data)
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create animation.')
    } finally {
      setSaving(false)
    }
  }

  function openEditAnim(anim) {
    setEditingAnim({ id: anim.id, title: anim.title, fps: anim.fps, scene: anim.scene?.id || '' })
    setShowEditForm(true)
  }

  async function handleEditAnim(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await animationService.update(editingAnim.id, {
        title: editingAnim.title.trim(),
        fps: editingAnim.fps,
        scene: editingAnim.scene || null,
      })
      toast.success('Animation updated.')
      setShowEditForm(false)
      setEditingAnim(null)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update animation.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAnim(anim) {
    if (!window.confirm(`Delete animation "${anim.title}"? This cannot be undone.`)) return
    try {
      await animationService.remove(anim.id)
      toast.success('Animation deleted.')
      load()
    } catch {
      toast.error('Failed to delete animation.')
    }
  }

  // Editor view
  if (selectedAnim) {
    return (
      <AnimationEditor
        animation={selectedAnim}
        onBack={() => { setSelectedAnim(null); load() }}
        scenes={scenes}
      />
    )
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div data-tour="animation-section">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Animation</h2>
          <p className="text-white/50 text-sm mt-1">
            Timeline-based 2D animation — draw, layer, and playback your scenes.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5 justify-center">
          <Plus size={16} /> New animation
        </button>
      </div>

      {animations.length === 0 ? (
        <div className="card p-10">
          <ManjiGuide
            expression="excited" size="lg" animated="bounce"
            title="No animations yet"
            body="Create your first animation project to start drawing, layering and timing your scenes."
          >
            <button onClick={openCreate} className="btn-primary inline-flex">
              <Plus size={16} className="mr-1" /> Create an animation
            </button>
          </ManjiGuide>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {animations.map((anim) => (
            <div key={anim.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Film size={16} className="text-orange-400 flex-shrink-0" />
                    <h3 className="text-white font-semibold truncate">{anim.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="accent">{anim.fps} fps</Badge>
                    <Badge>{anim.width}×{anim.height}</Badge>
                    <Badge>{anim.frame_count} frames</Badge>
                    <Badge>{anim.layer_count} layers</Badge>
                  </div>
                  {anim.scene && (
                    <p className="text-white/40 text-xs mt-2">Scene: {anim.scene.title}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <button onClick={() => openEditAnim(anim)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDeleteAnim(anim)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedAnim(anim)} className="w-full mt-4 btn-primary text-sm py-2.5 justify-center">
                Open editor
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">New animation</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="label">Title</label>
              <input className={field} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder={`Default: ${project.title}`} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Scene (optional)</label>
                <select className={`${field} bg-[var(--color-card)]`} value={editing.scene} onChange={(e) => setEditing({ ...editing, scene: e.target.value })}>
                  <option value="">No linked scene</option>
                  {scenes.map((s) => (
                    <option key={s.id} value={s.id}>#{s.order} {s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Frame rate (fps)</label>
                <input type="number" min="1" max="60" className={field} value={editing.fps} onChange={(e) => setEditing({ ...editing, fps: Number(e.target.value) || 12 })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2.5 justify-center">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2.5 justify-center">
                {saving ? <Spinner size="sm" /> : 'Create animation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit form */}
      {showEditForm && editingAnim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditForm(false)}>
          <form
            onSubmit={handleEditAnim}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Edit animation</h3>
              <button type="button" onClick={() => setShowEditForm(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="label">Title</label>
              <input className={field} value={editingAnim.title} onChange={(e) => setEditingAnim({ ...editingAnim, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Scene</label>
                <select className={`${field} bg-[var(--color-card)]`} value={editingAnim.scene} onChange={(e) => setEditingAnim({ ...editingAnim, scene: e.target.value })}>
                  <option value="">No linked scene</option>
                  {scenes.map((s) => (
                    <option key={s.id} value={s.id}>#{s.order} {s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Frame rate (fps)</label>
                <input type="number" min="1" max="60" className={field} value={editingAnim.fps} onChange={(e) => setEditingAnim({ ...editingAnim, fps: Number(e.target.value) || 12 })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowEditForm(false)} className="btn-ghost text-sm px-4 py-2.5 justify-center">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2.5 justify-center">
                {saving ? <Spinner size="sm" /> : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}