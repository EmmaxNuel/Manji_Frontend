/**
 * CreateStoryPage.jsx
 *
 * Handles both:
 *   /create/new           – create a new story
 *   /create/:slug/edit    – edit an existing story
 *
 * Loads genres from the API. Allows cover upload preview.
 * Saves as draft or publishes immediately.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Upload, X, ChevronLeft, ImageIcon } from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../context/AuthContext'
import { storyService } from '../../services/storyService'
import { Spinner, Input, Button } from '../../components/ui'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONTENT_TYPES = [
  { value: 'novel',       label: 'Novel' },
  { value: 'short_story', label: 'Short Story' },
  { value: 'web_novel',   label: 'Web Novel' },
  { value: 'comic',       label: 'Comic' },
  { value: 'manga',       label: 'Manga' },
  { value: 'manhua',      label: 'Manhua' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'pt', label: 'Portuguese' },
]

const STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus',    label: 'On Hiatus' },
]

// ---------------------------------------------------------------------------
// Field wrappers styled to match the project
// ---------------------------------------------------------------------------
function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium text-white/90 mb-2">
      {children}
      {required && <span className="text-orange-400 ml-1">*</span>}
    </label>
  )
}

function Select({ label, required, error, children, ...props }) {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <select
        className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm"
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function Textarea({ label, required, error, ...props }) {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <textarea
        className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm resize-none"
        rows={5}
        {...props}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Genre multi-select chips
// ---------------------------------------------------------------------------
function GenreSelector({ genres, selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((g) => {
        const active = selected.includes(g.id)
        return (
          <button
            key={g.id}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((id) => id !== g.id) : [...selected, g.id])
            }
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              active
                ? 'border-transparent text-white'
                : 'border-white/20 text-white/50 bg-white/5 hover:border-white/40 hover:text-white/80'
            }`}
            style={active ? { background: g.color, borderColor: g.color } : {}}
          >
            {g.name}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cover upload / preview
// ---------------------------------------------------------------------------
function CoverUpload({ preview, onChange, onClear }) {
  const inputRef = useRef(null)

  return (
    <div>
      <FieldLabel>Cover Image</FieldLabel>
      <div
        className="relative w-36 h-48 rounded-xl overflow-hidden border-2 border-dashed border-white/20 hover:border-orange-500/50 transition-colors cursor-pointer group flex items-center justify-center bg-white/5"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="text-center px-4">
            <ImageIcon size={28} className="text-white/30 mx-auto mb-2" />
            <p className="text-white/40 text-xs">Click to upload</p>
            <p className="text-white/25 text-xs mt-1">JPG, PNG, WebP</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Upload size={20} className="text-white" />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      <p className="text-white/30 text-xs mt-2">Recommended: 400×600px</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tags input (comma-separated or Enter)
// ---------------------------------------------------------------------------
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')

  function addTag(raw) {
    const names = raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    const next = [...new Set([...tags, ...names])]
    onChange(next)
    setInput('')
  }

  function removeTag(t) {
    onChange(tags.filter((x) => x !== t))
  }

  return (
    <div>
      <FieldLabel>Tags</FieldLabel>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs border border-orange-500/30"
          >
            {t}
            <button type="button" onClick={() => removeTag(t)} className="hover:text-white">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            if (input.trim()) addTag(input)
          }
        }}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder="Type a tag and press Enter…"
        className="input-field"
      />
      <p className="text-white/30 text-xs mt-1">Separate with comma or Enter</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CreateStoryPage() {
  const { slug } = useParams()       // undefined = new story
  const isEdit = Boolean(slug)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('novel')
  const [language, setLanguage] = useState('en')
  const [storyStatus, setStoryStatus] = useState('draft')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [tags, setTags] = useState([])
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [genreRes] = await Promise.all([storyService.getGenres()])
        setGenres(genreRes.data || [])

        if (isEdit) {
          const storyRes = await storyService.getStory(slug)
          const s = storyRes.data
          setTitle(s.title || '')
          setDescription(s.description || '')
          setContentType(s.content_type || 'novel')
          setLanguage(s.language || 'en')
          setStoryStatus(s.status || 'draft')
          setSelectedGenres((s.genres || []).map((g) => g.id))
          setTags((s.tags || []).map((t) => t.name))
          if (s.cover) setCoverPreview(s.cover)
        }
      } catch {
        toast.error('Failed to load form data.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [slug, isEdit])

  function handleCoverChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function clearCover() {
    setCoverFile(null)
    setCoverPreview(null)
  }

  async function handleSubmit(e, forcedStatus) {
    e.preventDefault()
    setErrors({})

    const localErrors = {}
    if (!title.trim()) localErrors.title = 'Title is required.'
    if (!description.trim()) localErrors.description = 'Description is required.'
    if (Object.keys(localErrors).length) {
      setErrors(localErrors)
      return
    }

    setSaving(true)
    const fd = new FormData()
    fd.append('title', title.trim())
    fd.append('description', description.trim())
    fd.append('content_type', contentType)
    fd.append('language', language)
    fd.append('status', forcedStatus || storyStatus)
    selectedGenres.forEach((id) => fd.append('genres', id))
    tags.forEach((t) => fd.append('tag_names', t))
    if (coverFile) fd.append('cover', coverFile)

    try {
      if (isEdit) {
        await storyService.updateStory(slug, fd)
        toast.success('Story updated.')
        navigate('/create')
      } else {
        const res = await storyService.createStory(fd)
        toast.success('Story created! Now add your first chapter.')
        navigate(`/create/${res.data.slug}/chapters`)
      }
    } catch (err) {
      const details = err?.response?.data?.error?.details
      if (details && typeof details === 'object') {
        const fieldErrors = {}
        Object.entries(details).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v[0] : v
        })
        setErrors(fieldErrors)
      } else {
        toast.error(err?.response?.data?.error?.message || 'Failed to save story.')
      }
    } finally {
      setSaving(false)
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

  return (
    <MainLayout>
      <div className="page-container py-10 max-w-4xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/40 text-sm mb-8">
          <Link to="/create" className="hover:text-white transition-colors flex items-center gap-1">
            <ChevronLeft size={16} />
            Creator Studio
          </Link>
          <span>/</span>
          <span className="text-white/70">{isEdit ? 'Edit Story' : 'New Story'}</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-8">
          {isEdit ? 'Edit Story' : 'Create a New Story'}
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left column – cover */}
            <div className="lg:col-span-1">
              <CoverUpload
                preview={coverPreview}
                onChange={handleCoverChange}
                onClear={clearCover}
              />
            </div>

            {/* Right column – details */}
            <div className="lg:col-span-2 space-y-6">

              <Input
                id="title"
                label="Title"
                required
                placeholder="Your story title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
              />

              <Textarea
                label="Description"
                required
                placeholder="Tell readers what your story is about…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={errors.description}
                rows={6}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Content Type"
                  required
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>

                <Select
                  label="Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </Select>
              </div>

              <Select
                label="Status"
                value={storyStatus}
                onChange={(e) => setStoryStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>

              {/* Genres */}
              <div>
                <FieldLabel>Genres</FieldLabel>
                <GenreSelector
                  genres={genres}
                  selected={selectedGenres}
                  onChange={setSelectedGenres}
                />
              </div>

              {/* Tags */}
              <TagInput tags={tags} onChange={setTags} />

            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-10 pt-6 border-t border-white/10">
            <Link to="/create" className="btn-ghost">
              Cancel
            </Link>
            <button
              type="button"
              disabled={saving}
              onClick={(e) => {
                const prev = storyStatus
                setStoryStatus('draft')
                handleSubmit(e, 'draft').finally(() => setStoryStatus(prev))
              }}
              className="btn-secondary"
            >
              {saving ? <Spinner size="sm" /> : null}
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Spinner size="sm" /> : null}
              {storyStatus === 'published'
                ? (isEdit ? 'Save & Publish' : 'Create & Publish')
                : (isEdit ? 'Save Changes' : 'Create Story')}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
