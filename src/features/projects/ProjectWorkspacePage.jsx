/**
 * ProjectWorkspacePage – MANJI STUDIO shell.
 *
 * The central workspace for a Project. The creator moves between sections
 * (Story, Characters, Scenes, Storyboard, Animation, Audio, Assets, Manji AI)
 * without losing project context. Phase 1 ships Overview + Story (when a
 * story is linked); the remaining sections arrive in later phases.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, BookOpen, Users, Film, Clapperboard, AudioLines,
  Boxes, Sparkles, Pencil, Settings, Trash2, ArrowLeft, Video, Link2, Search, X, Plus,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { Spinner, Badge } from '../../components/ui'
import { useContextualTour } from '../tour/TourContext'
import { projectsService, artStyleLabel, projectTypeLabel } from './projectsService'
import StorySection from './StorySection'
import ScenesSection from '../scenes/ScenesSection'
import CharactersSection from '../characters/CharactersSection'
import ManjiAiSection from '../ai/ManjiAiSection'
import AssetsSection from '../assets/AssetsSection'
import StoryboardSection from '../storyboard/StoryboardSection'
import AnimationSection from '../animation/AnimationSection'
import AudioSection from '../audio/AudioSection'

const SECTIONS = [
  { key: 'overview',    label: 'Overview',   Icon: LayoutDashboard },
  { key: 'story',       label: 'Story',      Icon: BookOpen },
  { key: 'characters',  label: 'Characters', Icon: Users },
  { key: 'scenes',      label: 'Scenes',     Icon: Film },
  { key: 'storyboard',  label: 'Storyboard', Icon: Clapperboard },
  { key: 'animation',  label: 'Animation',  Icon: Video },
  { key: 'audio',       label: 'Audio',      Icon: AudioLines },
  { key: 'assets',      label: 'Assets',     Icon: Boxes },
  { key: 'manji-ai',    label: 'Manji AI',   Icon: Sparkles },
]

export default function ProjectWorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('overview')
  const [showStoryPicker, setShowStoryPicker] = useState(false)
  const [storySearch, setStorySearch] = useState('')
  const [availableStories, setAvailableStories] = useState([])
  const [loadingStories, setLoadingStories] = useState(false)

  // One-time contextual tour of the studio shell.
  useContextualTour('project_workspace', { enabled: !loading && Boolean(project) })

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const res = await projectsService.getProject(id)
        if (active) setProject(res.data)
      } catch {
        if (active) {
          toast.error('Project not found.')
          navigate('/projects')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id, navigate])

  async function handleDelete() {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return
    try {
      await projectsService.deleteProject(id)
      toast.success('Project deleted.')
      navigate('/projects')
    } catch {
      toast.error('Failed to delete project.')
    }
  }

  async function openStoryPicker() {
    setShowStoryPicker(true)
    setStorySearch('')
    setLoadingStories(true)
    try {
      const res = await projectsService.getStoriesForLinking(id)
      setAvailableStories(res.data || [])
    } catch {
      toast.error('Failed to load stories.')
    } finally {
      setLoadingStories(false)
    }
  }

  async function searchStories() {
    setLoadingStories(true)
    try {
      const res = await projectsService.getStoriesForLinking(id, storySearch)
      setAvailableStories(res.data || [])
    } catch {
      toast.error('Failed to search stories.')
    } finally {
      setLoadingStories(false)
    }
  }

  async function handleLinkStory(story) {
    try {
      await projectsService.linkStory(id, story.id)
      toast.success(`Linked "${story.title}" to project.`)
      setShowStoryPicker(false)
      // Refresh project to show linked story
      const res = await projectsService.getProject(id)
      setProject(res.data)
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to link story.')
    }
  }

  async function handleUnlinkStory() {
    if (!window.confirm('Unlink the story from this project? The story itself will not be deleted.')) return
    try {
      await projectsService.unlinkStory(id)
      toast.success('Story unlinked from project.')
      const res = await projectsService.getProject(id)
      setProject(res.data)
    } catch {
      toast.error('Failed to unlink story.')
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

  if (!project) return null

  const ActiveIcon = SECTIONS.find((s) => s.key === section)?.Icon || LayoutDashboard

  return (
    <MainLayout>
      <div className="page-container py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
          <Link to="/projects" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft size={16} />
            Projects
          </Link>
          <span>/</span>
          <span className="text-white/70">{project.title}</span>
        </div>

        {/* MANJI STUDIO header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl overflow-hidden bg-gradient-to-br from-orange-500/30 to-purple-600/30 flex items-center justify-center flex-shrink-0">
              {project.cover ? (
                <img src={project.cover} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                <ActiveIcon size={28} className="text-orange-500/60" />
              )}
            </div>
            <div>
              <div className="text-orange-500 text-xs font-semibold tracking-widest uppercase">Manji Studio</div>
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="primary">{projectTypeLabel(project.project_type)}</Badge>
                <Badge>{artStyleLabel(project.art_style)}</Badge>
                <Badge>{project.status}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/projects/${id}/edit`} className="btn-ghost text-sm">
              <Pencil size={15} className="mr-1" /> Edit
            </Link>
            <button onClick={handleDelete} className="btn-ghost text-sm text-red-400 hover:bg-red-500/10">
              <Trash2 size={15} className="mr-1" /> Delete
            </button>
          </div>
        </div>

        {/* Section navigation */}
        <div data-tour="workspace-nav" className="flex items-center gap-1 overflow-x-auto pb-2 mb-8 border-b border-[var(--color-border)]">
          {SECTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
                section === key
                  ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/5'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="card p-6">
          {section === 'overview' && (
            <div data-tour="workspace-overview" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">About</h2>
                <p className="text-white/60">{project.description || 'No description yet.'}</p>
              </div>
              {project.art_style === 'custom' && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-1">Art Style</h3>
                  <p className="text-white/60 text-sm">{project.art_style_description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Linked Story</div>
                  {project.story ? (
                    <>
                      <div className="text-white font-medium">{project.story.title}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Link to={`/create/${project.story.slug}/edit`} className="text-orange-400 text-xs hover:underline">
                          Edit story
                        </Link>
                        <Link to={`/create/${project.story.slug}/chapters`} className="text-orange-400 text-xs hover:underline">
                          Manage chapters
                        </Link>
                        <button onClick={handleUnlinkStory} className="text-red-400 text-xs hover:underline">
                          Unlink story
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="text-white/50 text-sm">No story linked yet.</div>
                      <button onClick={openStoryPicker} className="btn-primary text-sm justify-center" data-tour="link-story">
                        <Link2 size={14} className="mr-1.5" /> Link Existing Story
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === 'story' && <StorySection project={project} />}

          {section === 'scenes' && (
            <ScenesSection project={project} onOpenStoryboard={() => setSection('storyboard')} />
          )}

          {section === 'characters' && <CharactersSection project={project} />}

          {section === 'manji-ai' && <ManjiAiSection project={project} />}

          {section === 'assets' && <AssetsSection project={project} />}

          {section === 'storyboard' && <StoryboardSection project={project} />}

          {section === 'animation' && <AnimationSection project={project} />}

          {section === 'audio' && <AudioSection project={project} />}
        </div>
      </div>
    </MainLayout>
  )
}