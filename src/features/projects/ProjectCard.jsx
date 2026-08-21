/**
 * ProjectCard – reusable card for the Projects list.
 * Uses the existing Manji card/badge styling.
 */

import { Link } from 'react-router-dom'
import { BookOpen, Clapperboard, Brush, PenTool, Palette } from 'lucide-react'
import { Badge } from '../../components/ui'
import { artStyleLabel, projectTypeLabel } from './projectsService'

const TYPE_ICONS = {
  story: BookOpen,
  comic: PenTool,
  manga: Brush,
  manhua: Palette,
  animation: Clapperboard,
}

export default function ProjectCard({ project }) {
  const TypeIcon = TYPE_ICONS[project.project_type] || BookOpen

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card group block overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Cover / placeholder */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-orange-500/20 to-purple-600/20">
        {project.cover ? (
          <img
            src={project.cover}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon size={48} className="text-orange-500/40 group-hover:text-orange-500/60 transition-colors" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge variant="primary">{projectTypeLabel(project.project_type)}</Badge>
          <Badge>{artStyleLabel(project.art_style)}</Badge>
        </div>
      </div>

      <div className="card-content">
        <h3 className="font-semibold text-white text-lg truncate group-hover:text-orange-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-white/50 text-sm line-clamp-2 mt-1">{project.description}</p>
        {project.story && (
          <p className="text-white/35 text-xs mt-2">
            Linked story: <span className="text-white/60">{project.story.title}</span>
          </p>
        )}
        <div className="flex items-center justify-between mt-3 text-white/35 text-xs">
          <span>{project.updated_at ? new Date(project.updated_at).toLocaleDateString() : ''}</span>
          <span className="uppercase tracking-wide">{project.status}</span>
        </div>
      </div>
    </Link>
  )
}