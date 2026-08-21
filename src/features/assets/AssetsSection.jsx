/**
 * AssetsSection – the Assets tab inside MANJI STUDIO (Phase 5).
 *
 * A project-scoped media library. Creators upload concept art, references,
 * video plates, audio takes, documents and more, tag them with a project
 * vocabulary, and browse/filter them. Later phases (storyboard, animation,
 * audio) consume these assets as their source material.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, Search, UploadCloud, File, X, Film, Music, FileText,
  RefreshCw, Eye, Download,
} from 'lucide-react'
import { Spinner, Badge } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import {
  assetsService, assetKinds, formatBytes,
  isImageAsset, isVideoAsset, isAudioAsset,
} from './assetsService'

const field =
  'w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm'

const KIND_ICONS = { image: File, video: Film, audio: Music, document: FileText, other: File }

function kindLabel(value) {
  return assetKinds.find((k) => k.value === value)?.label || 'Other'
}

function AssetThumb({ asset }) {
  const { url, kind, mime_type: mime, title } = asset
  if (isImageAsset(kind, mime)) {
    return (
      <img
        src={url}
        alt={title || 'Asset'}
        className="w-full h-40 object-cover"
        loading="lazy"
      />
    )
  }
  if (isVideoAsset(kind, mime)) {
    return (
      <div className="w-full h-40 bg-black/60 flex items-center justify-center overflow-hidden">
        <video src={url} className="w-full h-full object-contain" controls muted preload="metadata" />
      </div>
    )
  }
  if (isAudioAsset(kind, mime)) {
    return (
      <div className="w-full h-40 bg-black/60 flex flex-col items-center justify-center gap-2 px-3">
        <Music size={28} className="text-orange-400" />
        <audio src={url} controls className="w-full" />
      </div>
    )
  }
  const Icon = KIND_ICONS[kind] || File
  return (
    <div className="w-full h-40 bg-black/60 flex flex-col items-center justify-center gap-2 text-white/60">
      <Icon size={32} />
      <span className="text-xs">{kindLabel(kind)}</span>
    </div>
  )
}

export default function AssetsSection({ project }) {
  const [assets, setAssets] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [kindFilter, setKindFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (kindFilter) params.kind = kindFilter
      if (tagFilter) params.tag = tagFilter
      if (search.trim()) params.search = search.trim()
      const res = await assetsService.list(project.id, params)
      setAssets(res || [])
    } catch {
      toast.error('Failed to load assets.')
    } finally {
      setLoading(false)
    }
  }, [project.id, kindFilter, tagFilter, search])

  const loadTags = useCallback(async () => {
    try {
      const res = await assetsService.listTags(project.id)
      setTags(res || [])
    } catch {
      // Tags are non-critical.
    }
  }, [project.id])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadTags() }, [loadTags])

  function openCreate() {
    setEditing({ id: null, title: '', description: '', kind: '', tags: '' })
    setShowForm(true)
  }

  function openEdit(asset) {
    setEditing({
      id: asset.id,
      title: asset.title || '',
      description: asset.description || '',
      kind: asset.kind || '',
      tags: (asset.tags || []).join(', '),
      asset,
    })
    setShowForm(true)
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file || uploading) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('title', file.name)
    try {
      const asset = await assetsService.upload(project.id, form)
      toast.success('Asset uploaded.')
      await load()
      await loadTags()
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!editing?.id) return
    setSaving(true)
    const payload = {
      title: editing.title.trim(),
      description: editing.description.trim(),
      kind: editing.kind || undefined,
      tags: editing.tags,
    }
    try {
      await assetsService.update(editing.id, payload)
      toast.success('Asset updated.')
      setShowForm(false)
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update asset.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(asset) {
    if (!window.confirm(`Delete "${asset.title || 'this asset'}"? This cannot be undone.`)) return
    try {
      await assetsService.remove(asset.id)
      toast.success('Asset deleted.')
      load()
      loadTags()
    } catch {
      toast.error('Failed to delete asset.')
    }
  }

  const filteredKinds = useMemo(() => {
    const counts = {}
    assets.forEach((a) => { counts[a.kind] = (counts[a.kind] || 0) + 1 })
    return assetKinds.filter((k) => counts[k.value])
  }, [assets])

  return (
    <div data-tour="assets-section">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Assets</h2>
          <p className="text-white/50 text-sm mt-1">
            Concept art, references, video, audio and documents for this project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { load(); loadTags() }}
            className="btn-ghost text-sm px-3 py-2.5 justify-center"
            title="Refresh"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary text-sm px-4 py-2.5 justify-center"
          >
            <Plus size={16} /> Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            data-tour="asset-upload-input"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setKindFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              !kindFilter
                ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            All
          </button>
          {filteredKinds.map((kind) => (
            <button
              key={kind.value}
              onClick={() => setKindFilter(kind.value === kindFilter ? '' : kind.value)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                kindFilter === kind.value
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {kind.label}
            </button>
          ))}
        </div>
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white/30 text-xs">Tags:</span>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setTagFilter(tag.name === tagFilter ? '' : tag.name)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  tagFilter === tag.name
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="pl-9 pr-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : assets.length === 0 ? (
        <div className="card p-10">
          {tags.length === 0 && !search && !kindFilter ? (
            <ManjiGuide
              expression="excited" size="lg" animated="bounce"
              message="Your project library is empty. Upload concept art, references, audio takes or documents — they'll feed the storyboard, animation and audio pipeline."
            >
              <button onClick={() => fileInputRef.current?.click()} className="btn-primary text-sm px-4 py-2.5 justify-center">
                <UploadCloud size={16} /> Upload your first asset
              </button>
            </ManjiGuide>
          ) : (
            <ManjiGuide
              expression="thinking" size="lg"
              message="No assets match your filters — try clearing the search or tag filter."
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="card overflow-hidden group relative">
              <AssetThumb asset={asset} />
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-medium text-sm truncate" title={asset.title}>
                    {asset.title || 'Untitled'}
                  </h3>
                  <Badge variant="accent">{kindLabel(asset.kind)}</Badge>
                </div>
                {asset.description && (
                  <p className="text-white/40 text-xs mt-1 line-clamp-2">{asset.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/30 text-[11px]">{formatBytes(asset.size)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreview(asset)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                      title="Preview"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => openEdit(asset)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="card p-6 flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-white/70 text-sm">Uploading…</p>
          </div>
        </div>
      )}

      {/* Edit form */}
      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Edit asset</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="label">Title</label>
              <input
                className={field}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="e.g. Kai concept art"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className={`${field} resize-none`}
                rows={3}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="What is this asset for?"
              />
            </div>
            <div>
              <label className="label">Kind</label>
              <select
                className={`${field} bg-[var(--color-card)]`}
                value={editing.kind}
                onChange={(e) => setEditing({ ...editing, kind: e.target.value })}
              >
                <option value="">Auto</option>
                {assetKinds.map((kind) => (
                  <option key={kind.value} value={kind.value}>{kind.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tags (comma separated)</label>
              <input
                className={field}
                value={editing.tags}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                placeholder="e.g. kai, key art, chapter 3"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2.5 justify-center">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2.5 justify-center">
                {saving ? <Spinner size="sm" /> : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">{preview.title || 'Asset'}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={preview.url}
                  download
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <AssetThumb asset={preview} />
            <p className="text-white/40 text-sm mt-2">{preview.description || ''}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="accent">{kindLabel(preview.kind)}</Badge>
              {(preview.tags || []).map((tag) => (
                <Badge key={tag}>#{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}