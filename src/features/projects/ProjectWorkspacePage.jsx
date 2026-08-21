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
  Boxes, Sparkles, Pencil, Settings, Trash2, ArrowLeft,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { Spinner, Badge } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { useContextualTour } from '../tour/TourContext'
import { projectsService, artStyleLabel, projectTypeLabel } from './projectsService'
import StorySection from './StorySection'
import ScenesSection from '../scenes/ScenesSection'
import CharactersSection from '../characters/CharactersSection'
import ManjiAiSection from '../ai/ManjiAiSection'
import AssetsSection from '../assets/AssetsSection'
import StoryboardSection from '../storyboard/StoryboardSection'

const SECTIONS = [
  { key: 'overview',    label: 'Overview',   Icon: LayoutDashboard },
  { key: 'story',       label: 'Story',      Icon: BookOpen },
  { key: 'characters',  label: 'Characters', Icon: Users },
  { key: 'scenes',      label: 'Scenes',     Icon: Film },
  { key: 'storyboard',  label: 'Storyboard', Icon: Clapperboard },
  { key: 'animation',   label: 'Animation',  Icon: Boxes },
  { key: 'audio',       label: 'Audio',      Icon: AudioLines },
  { key: 'assets',      label: 'Assets',     Icon: Boxes },
  { key: 'manji-ai',    label: 'Manji AI',   Icon: Sparkles },
]

const COMING_SOON = ['animation', 'audio']

export default function ProjectWorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('overview')

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
                      <div className="flex gap-2 mt-2">
                        <Link to={`/create/${project.story.slug}/edit`} className="text-orange-400 text-xs hover:underline">
                          Edit story
                        </Link>
                        <Link to={`/create/${project.story.slug}/chapters`} className="text-orange-400 text-xs hover:underline">
                          Manage chapters
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-white/50 text-sm">No story linked yet. Story writing arrives in Phase 2.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === 'story' && <StorySection project={project} />}

          {section === 'scenes' && <ScenesSection project={project} />}

          {section === 'characters' && <CharactersSection project={project} />}

          {section === 'manji-ai' && <ManjiAiSection project={project} />}

          {section === 'assets' && <AssetsSection project={project} />}

          {section === 'storyboard' && <StoryboardSection project={project} />}

          {COMING_SOON.includes(section) && (
            <div className="py-10">
              <ManjiGuide
                expression="thinking"
                size="lg"
                animated="nod"
                title={SECTIONS.find((s) => s.key === section)?.label}
                body="This section is coming in a later phase of Manji Studio."
              >
                <button onClick={() => setSection('overview')} className="btn-secondary text-sm">
                  Back to overview
                </button>
              </ManjiGuide>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}