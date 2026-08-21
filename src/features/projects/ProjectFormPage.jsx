/**
 * ProjectFormPage – create / edit a project.
 *
 * The Create flow requires a project type AND an art style. The chosen art
 * style drives every future AI image-generation and character-consistency
 * prompt for this project.
 *
 * Routes:
 *   /projects/new        – create
 *   /projects/:id/edit   – edit
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronLeft, Upload, X, BookOpen, PenTool, Brush, Palette, Clapperboard } from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { Spinner, Input, Button } from '../../components/ui'
import { useContextualTour } from '../tour/TourContext'
import { projectsService, PROJECT_TYPES, ART_STYLES } from './projectsService'

const TYPE_ICONS = { story: BookOpen, comic: PenTool, manga: Brush, manhua: Palette, animation: Clapperboard }

const STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived' },
]

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium text-white/90 mb-2">
      {children}
      {required && <span className="text-orange-400 ml-1">*</span>}
    </label>
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

function TypeSelector({ value, onChange, error }) {
  return (
    <div data-tour="project-type">
      <FieldLabel required>Project Type</FieldLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PROJECT_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type.value]
          const active = value === type.value
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                active
                  ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50'
                  : 'border-white/15 bg-white/5 hover:border-white/40'
              }`}
            >
              <Icon size={22} className={active ? 'text-orange-400' : 'text-white/40'} />
              <div className="font-semibold text-white text-sm mt-2">{type.label}</div>
              <div className="text-white/40 text-xs mt-1 leading-snug">{type.description}</div>
            </button>
          )
        })}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function ArtStyleSelector({ value, description, onValue, onDescription, error }) {
  return (
    <div data-tour="art-style">
      <FieldLabel required>Art Style</FieldLabel>
      <p className="text-white/40 text-xs mb-3 -mt-1">
        Your chosen style is applied automatically to every AI image and
        character-generation request for this project.
      </p>
      <div className="flex flex-wrap gap-2">
        {ART_STYLES.map((style) => {
          const active = value === style.value
          return (
            <button
              key={style.value}
              type="button"
              onClick={() => onValue(style.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                active
                  ? 'border-transparent text-white bg-gradient-to-r from-orange-500 to-orange-600'
                  : 'border-white/20 text-white/50 bg-white/5 hover:border-white/40 hover:text-white/80'
              }`}
            >
              {style.label}
            </button>
          )
        })}
      </div>
      {value === 'custom' && (
        <Textarea
          label="Custom Style Description"
          required
          placeholder="Describe your style, e.g. 'Studio Ghibli inspired watercolor with soft lighting'"
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          rows={3}
        />
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function CoverUpload({ preview, onChange, onClear }) {
  return (
    <div>
      <FieldLabel>Cover Image</FieldLabel>
      <div
        className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-dashed border-white/20 hover:border-orange-500/50 transition-colors cursor-pointer flex items-center justify-center bg-white/5"
        onClick={() => document.getElementById('project-cover-input')?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="text-center px-4">
            <Upload size={26} className="text-white/30 mx-auto mb-2" />
            <p className="text-white/40 text-xs">Click to upload</p>
          </div>
        )}
      </div>
      <input
        id="project-cover-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}

export default function ProjectFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('story')
  const [artStyle, setArtStyle] = useState('anime')
  const [artStyleDescription, setArtStyleDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  // Show the "create a project" tour once, on the create flow only.
  useContextualTour('create_project', { enabled: !isEdit && !loading })

  useEffect(() => {
    if (!isEdit) return
    let active = true
    async function load() {
      setLoading(true)
      try {
        const res = await projectsService.getProject(id)
        const p = res.data
        if (!active) return
        setTitle(p.title || '')
        setDescription(p.description || '')
        setProjectType(p.project_type || 'story')
        setArtStyle(p.art_style || 'anime')
        setArtStyleDescription(p.art_style_description || '')
        setStatus(p.status || 'active')
        if (p.cover) setCoverPreview(p.cover)
      } catch {
        toast.error('Failed to load project.')
        navigate('/projects')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id, isEdit, navigate])

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

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})

    const localErrors = {}
    if (!title.trim()) localErrors.title = 'Title is required.'
    if (!projectType) localErrors.project_type = 'Choose a project type.'
    if (!artStyle) localErrors.art_style = 'Choose an art style.'
    if (artStyle === 'custom' && !artStyleDescription.trim()) {
      localErrors.art_style_description = 'Describe your custom art style.'
    }
    if (Object.keys(localErrors).length) {
      setErrors(localErrors)
      return
    }

    setSaving(true)
    const fd = new FormData()
    fd.append('title', title.trim())
    fd.append('description', description.trim())
    fd.append('project_type', projectType)
    fd.append('art_style', artStyle)
    fd.append('art_style_description', artStyleDescription.trim())
    fd.append('status', status)
    if (coverFile) fd.append('cover', coverFile)

    try {
      if (isEdit) {
        await projectsService.updateProject(id, fd)
        toast.success('Project updated.')
        navigate(`/projects/${id}`)
      } else {
        const res = await projectsService.createProject(fd)
        toast.success('Project created! Welcome to Manji Studio.')
        navigate(`/projects/${res.data.id}`)
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
        toast.error(err?.response?.data?.error?.message || 'Failed to save project.')
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
        <div className="flex items-center gap-2 text-white/40 text-sm mb-8">
          <Link to="/projects" className="hover:text-white transition-colors flex items-center gap-1">
            <ChevronLeft size={16} />
            Projects
          </Link>
          <span>/</span>
          <span className="text-white/70">{isEdit ? 'Edit Project' : 'New Project'}</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {isEdit ? 'Edit Project' : 'Create a New Project'}
        </h1>
        <p className="text-white/50 text-sm mb-8">
          {isEdit
            ? 'Update your project details.'
            : 'From imagination to animation — pick a type and art style to begin.'}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <CoverUpload preview={coverPreview} onChange={handleCoverChange} onClear={clearCover} />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <Input
                  id="title"
                  label="Title"
                  required
                  placeholder="e.g. The World Beyond"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                />
                <Textarea
                  label="Description"
                  placeholder="What is this project about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={errors.description}
                  rows={4}
                />
              </div>
            </div>

            <TypeSelector value={projectType} onChange={setProjectType} error={errors.project_type} />

            <ArtStyleSelector
              value={artStyle}
              description={artStyleDescription}
              onValue={setArtStyle}
              onDescription={setArtStyleDescription}
              error={errors.art_style || errors.art_style_description}
            />

            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-10 pt-6 border-t border-white/10">
            <Link to={isEdit ? `/projects/${id}` : '/projects'} className="btn-ghost">
              Cancel
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}